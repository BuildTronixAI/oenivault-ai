/**
 * Asserts this branch's HTTP surface is a superset of Phase 1 (main) routes.
 * Pure static check — no DB required.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

function collectRouteMounts(indexSrc: string): string[] {
  const mounts: string[] = [];
  const re = /app\.use\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(indexSrc))) mounts.push(m[1]);
  return mounts;
}

function collectRouterMethods(routeFile: string): string[] {
  const src = fs.readFileSync(routeFile, 'utf8');
  const methods: string[] = [];
  const re = /router\.(get|post|patch|put|delete)\(\s*['`]([^'`]+)['`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) methods.push(`${m[1].toUpperCase()} ${m[2]}`);
  return methods;
}

describe('Phase 1 route surface superset', () => {
  it('keeps all Phase 1 API mounts', () => {
    const indexSrc = fs.readFileSync(path.join(ROOT, 'src/app.ts'), 'utf8');
    const mounts = collectRouteMounts(indexSrc);
    for (const required of [
      '/api/auth',
      '/api/inventory',
      '/api/collections',
      '/api/customers',
      '/api/climate',
    ]) {
      assert.ok(mounts.includes(required), `missing mount ${required}`);
    }
  });

  it('keeps Phase 1 auth endpoints', () => {
    const methods = collectRouterMethods(path.join(ROOT, 'src/routes/auth.ts'));
    for (const required of [
      'POST /signup',
      'POST /login',
      'POST /logout',
      'POST /refresh',
      'GET /me',
      'POST /change-password',
    ]) {
      assert.ok(methods.includes(required), `missing auth route ${required}`);
    }
  });

  it('keeps Phase 1 inventory CRUD endpoints', () => {
    const methods = collectRouterMethods(path.join(ROOT, 'src/routes/inventory.ts'));
    for (const required of ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'DELETE /:id']) {
      assert.ok(methods.includes(required), `missing inventory route ${required}`);
    }
  });

  it('keeps Phase 1 customers admin endpoints', () => {
    const methods = collectRouterMethods(path.join(ROOT, 'src/routes/customers.ts'));
    for (const required of ['GET /', 'POST /', 'GET /:id', 'PATCH /:id']) {
      assert.ok(methods.includes(required), `missing customers route ${required}`);
    }
  });

  it('keeps Phase 1 climate stub endpoints', () => {
    const methods = collectRouterMethods(path.join(ROOT, 'src/routes/climate.ts'));
    for (const required of ['GET /readings', 'GET /alerts', 'POST /alerts', 'PATCH /alerts/:id']) {
      assert.ok(methods.includes(required), `missing climate route ${required}`);
    }
  });
});
