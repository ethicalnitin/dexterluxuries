const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const UtrSubmission = require('../models/UtrSubmission');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { parseCartItems, priceItems } = require('../services/cart');
const { newOrderRef, itemsSignature, expireOverdue, transition, toCustomer, itemCount } = require('../services/orders');
const { inr, itemLine, timestamp } = require('../services/orderMessages');
const { sendTelegramMessage } = require('../services/telegram');
const { PAYMENT_WINDOW_MS, MAX_PAYMENT_ATTEMPTS } = require('../config/orders');
const { isValidEmail, normalizeEmail } = require('../utils/validate');
const { escapeHtml } = require('../utils/escapeHtml');
const { logger, maskEmail } = require('../utils/logger');

const router = express.Router();
router.use(requireAuth);

const MINUTE = 60 * 1000;
const byAccount = (req) => req.user.id;
const placeRateLimit = rateLimit({ windowMs: 10 * MINUTE, max: 20, keyFn: byAccount, message: 'Too many orders in a short time. Wait a few minutes.' });
const paymentRateLimit = rateLimit({ windowMs: 10 * MINUTE, max: 10, keyFn: byAccount });

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,64}$/;
const EXPIRED_MESSAGE =
  "This order's payment window ended before a UTR was submitted, so it was cancelled. If you've already paid, message us on WhatsApp with your UTR and order reference.";

const notFound = (res) => res.status(404).json({ error: 'Order not found.' });

async function findOwnOrder(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  const filter = { _id: req.params.id, user: req.user.id };
  await expireOverdue(filter);
  return Order.findOne(filter);
}

function paymentMessage(order, account) {
  return [
    `💰 <b>Payment Submitted — verify in bank app</b>`,
    ``,
    `🎫 <b>Order:</b> <code>${escapeHtml(order.orderRef)}</code>${order.payment.attempts > 1 ? ` (corrected UTR, attempt ${order.payment.attempts})` : ''}`,
    `🔑 <b>UTR:</b> <code>${escapeHtml(order.payment.utr)}</code>`,
    `💵 <b>Amount:</b> ${inr(order.totalInr)} (priced by the server)`,
    `🛒 <b>Items (${itemCount(order.items)}):</b>`,
    ...order.items.map(itemLine),
    `👤 <b>Deliver to:</b> ${escapeHtml(order.email)}`,
    `🔐 <b>Account:</b> ${escapeHtml(account.email)}`,
    `➡️ Mark it paid or failed on the admin page (/#/filedelivery).`,
    timestamp(),
  ].join('\n');
}

router.post('/', placeRateLimit, async (req, res) => {
  const body = req.body || {};
  const { items, error } = parseCartItems(body.items);
  if (error) return res.status(400).json({ error });

  const email = normalizeEmail(body.email || req.user.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address for delivery.' });

  const expectedTotalInr = Number(body.expectedTotalInr);
  if (!Number.isInteger(expectedTotalInr) || expectedTotalInr <= 0) {
    return res.status(400).json({ error: 'Review the order total before placing the order.' });
  }

  let idempotencyKey;
  if (body.idempotencyKey !== undefined && body.idempotencyKey !== null) {
    idempotencyKey = String(body.idempotencyKey);
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) return res.status(400).json({ error: 'Invalid checkout session. Reload the page.' });
  }
  const source = body.source === 'buy_now' ? 'buy_now' : 'cart';
  const user = req.user.id;

  try {
    if (idempotencyKey) {
      const existing = await Order.findOne({ user, idempotencyKey });
      if (existing) return res.json({ order: toCustomer(existing), existing: true });
    }

    const quote = await priceItems(items);
    if (!quote.allAvailable) {
      return res.status(409).json({ error: 'Some items are no longer available. Remove them to continue.', code: 'UNAVAILABLE', quote });
    }
    if (quote.totalInr !== expectedTotalInr) {
      return res.status(409).json({
        error: 'Prices have changed since you reviewed your order. Check the new total, then place the order again.',
        code: 'TOTAL_CHANGED',
        quote,
      });
    }

    const lines = quote.items.map(({ productId, productName, planIndex, planName, quantity, unitPrice, unitPriceInr, lineTotalInr }) => ({
      productId,
      productName,
      planIndex,
      planName,
      quantity,
      unitPrice,
      unitPriceInr,
      lineTotalInr,
    }));
    const signature = itemsSignature(lines);

    await expireOverdue({ user });
    const duplicate = await Order.findOne({ user, status: 'pending_payment', itemsSignature: signature, totalInr: quote.totalInr });
    if (duplicate) {
      if (duplicate.email !== email) {
        duplicate.email = email;
        await duplicate.save();
      }
      return res.json({ order: toCustomer(duplicate), existing: true });
    }

    const now = new Date();
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const order = await Order.create({
          orderRef: newOrderRef(),
          user,
          email,
          items: lines,
          subtotal: quote.subtotal,
          totalInr: quote.totalInr,
          source,
          expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MS),
          idempotencyKey,
          itemsSignature: signature,
          history: [{ status: 'pending_payment', at: now, by: 'customer' }],
        });
        logger.info('Order placed', { requestId: req.id, orderRef: order.orderRef, lines: lines.length, totalInr: order.totalInr });
        return res.status(201).json({ order: toCustomer(order) });
      } catch (err) {
        if (err.code !== 11000) throw err;
        if (err.keyPattern && err.keyPattern.idempotencyKey) {
          const existing = await Order.findOne({ user, idempotencyKey });
          if (existing) return res.json({ order: toCustomer(existing), existing: true });
        }
      }
    }
    throw new Error('Could not allocate a unique order reference');
  } catch (err) {
    logger.error('Placing order failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't place your order. Try again." });
  }
});

router.get('/', async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const { before } = req.query;
  if (before !== undefined && !mongoose.isValidObjectId(before)) return res.status(400).json({ error: 'Invalid cursor.' });

  try {
    const user = req.user.id;
    await expireOverdue({ user });
    const filter = { user, ...(before ? { _id: { $lt: before } } : {}) };
    const found = await Order.find(filter).sort({ _id: -1 }).limit(limit + 1);
    const page = found.slice(0, limit);
    res.json({ orders: page.map(toCustomer), nextCursor: found.length > limit ? String(page[page.length - 1]._id) : null });
  } catch (err) {
    logger.error('Listing orders failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't load your orders. Try again." });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await findOwnOrder(req);
    if (!order) return notFound(res);
    res.json({ order: toCustomer(order) });
  } catch (err) {
    logger.error('Loading order failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't load this order. Try again." });
  }
});

router.post('/:id/payment', paymentRateLimit, async (req, res) => {
  const utr = String((req.body || {}).utr || '').trim();
  if (!/^\d{12}$/.test(utr)) return res.status(400).json({ error: 'UTR must be exactly 12 digits.' });

  try {
    const order = await findOwnOrder(req);
    if (!order) return notFound(res);

    if (order.status === 'cancelled') {
      const message = order.cancelReason === 'expired' ? EXPIRED_MESSAGE : 'This order was cancelled. Place a new order to buy these items.';
      return res.status(409).json({ error: message, order: toCustomer(order) });
    }
    if (!['pending_payment', 'payment_failed'].includes(order.status)) {
      return res.status(409).json({ error: 'A payment has already been submitted for this order.', order: toCustomer(order) });
    }
    if ((order.payment.attempts || 0) >= MAX_PAYMENT_ATTEMPTS) {
      return res.status(409).json({
        error: 'This order has had too many payment attempts. Message us on WhatsApp with your UTR and order reference.',
        order: toCustomer(order),
      });
    }

    let submission;
    try {
      submission = await UtrSubmission.create({
        utr,
        orderRef: order.orderRef,
        orderId: order._id,
        productId: order.items.length === 1 ? String(order.items[0].productId) : undefined,
        productName: order.items.length === 1 ? order.items[0].productName : `${order.items[0].productName} + ${order.items.length - 1} more`,
        planName: order.items.length === 1 ? order.items[0].planName : undefined,
        items: order.items.map((item) => ({ ...item.toObject(), status: 'ok' })),
        amount: order.totalInr,
        expectedAmount: order.totalInr,
        amountMismatch: false,
        email: order.email,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "This UTR has already been used for a payment. Check the number, or message us on WhatsApp if it's yours." });
      }
      throw err;
    }

    const updated = await transition(
      { _id: order._id, user: req.user.id, 'payment.attempts': { $lt: MAX_PAYMENT_ATTEMPTS } },
      'verifying',
      'customer',
      { set: { 'payment.utr': utr, 'payment.submittedAt': new Date() }, unset: { 'payment.failureReason': '' }, inc: { 'payment.attempts': 1 } }
    );
    if (!updated) {
      await UtrSubmission.deleteOne({ _id: submission._id });
      const current = await Order.findById(order._id);
      return res.status(409).json({ error: 'This order changed while you were paying. Check its status below.', order: toCustomer(current) });
    }

    try {
      await sendTelegramMessage(paymentMessage(updated, req.user));
    } catch (err) {
      logger.error('Telegram notification failed', { requestId: req.id, orderRef: updated.orderRef, err });
    }
    logger.info('Order payment submitted', { requestId: req.id, orderRef: updated.orderRef, utrLast4: utr.slice(-4), to: maskEmail(updated.email) });
    res.json({ order: toCustomer(updated) });
  } catch (err) {
    logger.error('Submitting order payment failed', { requestId: req.id, err });
    res.status(500).json({ error: 'Could not record your payment. Please try again.' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await findOwnOrder(req);
    if (!order) return notFound(res);

    const updated = await transition({ _id: order._id, user: req.user.id }, 'cancelled', 'customer', {
      set: { cancelledAt: new Date(), cancelReason: 'customer' },
    });
    if (!updated) {
      const current = await Order.findById(order._id);
      const message =
        current.status === 'cancelled'
          ? 'This order is already cancelled.'
          : "This order can't be cancelled now — its payment is being checked or has been confirmed. Message us on WhatsApp if you need help.";
      return res.status(409).json({ error: message, order: toCustomer(current) });
    }
    logger.info('Order cancelled by customer', { requestId: req.id, orderRef: updated.orderRef });
    res.json({ order: toCustomer(updated) });
  } catch (err) {
    logger.error('Cancelling order failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't cancel this order. Try again." });
  }
});

module.exports = router;
