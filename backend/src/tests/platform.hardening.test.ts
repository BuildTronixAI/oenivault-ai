/**
 * Platform hardening — auth reset/invite, soft-delete, prefs, security headers.
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
let pool: { end: () => Promise<void>; query: (sql: string, params?: unknown[]) => Promise<{ rows: Json[]; rowCount: number | null }> };

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  return res.json as { accessToken: string; user: Json };
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

describe('platform hardening — auth', () => {
  it('forgot-password always returns ok and stores a token for known emails', async () => {
    const res = await request('POST', '/api/auth/forgot-password', {
      email: 'collector@example.com',
    });
    assert.equal(res.status, 200);

    const tokens = await pool.query(
      `SELECT prt.id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = $1
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      ['collector@example.com']
    );
    assert.ok((tokens.rowCount ?? 0) > 0);
  });

  it('admin invite + accept-invite creates a customer session', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');
    const email = `invitee-${Date.now()}@example.com`;
    const invite = await request(
      'POST',
      '/api/customers/invite',
      {
        email,
        fullName: 'Invitee User',
        facilityId: 'a0000000-0000-4000-8000-000000000001',
      },
      accessToken
    );
    assert.equal(invite.status, 201, invite.text);
    const inviteToken = invite.json?.inviteToken as string | undefined;
    assert.ok(inviteToken, 'invite token missing from response');

    const accept = await request('POST', '/api/auth/accept-invite', {
      token: inviteToken,
      password: 'Invitee123!',
    });
    assert.equal(accept.status, 201, accept.text);
    assert.equal((accept.json?.user as Json)?.role, 'customer');
    assert.ok(accept.json?.accessToken);
  });
});

describe('platform hardening — inventory & prefs', () => {
  it('soft-deletes wine from inventory listing', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const coll = await request('GET', '/api/collections', undefined, accessToken);
    const collectionId = (coll.json?.collections as Json[])[0].id as string;

    const created = await request(
      'POST',
      '/api/inventory',
      {
        collectionId,
        name: 'Hardening Soft Delete',
        vintage: 2018,
        region: 'Stellenbosch',
        varietal: 'Pinotage',
        quantity: 1,
        locationCode: 'H-1',
        estimatedValue: 55,
      },
      accessToken
    );
    assert.equal(created.status, 201);
    const wineId = (created.json?.wine as Json).id as string;

    const deleted = await request('DELETE', `/api/inventory/${wineId}`, undefined, accessToken);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.json?.softDeleted, true);

    const listed = await request('GET', '/api/inventory', undefined, accessToken);
    const wines = listed.json?.wines as Json[];
    assert.ok(!wines.some((w) => w.id === wineId));
  });

  it('imports wines from CSV', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const coll = await request('GET', '/api/collections', undefined, accessToken);
    const collectionId = (coll.json?.collections as Json[])[0].id as string;
    const csv = [
      'name,vintage,region,varietal,quantity,location_code,estimated_value',
      'CSV Cabernet,2019,Paarl,Cabernet,2,B2,220',
    ].join('\n');

    const res = await request(
      'POST',
      '/api/inventory/import',
      { csv, collectionId },
      accessToken
    );
    assert.equal(res.status, 201, res.text);
    assert.ok(Number(res.json?.imported) >= 1);
  });

  it('saves notification preferences', async () => {
    const { accessToken } = await login('collector@example.com', 'Customer123!');
    const res = await request(
      'PATCH',
      '/api/preferences',
      { emailAlerts: true, emailDigest: false, inAppAlerts: true },
      accessToken
    );
    assert.equal(res.status, 200, res.text);
    const prefs = res.json?.preferences as Json;
    assert.ok(prefs);
  });
});

describe('platform hardening — climate & security', () => {
  it('admin can mute alerts and acknowledge', async () => {
    const { accessToken } = await login('admin@oenivault.ai', 'Admin123!');

    const mute = await request(
      'POST',
      '/api/climate/mutes',
      { hours: 1, alertType: 'temperature_high' },
      accessToken
    );
    assert.equal(mute.status, 201, mute.text);

    const alertInsert = await pool.query(
      `INSERT INTO alerts (facility_id, alert_type, severity, message)
       VALUES ('a0000000-0000-4000-8000-000000000001', 'temperature_high', 'critical', 'Hardening test alert')
       RETURNING id`
    );
    const alertId = alertInsert.rows[0].id as string;

    const ack = await request(
      'PATCH',
      `/api/climate/alerts/${alertId}/ack`,
      {},
      accessToken
    );
    assert.equal(ack.status, 200, ack.text);
    const alert = ack.json?.alert as Json;
    assert.ok(alert?.acknowledged_at || alert?.acknowledgedAt);
  });

  it('sets security headers on health', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('x-request-id'));
  });
});
