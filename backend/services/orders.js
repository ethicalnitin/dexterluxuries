const crypto = require('crypto');
const Order = require('../models/Order');
const { TRANSITIONS, MAX_PAYMENT_ATTEMPTS } = require('../config/orders');

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newOrderRef() {
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return `DX-${suffix}`;
}

const itemsSignature = (items) =>
  items
    .map((item) => `${item.productId}:${item.planName}:${item.quantity}`)
    .sort()
    .join('|');

async function expireOverdue(filter = {}) {
  const now = new Date();
  await Order.updateMany(
    { ...filter, status: 'pending_payment', expiresAt: { $lte: now } },
    {
      $set: { status: 'cancelled', cancelReason: 'expired', cancelledAt: now },
      $push: { history: { status: 'cancelled', at: now, by: 'system', note: 'Payment window ended before a UTR was submitted.' } },
    }
  );
}

async function transition(filter, to, by, { set = {}, unset, inc, note } = {}) {
  const from = TRANSITIONS[by] && TRANSITIONS[by][to];
  if (!from) throw new Error(`${by} can't move an order to ${to}`);
  const now = new Date();
  const update = {
    $set: { status: to, ...set },
    $push: { history: { status: to, at: now, by, ...(note ? { note } : {}) } },
  };
  if (unset) update.$unset = unset;
  if (inc) update.$inc = inc;
  return Order.findOneAndUpdate({ ...filter, status: { $in: from } }, update, { new: true });
}

const itemCount = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

function toCustomer(doc) {
  const order = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const payment = order.payment || {};
  return {
    id: String(order._id),
    orderRef: order.orderRef,
    status: order.status,
    email: order.email,
    source: order.source,
    items: order.items.map(({ productId, productName, planIndex, planName, quantity, unitPrice, unitPriceInr, lineTotalInr }) => ({
      productId,
      productName,
      planIndex,
      planName,
      quantity,
      unitPrice,
      unitPriceInr,
      lineTotalInr,
    })),
    itemCount: itemCount(order.items),
    subtotal: order.subtotal,
    totalInr: order.totalInr,
    currency: 'INR',
    createdAt: order.createdAt,
    expiresAt: order.status === 'pending_payment' ? order.expiresAt : null,
    payment: {
      method: payment.method || 'UPI',
      utr: payment.utr || null,
      submittedAt: payment.submittedAt || null,
      verifiedAt: payment.verifiedAt || null,
      failureReason: payment.failureReason || null,
      attemptsLeft: Math.max(0, MAX_PAYMENT_ATTEMPTS - (payment.attempts || 0)),
    },
    cancelledAt: order.cancelledAt || null,
    cancelReason: order.cancelReason || null,
    fulfilledAt: order.fulfilledAt || null,
    history: (order.history || []).map(({ status, at }) => ({ status, at })),
  };
}

function toAdmin(doc) {
  const order = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const user = order.user && typeof order.user === 'object' && order.user.email ? order.user : null;
  return {
    ...toCustomer(order),
    expiresAt: order.expiresAt || null,
    account: user ? { id: String(user._id), email: user.email, name: user.name || '' } : { id: String(order.user) },
    history: (order.history || []).map(({ status, at, by, note }) => ({ status, at, by, note: note || null })),
  };
}

module.exports = { newOrderRef, itemsSignature, expireOverdue, transition, toCustomer, toAdmin, itemCount };
