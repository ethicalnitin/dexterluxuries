const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, createUser } = require('./helpers');
const Product = require('../models/productData');
const UtrSubmission = require('../models/UtrSubmission');
const Cart = require('../models/Cart');
const { USD_TO_INR_RATE, MAX_ITEM_QUANTITY, MAX_CART_LINES } = require('../config/pricing');

let api;
let ipCounter = 1;
const nextIp = () => `10.1.0.${ipCounter++}`;
let utrCounter = 200000000000;
const nextUtr = () => String(utrCounter++);

const quote = (items, ip = nextIp()) => api.request('POST', '/api/cart/quote', { body: { items }, ip });
const confirm = (body) => api.request('POST', '/api/orders/confirm', { body, ip: nextIp() });

before(async () => {
  api = await startTestServer();
  await Product.create([
    {
      id: 11,
      name: 'Chart Tool',
      brand: 'B',
      category: 'Tools',
      image: 'https://example.com/chart.png',
      plans: [
        { name: '1 Month', durationInMonths: 1, price: 9 },
        { name: '12 Months', durationInMonths: 12, price: 72.5 },
        { name: 'Lifetime', price: 150, available: false },
      ],
    },
    { id: 12, name: 'Course', brand: 'B', plans: [{ name: 'Lifetime access', price: 19 }] },
  ]);
  await Product.collection.insertOne({ id: 13, name: 'Sold Out', brand: 'B', stock: false, plans: [{ name: '1 Month', price: 5 }] });
});
after(async () => {
  await api.stop();
});

describe('POST /api/cart/quote', () => {
  it('prices every line from the catalog and totals in rupees', async () => {
    const res = await quote([
      { productId: 11, planIndex: 1, planName: '12 Months', quantity: 2 },
      { productId: 12, planIndex: 0, quantity: 1 },
    ]);
    assert.equal(res.status, 200);
    const [chart, course] = res.body.items;
    assert.equal(chart.status, 'ok');
    assert.equal(chart.productName, 'Chart Tool');
    assert.equal(chart.unitPrice, 72.5);
    assert.equal(chart.unitPriceInr, Math.round(72.5 * USD_TO_INR_RATE));
    assert.equal(chart.lineTotalInr, chart.unitPriceInr * 2);
    assert.equal(course.lineTotalInr, 19 * USD_TO_INR_RATE);
    assert.equal(res.body.totalInr, chart.lineTotalInr + course.lineTotalInr);
    assert.equal(res.body.subtotal, 72.5 * 2 + 19);
    assert.equal(res.body.allAvailable, true);
    assert.equal(res.body.usdToInrRate, USD_TO_INR_RATE);
  });

  it('marks sold-out plans and products unavailable and leaves them out of the total', async () => {
    const res = await quote([
      { productId: 11, planIndex: 2, quantity: 1 },
      { productId: 13, planIndex: 0, quantity: 1 },
      { productId: 12, planIndex: 0, quantity: 1 },
    ]);
    assert.deepEqual(res.body.items.map((l) => l.status), ['unavailable', 'unavailable', 'ok']);
    assert.equal(res.body.items[0].unitPriceInr, 150 * USD_TO_INR_RATE);
    assert.equal(res.body.totalInr, 19 * USD_TO_INR_RATE);
    assert.equal(res.body.allAvailable, false);
  });

  it('reports products and plans that no longer exist', async () => {
    const res = await quote([
      { productId: 999, planIndex: 0, quantity: 1 },
      { productId: 11, planIndex: 7, planName: 'Gone', quantity: 1 },
    ]);
    assert.deepEqual(res.body.items.map((l) => l.status), ['not_found', 'not_found']);
    assert.equal(res.body.totalInr, 0);
  });

  it('finds a plan by name when its index is stale', async () => {
    const res = await quote([{ productId: 11, planIndex: 0, planName: '12 Months', quantity: 1 }]);
    assert.equal(res.body.items[0].planIndex, 1);
    assert.equal(res.body.items[0].unitPrice, 72.5);
  });

  it('accepts an empty cart', async () => {
    const res = await quote([]);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.items, []);
    assert.equal(res.body.totalInr, 0);
    assert.equal(res.body.allAvailable, false);
  });

  it('rejects malformed carts with 400', async () => {
    const tooMany = Array.from({ length: MAX_CART_LINES + 1 }, (_, i) => ({ productId: 11, planIndex: 0, quantity: 1, n: i }));
    const cases = [
      'nope',
      [{ productId: 'abc', planIndex: 0 }],
      [{ productId: true, planIndex: 0 }],
      [{ productId: 11, planIndex: 0, quantity: 0 }],
      [{ productId: 11, planIndex: 0, quantity: MAX_ITEM_QUANTITY + 1 }],
      [{ productId: 11, planIndex: 0, quantity: 1.5 }],
      [{ productId: 11 }],
      [{ productId: 11, planName: 'x'.repeat(101) }],
      tooMany,
    ];
    for (const items of cases) {
      const res = await quote(items);
      assert.equal(res.status, 400, JSON.stringify(items).slice(0, 80));
      assert.ok(res.body.error);
    }
  });
});

describe('GET/PUT /api/cart', () => {
  it('requires a session', async () => {
    assert.equal((await api.request('GET', '/api/cart')).status, 401);
    assert.equal((await api.request('PUT', '/api/cart', { body: { items: [] } })).status, 401);
  });

  it('saves and returns a customer cart, one line per product + plan', async () => {
    const { token } = await createUser({ email: 'cart-a@example.com' });
    assert.deepEqual((await api.request('GET', '/api/cart', { token })).body, { items: [] });

    const put = await api.request('PUT', '/api/cart', {
      token,
      body: {
        items: [
          { productId: 11, planIndex: 0, planName: '1 Month', quantity: 1, unitPrice: 9 },
          { productId: 11, planIndex: 0, planName: '1 Month', quantity: 3, unitPrice: 9 },
          { productId: 12, planIndex: 0, quantity: 2, unitPrice: 'free' },
        ],
      },
    });
    assert.equal(put.status, 200);
    assert.deepEqual(put.body.items, [
      { productId: 11, planIndex: 0, planName: '1 Month', quantity: 3, unitPrice: 9 },
      { productId: 12, planIndex: 0, quantity: 2 },
    ]);
    assert.deepEqual((await api.request('GET', '/api/cart', { token })).body, put.body);

    const emptied = await api.request('PUT', '/api/cart', { token, body: { items: [] } });
    assert.deepEqual(emptied.body, { items: [] });
    assert.equal(await Cart.countDocuments(), 1);
  });

  it("keeps each customer's cart separate", async () => {
    const a = await createUser({ email: 'cart-b@example.com' });
    const b = await createUser({ email: 'cart-c@example.com' });
    await api.request('PUT', '/api/cart', { token: a.token, body: { items: [{ productId: 12, planIndex: 0, quantity: 1 }] } });
    assert.deepEqual((await api.request('GET', '/api/cart', { token: b.token })).body, { items: [] });
  });

  it('validates saved carts like quotes', async () => {
    const { token } = await createUser({ email: 'cart-d@example.com' });
    const res = await api.request('PUT', '/api/cart', { token, body: { items: [{ productId: 11, planIndex: 0, quantity: 99 }] } });
    assert.equal(res.status, 400);
  });
});

describe('POST /api/orders/confirm with cart items', () => {
  const cartOrder = (overrides = {}) => ({
    items: [
      { productId: 11, planIndex: 1, planName: '12 Months', quantity: 2 },
      { productId: 12, planIndex: 0, quantity: 1 },
    ],
    amount: Math.round(72.5 * USD_TO_INR_RATE) * 2 + 19 * USD_TO_INR_RATE,
    email: 'buyer@example.com',
    orderRef: 'DX-CART01',
    utr: nextUtr(),
    method: 'UPI',
    ...overrides,
  });

  it('records every line priced by the server', async () => {
    const body = cartOrder();
    const res = await confirm(body);
    assert.equal(res.status, 200);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.items.length, 2);
    assert.deepEqual(
      saved.items.map(({ productName, planName, quantity, status }) => ({ productName, planName, quantity, status })),
      [
        { productName: 'Chart Tool', planName: '12 Months', quantity: 2, status: 'ok' },
        { productName: 'Course', planName: 'Lifetime access', quantity: 1, status: 'ok' },
      ]
    );
    assert.equal(saved.expectedAmount, body.amount);
    assert.equal(saved.amountMismatch, false);
    assert.equal(saved.hasUnavailableItems, false);
    assert.equal(saved.productName, 'Chart Tool + 1 more');
  });

  it('flags a tampered amount and lines that sold out, without trapping the buyer', async () => {
    const body = cartOrder({ items: [{ productId: 13, planIndex: 0, quantity: 1 }], amount: 1 });
    const res = await confirm(body);
    assert.equal(res.status, 200);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.expectedAmount, 5 * USD_TO_INR_RATE);
    assert.equal(saved.amountMismatch, true);
    assert.equal(saved.hasUnavailableItems, true);
    assert.equal(saved.productName, 'Sold Out');
    assert.equal(saved.productId, '13');
  });

  it('rejects malformed items with 400 and stores nothing', async () => {
    const body = cartOrder({ items: [{ productId: 11, planIndex: 0, quantity: 0 }] });
    assert.equal((await confirm(body)).status, 400);
    assert.equal((await confirm(cartOrder({ items: [] }))).status, 400);
    assert.equal(await UtrSubmission.countDocuments({ utr: body.utr }), 0);
  });
});
