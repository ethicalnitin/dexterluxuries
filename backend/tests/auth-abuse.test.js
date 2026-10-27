const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { startTestServer, createUser } = require('./helpers');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { hashOtp } = require('../utils/otp');

let api;
before(async () => {
  api = await startTestServer();
});
after(async () => {
  await api.stop();
});

const login = (email, password, ip) => api.request('POST', '/api/auth/login', { body: { email, password }, ip });

describe('login brute-force protection', () => {
  it('locks one account from one IP after 10 attempts, with Retry-After', async () => {
    await createUser({ email: 'target@example.com', password: 'right-password' });
    for (let i = 0; i < 10; i++) {
      assert.equal((await login('target@example.com', `wrong-${i}`, '198.51.100.1')).status, 401);
    }
    const locked = await login('target@example.com', 'right-password', '198.51.100.1');
    assert.equal(locked.status, 429);
    assert.ok(locked.body.error);

    const res = await fetch(`${api.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.1' },
      body: JSON.stringify({ email: 'target@example.com', password: 'x' }),
    });
    assert.ok(Number(res.headers.get('retry-after')) > 0);
  });

  it("doesn't lock out the same account from another IP, or other accounts from the same IP", async () => {
    assert.equal((await login('target@example.com', 'right-password', '198.51.100.2')).status, 200);
    await createUser({ email: 'neighbour@example.com', password: 'neighbour-pass' });
    assert.equal((await login('neighbour@example.com', 'neighbour-pass', '198.51.100.1')).status, 200);
  });
});

describe('sign-up rate limit', () => {
  it('allows 10 sign-ups per IP per hour', async () => {
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const res = await api.request('POST', '/api/auth/signup', {
        body: { name: 'Bulk User', email: `bulk${i}@example.com`, password: 'password123' },
        ip: '198.51.100.20',
      });
      statuses.push(res.status);
    }
    assert.deepEqual(statuses, [...Array(10).fill(201), 429]);
  });
});

describe('password reset protection', () => {
  it('enforces a cooldown between reset emails', async () => {
    await createUser({ email: 'cooldown@example.com' });
    const first = await api.request('POST', '/api/auth/forgot-password', { body: { email: 'cooldown@example.com' }, ip: '198.51.100.30' });
    const second = await api.request('POST', '/api/auth/forgot-password', { body: { email: 'cooldown@example.com' }, ip: '198.51.100.30' });
    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.match(second.body.error, /wait \d+s/);
  });

  it('burns the code after 5 wrong guesses — even the right code is then refused', async () => {
    await createUser({ email: 'guess@example.com', password: 'original-pass' });
    await Otp.create({ email: 'guess@example.com', codeHash: hashOtp('424242') });
    const attempt = (otp) =>
      api.request('POST', '/api/auth/reset-password', {
        body: { email: 'guess@example.com', otp, password: 'new-password-1' },
        ip: '198.51.100.40',
      });

    for (let i = 0; i < 5; i++) assert.equal((await attempt(`00000${i}`)).status, 400);
    const exhausted = await attempt('424242');
    assert.equal(exhausted.status, 429);
    assert.equal(await Otp.countDocuments({ email: 'guess@example.com' }), 0);
    assert.equal((await login('guess@example.com', 'original-pass', '198.51.100.41')).status, 200);
  });
});

describe('token validation', () => {
  let user;
  before(async () => {
    ({ user } = await createUser({ email: 'tokens@example.com' }));
  });
  const me = (authorization) =>
    fetch(`${api.baseUrl}/api/auth/me`, { headers: authorization ? { Authorization: authorization } : {} }).then((r) => r.status);

  it('rejects expired tokens', async () => {
    const expired = jwt.sign({ sub: user._id.toString(), exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    assert.equal(await me(`Bearer ${expired}`), 401);
  });

  it('rejects unsigned ("alg: none") tokens', async () => {
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: user._id.toString() })}.`;
    assert.equal(await me(`Bearer ${unsigned}`), 401);
  });

  it('rejects tokens for deleted accounts and malformed headers', async () => {
    const { user: gone, token } = await createUser({ email: 'deleted@example.com' });
    await User.deleteOne({ _id: gone._id });
    assert.equal(await me(`Bearer ${token}`), 401);
    assert.equal(await me('Token abc'), 401);
    assert.equal(await me('Bearer '), 401);
    assert.equal(await me('Bearer not.a.jwt'), 401);
  });
});
