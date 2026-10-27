const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, createUser } = require('./helpers');
const Product = require('../models/productData');
const Order = require('../models/Order');
const UtrSubmission = require('../models/UtrSubmission');
const { USD_TO_INR_RATE } = require('../config/pricing');
const { PAYMENT_WINDOW_MS, MAX_PAYMENT_ATTEMPTS } = require('../config/orders');

let api;
let alice;
let bob;
let admin;
let utrCounter = 300000000000;
const nextUtr = () => String(utrCounter++);
let keyCounter = 0;
const nextKey = () => `checkout-key-${++keyCounter}`;

const monthly = { productId: 21, planIndex: 0, planName: '1 Month', quantity: 1 };
const yearly = { productId: 21, planIndex: 1, planName: '12 Months', quantity: 2 };
const MONTHLY_INR = 9 * USD_TO_INR_RATE;
const YEARLY_INR = 72 * USD_TO_INR_RATE;

const as = (who) => ({
  place: (body) => api.request('POST', '/api/orders', { token: who.token, body: { email: who.user.email, idempotencyKey: nextKey(), ...body } }),
  list: (query = '') => api.request('GET', `/api/orders${query}`, { token: who.token }),
  get: (id) => api.request('GET', `/api/orders/${id}`, { token: who.token }),
  pay: (id, utr = nextUtr()) => api.request('POST', `/api/orders/${id}/payment`, { token: who.token, body: { utr } }),
  cancel: (id) => api.request('POST', `/api/orders/${id}/cancel`, { token: who.token }),
});
const setStatus = (id, body, who = admin) => api.request('POST', `/api/admin/orders/${id}/status`, { token: who.token, body });

let orderCounter = 0;
async function placeOrder(who) {
  const n = orderCounter++;
  const months = (n % 5) + 1;
  const years = Math.floor(n / 5) % 5;
  const items = [{ ...monthly, quantity: months }, ...(years ? [{ ...yearly, quantity: years }] : [])];
  const res = await as(who).place({ items, expectedTotalInr: MONTHLY_INR * months + YEARLY_INR * years });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.order;
}

before(async () => {
  api = await startTestServer();
  await Product.create({
    id: 21,
    name: 'Chart Tool',
    brand: 'B',
    plans: [
      { name: '1 Month', durationInMonths: 1, price: 9 },
      { name: '12 Months', durationInMonths: 12, price: 72 },
    ],
  });
  await Product.collection.insertOne({ id: 22, name: 'Sold Out', brand: 'B', stock: false, plans: [{ name: '1 Month', price: 5 }] });
  alice = await createUser({ email: 'alice@example.com' });
  bob = await createUser({ email: 'bob@example.com' });
  admin = await createUser({ email: 'admin-orders@example.com', role: 'admin' });
});
after(async () => {
  await api.stop();
});

describe('placing an order', () => {
  it('requires a signed-in customer', async () => {
    assert.equal((await api.request('POST', '/api/orders', { body: { items: [monthly] } })).status, 401);
    assert.equal((await api.request('GET', '/api/orders')).status, 401);
  });

  it('prices every line on the server and starts the payment window', async () => {
    const res = await as(alice).place({ items: [monthly, yearly], expectedTotalInr: MONTHLY_INR + 2 * YEARLY_INR, amount: 1, totalInr: 1 });
    assert.equal(res.status, 201);
    const { order } = res.body;
    assert.match(order.orderRef, /^DX-[A-Z2-9]{6}$/);
    assert.equal(order.status, 'pending_payment');
    assert.equal(order.totalInr, MONTHLY_INR + 2 * YEARLY_INR);
    assert.equal(order.subtotal, 9 + 72 * 2);
    assert.deepEqual(order.items.map((i) => [i.productName, i.planName, i.quantity, i.lineTotalInr]), [
      ['Chart Tool', '1 Month', 1, MONTHLY_INR],
      ['Chart Tool', '12 Months', 2, 2 * YEARLY_INR],
    ]);
    const window = new Date(order.expiresAt) - new Date(order.createdAt);
    assert.ok(Math.abs(window - PAYMENT_WINDOW_MS) < 2000, `payment window ${window}ms`);
    assert.equal(order.payment.attemptsLeft, MAX_PAYMENT_ATTEMPTS);
  });

  it('refuses when the total the customer confirmed is out of date', async () => {
    const res = await as(alice).place({ items: [monthly], expectedTotalInr: MONTHLY_INR - 1 });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'TOTAL_CHANGED');
    assert.equal(res.body.quote.totalInr, MONTHLY_INR);
  });

  it('refuses sold-out items', async () => {
    const res = await as(alice).place({ items: [{ productId: 22, planIndex: 0, quantity: 1 }], expectedTotalInr: 5 * USD_TO_INR_RATE });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'UNAVAILABLE');
  });

  it('validates the request', async () => {
    const cases = [
      { items: [], expectedTotalInr: 1 },
      { items: [monthly] },
      { items: [monthly], expectedTotalInr: MONTHLY_INR, email: 'not-an-email' },
      { items: [monthly], expectedTotalInr: MONTHLY_INR, idempotencyKey: 'bad key!' },
    ];
    for (const body of cases) assert.equal((await as(bob).place(body)).status, 400, JSON.stringify(body));
  });

  it('returns the same order for a repeated or concurrent "Place order"', async () => {
    const body = { items: [{ ...yearly, quantity: 3 }], expectedTotalInr: 3 * YEARLY_INR, idempotencyKey: nextKey() };
    const [a, b] = await Promise.all([as(bob).place(body), as(bob).place(body)]);
    assert.deepEqual([a.status, b.status].sort(), [200, 201]);
    assert.equal(a.body.order.id, b.body.order.id);
    const again = await as(bob).place(body);
    assert.equal(again.status, 200);
    assert.equal(again.body.existing, true);
    assert.equal(await Order.countDocuments({ user: bob.user._id, 'items.quantity': 3 }), 1);
  });

  it('hands back an unpaid order for the same items instead of duplicating it', async () => {
    const body = { items: [{ ...yearly, quantity: 4 }], expectedTotalInr: 4 * YEARLY_INR };
    const first = await as(bob).place(body);
    const second = await as(bob).place({ ...body, email: 'gift@example.com' });
    assert.equal(second.status, 200);
    assert.equal(second.body.order.id, first.body.order.id);
    assert.equal(second.body.order.email, 'gift@example.com');
  });
});

describe("customers can only reach their own orders", () => {
  it('hides other customers’ orders behind 404s', async () => {
    const order = await placeOrder(alice);
    assert.equal((await as(bob).get(order.id)).status, 404);
    assert.equal((await as(bob).pay(order.id)).status, 404);
    assert.equal((await as(bob).cancel(order.id)).status, 404);
    assert.equal((await as(bob).get('not-an-id')).status, 404);
    assert.equal((await as(alice).get(order.id)).status, 200);

    const bobsOrders = (await as(bob).list()).body.orders;
    assert.ok(bobsOrders.length > 0);
    assert.ok(bobsOrders.every((o) => o.id !== order.id));
  });

  it('keeps admin endpoints for admins', async () => {
    const order = await placeOrder(alice);
    assert.equal((await api.request('GET', '/api/admin/orders', { token: alice.token })).status, 403);
    assert.equal((await setStatus(order.id, { status: 'paid' }, alice)).status, 403);
  });
});

describe('paying for an order', () => {
  it('moves to verifying, claims the UTR and records it for the admin', async () => {
    const order = await placeOrder(alice);
    const utr = nextUtr();
    const res = await as(alice).pay(order.id, utr);
    assert.equal(res.status, 200);
    assert.equal(res.body.order.status, 'verifying');
    assert.equal(res.body.order.payment.utr, utr);
    assert.equal(res.body.order.expiresAt, null);

    const submission = await UtrSubmission.findOne({ utr }).lean();
    assert.equal(String(submission.orderId), order.id);
    assert.equal(submission.amount, order.totalInr);

    assert.equal((await as(alice).pay(order.id)).status, 409);
    const other = await placeOrder(alice);
    assert.equal((await as(alice).pay(other.id, utr)).status, 409);
    const legacy = await api.request('POST', '/api/orders/confirm', {
      body: { utr, amount: 1, orderRef: 'DX-OLD001', productId: 21, planIndex: 0 },
      ip: '10.2.0.1',
    });
    assert.equal(legacy.status, 409);
  });

  it('only accepts a 12-digit UTR', async () => {
    const order = await placeOrder(alice);
    assert.equal((await as(alice).pay(order.id, '12345')).status, 400);
  });

  it('can be cancelled before payment, and then not paid', async () => {
    const order = await placeOrder(alice);
    const res = await as(alice).cancel(order.id);
    assert.equal(res.body.order.status, 'cancelled');
    assert.equal(res.body.order.cancelReason, 'customer');
    assert.equal((await as(alice).pay(order.id)).status, 409);
    assert.equal((await as(alice).cancel(order.id)).status, 409);
  });

  it("can't be cancelled once a payment is being checked", async () => {
    const order = await placeOrder(alice);
    await as(alice).pay(order.id);
    const res = await as(alice).cancel(order.id);
    assert.equal(res.status, 409);
    assert.equal(res.body.order.status, 'verifying');
  });

  it('cancels unpaid orders whose payment window has passed', async () => {
    const order = await placeOrder(alice);
    await Order.updateOne({ _id: order.id }, { expiresAt: new Date(Date.now() - 1000) });
    const viewed = await as(alice).get(order.id);
    assert.equal(viewed.body.order.status, 'cancelled');
    assert.equal(viewed.body.order.cancelReason, 'expired');
    const paid = await as(alice).pay(order.id);
    assert.equal(paid.status, 409);
    assert.match(paid.body.error, /payment window ended/);
  });
});

describe('payment verification by an admin', () => {
  it('confirms a payment, then delivery, and the customer sees each step', async () => {
    const order = await placeOrder(bob);
    await as(bob).pay(order.id);

    const queue = await api.request('GET', '/api/admin/orders?status=verifying', { token: admin.token });
    const listed = queue.body.orders.find((o) => o.id === order.id);
    assert.equal(listed.account.email, 'bob@example.com');

    const paid = await setStatus(order.id, { status: 'paid' });
    assert.equal(paid.status, 200);
    let seen = (await as(bob).get(order.id)).body.order;
    assert.equal(seen.status, 'paid');
    assert.ok(seen.payment.verifiedAt);

    assert.equal((await setStatus(order.id, { status: 'fulfilled' })).status, 200);
    seen = (await as(bob).get(order.id)).body.order;
    assert.equal(seen.status, 'fulfilled');
    assert.deepEqual(seen.history.map((h) => h.status), ['pending_payment', 'verifying', 'paid', 'fulfilled']);
    assert.equal((await setStatus(order.id, { status: 'paid' })).status, 409);
  });

  it('lets the customer correct a failed payment, up to the attempt limit', async () => {
    const order = await placeOrder(bob);
    assert.equal((await setStatus(order.id, { status: 'payment_failed', reason: 'x' })).status, 409);

    for (let attempt = 1; attempt <= MAX_PAYMENT_ATTEMPTS; attempt++) {
      assert.equal((await as(bob).pay(order.id)).status, 200, `attempt ${attempt}`);
      assert.equal((await setStatus(order.id, { status: 'payment_failed' })).status, 400);
      const failed = await setStatus(order.id, { status: 'payment_failed', reason: 'No transfer with this UTR' });
      assert.equal(failed.status, 200);
    }
    const seen = (await as(bob).get(order.id)).body.order;
    assert.equal(seen.status, 'payment_failed');
    assert.equal(seen.payment.failureReason, 'No transfer with this UTR');
    assert.equal(seen.payment.attemptsLeft, 0);
    const blocked = await as(bob).pay(order.id);
    assert.equal(blocked.status, 409);
    assert.match(blocked.body.error, /too many payment attempts/);

    assert.equal((await setStatus(order.id, { status: 'paid' })).status, 200);
  });

  it('validates status changes', async () => {
    const order = await placeOrder(bob);
    assert.equal((await setStatus(order.id, { status: 'cancelled' })).status, 400);
    assert.equal((await setStatus('000000000000000000000000', { status: 'paid' })).status, 404);
    assert.equal((await api.request('GET', '/api/admin/orders?status=nope', { token: admin.token })).status, 400);
  });
});

describe('order history', () => {
  it('pages through the customer’s orders, newest first', async () => {
    const carol = await createUser({ email: 'carol@example.com' });
    const placed = [await placeOrder(carol), await placeOrder(carol), await placeOrder(carol)];
    const first = await as(carol).list('?limit=2');
    assert.deepEqual(first.body.orders.map((o) => o.id), [placed[2].id, placed[1].id]);
    assert.ok(first.body.nextCursor);
    const second = await as(carol).list(`?limit=2&before=${first.body.nextCursor}`);
    assert.deepEqual(second.body.orders.map((o) => o.id), [placed[0].id]);
    assert.equal(second.body.nextCursor, null);
    assert.equal((await as(carol).list('?before=bad')).status, 400);
  });
});
