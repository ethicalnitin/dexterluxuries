const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ALLOWED_ORIGINS = 'https://shop.example,https://www.shop.example';

const app = require('../app');

let server;
let baseUrl;
before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const preflight = (origin) =>
  fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });

describe('CORS allow-list', () => {
  it('allows listed origins and lets browsers cache the preflight', async () => {
    const res = await preflight('https://www.shop.example');
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://www.shop.example');
    assert.equal(res.headers.get('access-control-max-age'), '600');
    assert.match(res.headers.get('access-control-allow-headers'), /Authorization/);
  });

  it('gives other origins no CORS grant', async () => {
    const res = await preflight('https://evil.example');
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    const get = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(get.headers.get('access-control-allow-origin'), null);
  });

  it('lets allowed origins read the request id and Retry-After headers', async () => {
    const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://shop.example' } });
    assert.match(res.headers.get('access-control-expose-headers'), /X-Request-Id/);
    assert.match(res.headers.get('access-control-expose-headers'), /Retry-After/);
  });
});
