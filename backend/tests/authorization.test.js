const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, createUser } = require('./helpers');
const User = require('../models/User');
const Product = require('../models/productData');

let api;
let admin;
let customer;

const validProduct = (overrides = {}) => ({
  id: 101,
  name: 'Test Product',
  brand: 'TestBrand',
  category: 'Tools',
  description: '<p>Hello</p>',
  downloadLink: 'https://example.com/secret-download',
  plans: [
    { name: '3 Months', durationInMonths: 3, price: 5, strikeThroughPrice: 10 },
    { name: 'Lifetime', price: 20 },
  ],
  ...overrides,
});

before(async () => {
  api = await startTestServer();
  admin = await createUser({ email: 'admin@example.com', role: 'admin' });
  customer = await createUser({ email: 'customer@example.com' });
});
after(async () => {
  await api.stop();
});

describe('POST /api/products/add', () => {
  it('rejects anonymous requests with 401', async () => {
    const res = await api.request('POST', '/api/products/add', { body: validProduct() });
    assert.equal(res.status, 401);
    assert.equal(await Product.countDocuments(), 0);
  });

  it('rejects signed-in customers with 403', async () => {
    const res = await api.request('POST', '/api/products/add', { body: validProduct(), token: customer.token });
    assert.equal(res.status, 403);
    assert.equal(await Product.countDocuments(), 0);
  });

  it('lets an admin add a product, ignoring fields outside the allowlist', async () => {
    const res = await api.request('POST', '/api/products/add', {
      body: validProduct({ _id: '000000000000000000000001', createdAt: '2000-01-01T00:00:00Z' }),
      token: admin.token,
    });
    assert.equal(res.status, 201);
    assert.notEqual(res.body.product._id, '000000000000000000000001');
    assert.notEqual(new Date(res.body.product.createdAt).getFullYear(), 2000);
  });

  it('validates the product', async () => {
    const cases = [
      [validProduct({ id: undefined }), 400],
      [validProduct({ id: 'abc' }), 400],
      [validProduct({ id: 102, name: '' }), 400],
      [validProduct({ id: 102, brand: undefined }), 400],
      [validProduct({ id: 102, plans: [] }), 400],
      [validProduct({ id: 102, plans: [{ name: 'No price' }] }), 400],
      [validProduct({ id: 101 }), 409],
    ];
    for (const [body, status] of cases) {
      const res = await api.request('POST', '/api/products/add', { body, token: admin.token });
      assert.equal(res.status, status, `expected ${status} for ${JSON.stringify(body)}`);
      assert.ok(res.body.error);
    }
  });
});

describe('public product API', () => {
  it('never exposes downloadLink in the list', async () => {
    const res = await api.request('GET', '/api/products');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].name, 'Test Product');
    assert.equal('downloadLink' in res.body[0], false);
  });

  it('never exposes downloadLink for a single product (cached or not)', async () => {
    const res = await api.request('GET', '/api/products/101');
    assert.equal(res.status, 200);
    assert.equal('downloadLink' in res.body, false);
    const stored = await Product.findOne({ id: 101 }).lean();
    assert.equal(stored.downloadLink, 'https://example.com/secret-download');
  });

  it('returns 404 and 400 for missing and invalid ids, in the standard { error } shape', async () => {
    const missing = await api.request('GET', '/api/products/999');
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error, 'Product not found.');
    const invalid = await api.request('GET', '/api/products/abc');
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.error);
  });

  it('looks products up by id through an index, not a collection scan', async () => {
    const plan = await Product.findOne({ id: 101 }).explain('queryPlanner');
    const stages = JSON.stringify(plan.queryPlanner.winningPlan);
    assert.match(stages, /IXSCAN/);
    assert.doesNotMatch(stages, /COLLSCAN/);
  });

  it('serves /testwake (it used to be swallowed by /:id)', async () => {
    const res = await api.request('GET', '/api/products/testwake');
    assert.equal(res.status, 200);
  });

  it('answers unknown API routes with a JSON 404', async () => {
    const res = await api.request('GET', '/api/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Not found');
  });
});

describe('admin API', () => {
  const delivery = {
    customerEmail: 'buyer@example.com',
    productName: 'Test Product',
    planDuration: '3 Months',
    driveLink: 'https://drive.google.com/file/d/abc/view',
    message: 'Thanks!',
  };

  it('hides delivery presets from anonymous users and customers', async () => {
    assert.equal((await api.request('GET', '/api/admin/delivery-presets')).status, 401);
    assert.equal((await api.request('GET', '/api/admin/delivery-presets', { token: customer.token })).status, 403);
  });

  it('serves delivery presets to admins', async () => {
    const res = await api.request('GET', '/api/admin/delivery-presets', { token: admin.token });
    assert.equal(res.status, 200);
    assert.ok(res.body.presets.length > 0);
    for (const p of res.body.presets) {
      assert.ok(p.label && p.duration && p.link.startsWith('https://'));
    }
  });

  it('only lets admins send deliveries', async () => {
    assert.equal((await api.request('POST', '/api/admin/deliveries', { body: delivery })).status, 401);
    assert.equal((await api.request('POST', '/api/admin/deliveries', { body: delivery, token: customer.token })).status, 403);
    const res = await api.request('POST', '/api/admin/deliveries', { body: delivery, token: admin.token });
    assert.equal(res.status, 201);
  });

  it('validates deliveries', async () => {
    const cases = [
      { ...delivery, customerEmail: 'nope' },
      { ...delivery, productName: '' },
      { ...delivery, planDuration: '' },
      { ...delivery, driveLink: 'javascript:alert(1)' },
      { ...delivery, driveLink: 'http://insecure.example.com' },
      { ...delivery, message: 'x'.repeat(2001) },
    ];
    for (const body of cases) {
      const res = await api.request('POST', '/api/admin/deliveries', { body, token: admin.token });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body).slice(0, 120)}`);
    }
  });

  it('reads the role from the database on every request', async () => {
    const temp = await createUser({ email: 'temp-admin@example.com', role: 'admin' });
    assert.equal((await api.request('GET', '/api/admin/delivery-presets', { token: temp.token })).status, 200);
    await User.updateOne({ _id: temp.user._id }, { role: 'customer' });
    assert.equal((await api.request('GET', '/api/admin/delivery-presets', { token: temp.token })).status, 403);
  });
});
