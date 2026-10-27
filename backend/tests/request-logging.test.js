const { it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.LOG_LEVEL = 'debug';
process.env.LOG_FORMAT = 'json';

const { startTestServer, createUser } = require('./helpers');

let api;
let lines = [];
let restore;

before(async () => {
  api = await startTestServer();
  const original = process.stdout.write;
  process.stdout.write = (chunk, ...rest) => {
    const text = String(chunk);
    if (text.startsWith('{"time"')) {
      lines.push(JSON.parse(text));
      return true;
    }
    return original.call(process.stdout, chunk, ...rest);
  };
  restore = () => {
    process.stdout.write = original;
  };
});
after(async () => {
  restore();
  await api.stop();
});

const settle = () => new Promise((r) => setImmediate(r));

it('logs router-handled requests with their full path and no client details', async () => {
  const { token } = await createUser({ email: 'logged@example.com', password: 'super-secret-pw' });
  lines = [];
  await api.request('GET', '/api/products');
  await api.request('GET', '/api/auth/me', { token });
  await api.request('POST', '/api/auth/login', { body: { email: 'logged@example.com', password: 'super-secret-pw' } });
  await api.request('GET', '/health');
  await settle();

  const requests = lines.filter((l) => l.msg === 'request');
  assert.deepEqual(
    requests.map((l) => `${l.level} ${l.method} ${l.path} ${l.status}`),
    ['info GET /api/products 200', 'info GET /api/auth/me 200', 'info POST /api/auth/login 200', 'debug GET /health 200']
  );
  for (const line of requests) {
    assert.match(line.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(typeof line.ms, 'number');
    assert.deepEqual(Object.keys(line).sort(), ['level', 'method', 'ms', 'msg', 'path', 'requestId', 'status', 'time']);
  }
  const everything = JSON.stringify(lines);
  assert.ok(!everything.includes('super-secret-pw'));
  assert.ok(!everything.includes(token));
});
