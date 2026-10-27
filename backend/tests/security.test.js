const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startTestServer, createUser } = require('./helpers');

let api;
let customer;

before(async () => {
  api = await startTestServer();
  customer = await createUser({ email: 'headers@example.com' });
});
after(async () => {
  await api.stop();
});

const raw = (path, headers = {}) => fetch(api.baseUrl + path, { headers });

describe('security headers', () => {
  it('sets the baseline headers on every response and hides the framework', async () => {
    const res = await raw('/health');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok(res.headers.get('permissions-policy'));
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  it("gives API responses a CSP that can't render anything", async () => {
    const res = await raw('/api/products');
    assert.equal(res.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'");
  });

  it('only sends HSTS over HTTPS (as reported by the proxy)', async () => {
    assert.equal((await raw('/health')).headers.get('strict-transport-security'), null);
    const https = await raw('/health', { 'X-Forwarded-Proto': 'https' });
    assert.match(https.headers.get('strict-transport-security'), /^max-age=\d+/);
  });

  it('forbids caching of auth, admin and order responses but not the catalog', async () => {
    const me = await raw('/api/auth/me', { Authorization: `Bearer ${customer.token}` });
    assert.equal(me.status, 200);
    assert.equal(me.headers.get('cache-control'), 'no-store');
    assert.equal((await raw('/api/admin/delivery-presets')).headers.get('cache-control'), 'no-store');
    assert.notEqual((await raw('/api/products')).headers.get('cache-control'), 'no-store');
  });
});

describe('request ids', () => {
  it('assigns one to every response', async () => {
    const res = await raw('/api/products');
    assert.match(res.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  });

  it('keeps a safe upstream id and replaces an unsafe one', async () => {
    assert.equal((await raw('/health', { 'X-Request-Id': 'edge-abc_123' })).headers.get('x-request-id'), 'edge-abc_123');
    const unsafe = await raw('/health', { 'X-Request-Id': 'bad id\r\nX-Injected: 1' }).catch(() => null);
    if (unsafe) assert.notEqual(unsafe.headers.get('x-request-id'), 'bad id\r\nX-Injected: 1');
    const tooLong = await raw('/health', { 'X-Request-Id': 'a'.repeat(200) });
    assert.notEqual(tooLong.headers.get('x-request-id'), 'a'.repeat(200));
  });
});

describe('global API rate limit', () => {
  it('caps one client at 300 API requests a minute and says when to retry', async () => {
    const ip = '203.0.113.50';
    let last;
    for (let i = 0; i < 301; i++) {
      last = await fetch(`${api.baseUrl}/api/does-not-exist`, { headers: { 'X-Forwarded-For': ip } });
    }
    assert.equal(last.status, 429);
    assert.ok(Number(last.headers.get('retry-after')) > 0);
    assert.ok((await last.json()).error);
    const other = await fetch(`${api.baseUrl}/api/does-not-exist`, { headers: { 'X-Forwarded-For': '203.0.113.51' } });
    assert.equal(other.status, 404);
  });

  it('never rate-limits health checks', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await raw('/health', { 'X-Forwarded-For': '203.0.113.50' })).status, 200);
  });
});

describe('unknown routes', () => {
  it('answer with the standard JSON error shape', async () => {
    const res = await api.request('GET', '/api/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Not found' });
  });
});

describe('health checks', () => {
  it('reports liveness without touching the database', async () => {
    const res = await api.request('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(typeof res.body.uptime, 'number');
  });

  it('reports ready while the database is connected, and 503 once it is not', async () => {
    const ready = await api.request('GET', '/health/ready');
    assert.equal(ready.status, 200);
    assert.deepEqual(ready.body, { status: 'ready', db: 'connected' });

    await mongoose.disconnect();
    const down = await api.request('GET', '/health/ready');
    assert.equal(down.status, 503);
    assert.equal(down.body.db, 'disconnected');
  });
});
