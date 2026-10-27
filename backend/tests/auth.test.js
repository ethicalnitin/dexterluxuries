const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, createUser } = require('./helpers');
const jwt = require('jsonwebtoken');
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

describe('POST /api/auth/signup', () => {
  it('creates a customer account and returns a session', async () => {
    const res = await api.request('POST', '/api/auth/signup', {
      body: { name: 'New Buyer', email: 'New.Buyer@Example.com', password: 'longenough1' },
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.deepEqual(Object.keys(res.body.user).sort(), ['email', 'id', 'name', 'role']);
    assert.equal(res.body.user.email, 'new.buyer@example.com');
    assert.equal(res.body.user.role, 'customer');
  });

  it('ignores a role sent in the request body', async () => {
    const res = await api.request('POST', '/api/auth/signup', {
      body: { name: 'Sneaky', email: 'sneaky@example.com', password: 'longenough1', role: 'admin' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'customer');
    const stored = await User.findOne({ email: 'sneaky@example.com' });
    assert.equal(stored.role, 'customer');
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await api.request('POST', '/api/auth/signup', {
      body: { name: 'Again', email: 'new.buyer@example.com', password: 'longenough1' },
    });
    assert.equal(res.status, 409);
  });

  it('validates name, email and password', async () => {
    const cases = [
      { name: 'A', email: 'a@example.com', password: 'longenough1' },
      { name: 'Valid Name', email: 'not-an-email', password: 'longenough1' },
      { name: 'Valid Name', email: 'short@example.com', password: 'short' },
      { name: 'Valid Name', email: 'object@example.com', password: { $gt: '' } },
    ];
    for (const body of cases) {
      const res = await api.request('POST', '/api/auth/signup', { body });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
      assert.ok(res.body.error);
    }
  });
});

describe('POST /api/auth/login', () => {
  before(async () => {
    await createUser({ email: 'login@example.com', password: 'correct-horse' });
  });

  it('logs in with the right password', async () => {
    const res = await api.request('POST', '/api/auth/login', {
      body: { email: 'LOGIN@example.com', password: 'correct-horse' },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'login@example.com');
    assert.equal(res.body.user.role, 'customer');
  });

  it('rejects a wrong password and an unknown email with the same 401', async () => {
    const wrong = await api.request('POST', '/api/auth/login', { body: { email: 'login@example.com', password: 'nope-nope' } });
    const unknown = await api.request('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: 'nope-nope' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error, unknown.body.error);
  });

  it('rejects malformed JSON with 400, not 500', async () => {
    const res = await api.request('POST', '/api/auth/login', { rawBody: '{"email": ' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const res = await api.request('GET', '/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('rejects a token signed with another secret', async () => {
    const { user } = await createUser({ email: 'forged@example.com' });
    const forged = jwt.sign({ sub: user._id.toString() }, 'not-the-secret');
    const res = await api.request('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
  });

  it('returns the profile, including role, for a valid token', async () => {
    const { token } = await createUser({ email: 'me@example.com', name: 'Me Myself', role: 'admin' });
    const res = await api.request('GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.user, { id: res.body.user.id, name: 'Me Myself', email: 'me@example.com', role: 'admin' });
  });

  it('treats accounts created before roles existed as customers', async () => {
    const { user, token } = await createUser({ email: 'legacy@example.com' });
    await User.collection.updateOne({ _id: user._id }, { $unset: { role: '' } });
    const res = await api.request('GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'customer');
  });
});

describe('password reset', () => {
  it('answers the same way for unknown emails (no account enumeration)', async () => {
    const res = await api.request('POST', '/api/auth/forgot-password', { body: { email: 'ghost@example.com' } });
    assert.equal(res.status, 200);
    assert.equal(await Otp.countDocuments({ email: 'ghost@example.com' }), 0);
  });

  it('stores a hashed code for a real account', async () => {
    await createUser({ email: 'forgot@example.com' });
    const res = await api.request('POST', '/api/auth/forgot-password', { body: { email: 'forgot@example.com' } });
    assert.equal(res.status, 200);
    const otp = await Otp.findOne({ email: 'forgot@example.com' });
    assert.ok(otp);
    assert.match(otp.codeHash, /^[0-9a-f]{64}$/);
  });

  it('resets the password with a valid code and signs out older sessions', async () => {
    const { user } = await createUser({ email: 'reset@example.com', password: 'old-password' });
    const oldToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, iat: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    assert.equal((await api.request('GET', '/api/auth/me', { token: oldToken })).status, 200);

    await Otp.create({ email: 'reset@example.com', codeHash: hashOtp('123456') });

    const wrong = await api.request('POST', '/api/auth/reset-password', {
      body: { email: 'reset@example.com', otp: '000000', password: 'new-password' },
    });
    assert.equal(wrong.status, 400);

    const res = await api.request('POST', '/api/auth/reset-password', {
      body: { email: 'reset@example.com', otp: '123456', password: 'new-password' },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);

    const reuse = await api.request('POST', '/api/auth/reset-password', {
      body: { email: 'reset@example.com', otp: '123456', password: 'another-password' },
    });
    assert.equal(reuse.status, 400);

    assert.equal((await api.request('GET', '/api/auth/me', { token: oldToken })).status, 401);
    assert.equal((await api.request('GET', '/api/auth/me', { token: res.body.token })).status, 200);

    const login = await api.request('POST', '/api/auth/login', { body: { email: 'reset@example.com', password: 'new-password' } });
    assert.equal(login.status, 200);
  });
});
