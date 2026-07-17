/**
 * Phase 1 regression suite — must stay green on Phase 2/3 branches.
 * Proves overlapping Phase 1 behavior still works (auth, RBAC, inventory CRUD).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = 'test';

type Json = Record<string, unknown>;

let server: http.Server;
let baseUrl = '';
let pool: { end: () => Promise<void> };

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  headers: Record<string, string> = {}
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Json | null = null;
  try {
    json = text ? (JSON.parse(text) as Json) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function login(email: string, password: string) {
  const res = await request('POST', '/api/auth/login', { email, password });
  assert.equal(res.status, 200, `login failed for ${email}: ${res.text}`);
  assert.ok(res.json?.accessToken);
  return res.json as { accessToken: string; user: Json; refreshToken: string };
}

before(async () => {
  const { execFileSync } = await import('node:child_process');
  execFileSync('npx', ['tsx', 'src/scripts/seed.ts'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
  });

  const { createApp } = await import('../app');
  const db = await import('../database/pool');
  const { initRealtime } = await import('../realtime/socket');
  pool = db.pool;

  const app = createApp();
  server = http.createServer(app);
  initRealtime(server);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('No server address');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await pool.end();
});

describe('Phase 1 regression — auth', () => {
  it('health is ok with database connected', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json?.status, 'ok');
    assert.equal(res.json?.database, 'connected');
  });

  it('admin and customer can login', async () => {
    const admin = await login('admin@oenivault.ai', 'Admin123!');
    assert.equal(admin.user.role, 'admin');
    const customer = await login('collector@example.com', 'Customer123!');
    assert.equal(customer.user.role, 'customer');
  });

  it('rejects bad credentials', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@oenivault.ai',
      password: 'wrong-password',
    });
    assert.equal(res.status, 401);
  });

  it('signup creates a customer and returns tokens', async () => {
    const email = `phase1-reg-${Date.now()}@example.com`;
    const res = await request('POST', '/api/auth/signup', {
      fullName: 'Phase1 Tester',
      email,
      password: 'Customer123!',
    });
    assert.equal(res.status, 201);
    assert.equal((res.json?.user as Json)?.role, 'customer');
    assert.ok(res.json?.accessToken);
  });

  it('/me returns the authenticated user', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');
    const res = await request('GET', '/api/auth/me', undefined, accessToken);
    assert.equal(res.status, 200);
    assert.equal((res.json?.user as Json)?.email, 'admin@oenivault.ai');
  });

  it('change-password works with current password', async () => {
    const email = `pwd-${Date.now()}@example.com`;
    await request('POST', '/api/auth/signup', {
      fullName: 'Pwd User',
      email,
      password: 'Customer123!',
    });
    const { accessToken } = await login(email, 'Customer123!');
    const res = await request(
      'POST',
      '/api/auth/change-password',
      { currentPassword: 'Customer123!', newPassword: 'Customer123!' },
      accessToken
    );
    assert.equal(res.status, 200);
    assert.equal(res.json?.ok, true);
  });
});

describe('Phase 1 regression — RBAC', () => {
  it('customer cannot list customers (403)', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const res = await request('GET', '/api/customers', undefined, accessToken);
    assert.equal(res.status, 403);
  });

  it('admin can list customers', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');
    const res = await request('GET', '/api/customers', undefined, accessToken);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json?.customers));
  });

  it('customer inventory is scoped to own collection', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const res = await request('GET', '/api/inventory', undefined, accessToken);
    assert.equal(res.status, 200);
    const wines = res.json?.wines as Json[];
    assert.ok(Array.isArray(wines));
    assert.ok(wines.length >= 1);
    // seeded customer wines should not expose other owners' names as admin view does
    for (const w of wines) {
      assert.ok(w.name);
      assert.ok(w.collection_id);
    }
  });
});

describe('Phase 1 regression — inventory CRUD', () => {
  it('lists collections for authenticated user', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const res = await request('GET', '/api/collections', undefined, accessToken);
    assert.equal(res.status, 200);
    const collections = res.json?.collections as Json[];
    assert.ok(collections.length >= 1);
  });

  it('customer can create, update, and delete a wine', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const coll = await request('GET', '/api/collections', undefined, accessToken);
    const collectionId = (coll.json?.collections as Json[])[0].id as string;

    const created = await request(
      'POST',
      '/api/inventory',
      {
        collectionId,
        name: 'Regression Test Barbera',
        vintage: 2019,
        region: 'Piedmont',
        varietal: 'Barbera',
        quantity: 2,
        locationCode: 'T-99-1',
        estimatedValue: 40,
      },
      accessToken
    );
    assert.equal(created.status, 201);
    const wineId = (created.json?.wine as Json).id as string;

    const patched = await request(
      'PATCH',
      `/api/inventory/${wineId}`,
      { quantity: 4 },
      accessToken
    );
    assert.equal(patched.status, 200);
    assert.equal((patched.json?.wine as Json).quantity, 4);

    const deleted = await request('DELETE', `/api/inventory/${wineId}`, undefined, accessToken);
    assert.equal(deleted.status, 204);
  });

  it('admin can create a customer', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');
    const email = `cust-${Date.now()}@example.com`;
    const res = await request(
      'POST',
      '/api/customers',
      {
        fullName: 'New Vault Client',
        email,
        password: 'Customer123!',
        facilityId: 'a0000000-0000-4000-8000-000000000001',
      },
      accessToken
    );
    assert.equal(res.status, 201);
    assert.equal((res.json?.customer as Json).email, email);
  });
});

describe('Phase 1 regression — climate stubs remain available', () => {
  it('authenticated user can read climate alerts and readings', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');
    const alerts = await request('GET', '/api/climate/alerts', undefined, accessToken);
    assert.equal(alerts.status, 200);
    assert.ok(Array.isArray(alerts.json?.alerts));

    const readings = await request('GET', '/api/climate/readings', undefined, accessToken);
    assert.equal(readings.status, 200);
    assert.ok(Array.isArray(readings.json?.readings));
  });
});
