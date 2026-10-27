const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./helpers');
const Product = require('../models/productData');
const UtrSubmission = require('../models/UtrSubmission');
const { USD_TO_INR_RATE } = require('../config/pricing');

let api;
let utrCounter = 100000000000;
const nextUtr = () => String(utrCounter++);
let ipCounter = 1;
const nextIp = () => `10.0.0.${ipCounter++}`;

const confirm = (body, ip = nextIp()) => api.request('POST', '/api/orders/confirm', { body, ip });

const order = (overrides = {}) => ({
  productId: 7,
  productName: 'Priced Product',
  planName: '6 Months',
  planIndex: 1,
  amount: 10 * USD_TO_INR_RATE,
  email: 'buyer@example.com',
  orderRef: 'DX-TEST01',
  utr: nextUtr(),
  method: 'UPI',
  ...overrides,
});

before(async () => {
  api = await startTestServer();
  await Product.create({
    id: 7,
    name: 'Priced Product',
    brand: 'TestBrand',
    plans: [
      { name: '3 Months', durationInMonths: 3, price: 6 },
      { name: '6 Months', durationInMonths: 6, price: 10 },
      { name: '12 Months', durationInMonths: 12, price: 18 },
    ],
  });
});
after(async () => {
  await api.stop();
});

describe('POST /api/orders/confirm', () => {
  it('records the catalog price when the amount matches', async () => {
    const body = order();
    const res = await confirm(body);
    assert.equal(res.status, 200);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.amount, 990);
    assert.equal(saved.expectedAmount, 990);
    assert.equal(saved.amountMismatch, false);
  });

  it('flags a tampered amount instead of trusting it, without trapping the buyer', async () => {
    const body = order({ amount: 1 });
    const res = await confirm(body);
    assert.equal(res.status, 200);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.amount, 1);
    assert.equal(saved.expectedAmount, 990);
    assert.equal(saved.amountMismatch, true);
  });

  it('finds the plan by name when the index is missing or stale', async () => {
    const body = order({ planIndex: undefined, planName: '12 Months', amount: 18 * USD_TO_INR_RATE });
    await confirm(body);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.expectedAmount, 1782);
    assert.equal(saved.amountMismatch, false);

    const stale = order({ planIndex: 0, planName: '6 Months' });
    await confirm(stale);
    assert.equal((await UtrSubmission.findOne({ utr: stale.utr }).lean()).expectedAmount, 990);
  });

  it('still records orders for products it cannot price', async () => {
    const body = order({ productId: 999 });
    const res = await confirm(body);
    assert.equal(res.status, 200);
    const saved = await UtrSubmission.findOne({ utr: body.utr }).lean();
    assert.equal(saved.expectedAmount, undefined);
    assert.equal(saved.amountMismatch, false);
  });

  it('rejects a reused UTR with 409', async () => {
    const body = order();
    assert.equal((await confirm(body)).status, 200);
    const again = await confirm({ ...body, orderRef: 'DX-OTHER1' });
    assert.equal(again.status, 409);
  });

  it('validates UTR, amount and order reference', async () => {
    for (const body of [order({ utr: '12345' }), order({ amount: 0 }), order({ orderRef: '' })]) {
      const res = await confirm(body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });

  it('rejects oversized fields and malformed emails that the checkout page never sends', async () => {
    const cases = [
      order({ productName: 'x'.repeat(201) }),
      order({ planName: 'x'.repeat(101) }),
      order({ productId: 'x'.repeat(41) }),
      order({ email: 'not-an-email' }),
      order({ email: `${'a'.repeat(250)}@example.com` }),
    ];
    for (const body of cases) {
      const res = await confirm(body);
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
      assert.equal(await UtrSubmission.countDocuments({ utr: body.utr }), 0);
    }
  });

  it('rate-limits one client to 8 confirmations per 10 minutes', async () => {
    const statuses = [];
    for (let i = 0; i < 9; i++) statuses.push((await confirm(order(), '10.9.9.9')).status);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 200, 200, 429]);
  });
});
