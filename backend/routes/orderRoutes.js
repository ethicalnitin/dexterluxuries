const express = require('express');
const UtrSubmission = require('../models/UtrSubmission');
const { rateLimit } = require('../middleware/rateLimit');
const { sendTelegramMessage } = require('../services/telegram');
const { parseCartItems, priceItems, expectedAmountFor } = require('../services/cart');
const { inr, itemLine, timestamp } = require('../services/orderMessages');
const { escapeHtml } = require('../utils/escapeHtml');
const { logger } = require('../utils/logger');
const { isValidEmail } = require('../utils/validate');

const router = express.Router();

const confirmRateLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 8 });

const FIELD_MAX_LENGTHS = { productId: 40, productName: 200, planName: 100, email: 254, method: 20 };

function parseAmount(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function priceCartOrder(items) {
  const quote = await priceItems(items);
  const lines = quote.items.map((line) => ({
    productId: line.productId,
    productName: line.productName || undefined,
    planIndex: line.planIndex === null ? undefined : line.planIndex,
    planName: line.planName || undefined,
    quantity: line.quantity,
    unitPriceInr: line.unitPriceInr,
    lineTotalInr: line.lineTotalInr,
    status: line.status,
  }));
  const canPriceAll = lines.every((line) => line.status !== 'not_found');
  return {
    items: lines,
    expectedAmount: canPriceAll ? lines.reduce((sum, line) => sum + line.lineTotalInr, 0) : null,
    hasUnavailableItems: lines.some((line) => line.status !== 'ok'),
  };
}

function summarize(lines) {
  if (lines.length === 1) {
    const [line] = lines;
    return { productId: String(line.productId), productName: line.productName, planName: line.planName };
  }
  const first = lines[0].productName || `Product ${lines[0].productId}`;
  return { productName: `${first} + ${lines.length - 1} more` };
}

function confirmationMessage(order) {
  const { orderRef, utr, amount, expectedAmount, amountMismatch, productName, planName, productId, email, method, items } = order;

  let amountLine;
  if (expectedAmount === null) {
    amountLine = `💵 <b>Amount:</b> ${inr(amount)} (⚠️ couldn't check against the catalog — verify the price)`;
  } else if (amountMismatch) {
    amountLine =
      `⚠️ <b>AMOUNT MISMATCH</b> — catalog price is <b>${inr(expectedAmount)}</b>, ` +
      `checkout showed ${inr(amount)}. Check the bank amount against ${inr(expectedAmount)}.`;
  } else {
    amountLine = `💵 <b>Amount:</b> ${inr(amount)} ✅ matches catalog`;
  }

  const productLines = items
    ? [
        `🛒 <b>Items (${items.reduce((sum, line) => sum + line.quantity, 0)}):</b>`,
        ...items.map(itemLine),
        order.hasUnavailableItems ? `⚠️ <b>Some items were sold out or removed</b> — contact the buyer before delivering.` : null,
      ]
    : [
        productName ? `📦 <b>Product:</b> ${escapeHtml(productName)}` : null,
        planName ? `🗂 <b>Plan:</b> ${escapeHtml(planName)}` : null,
        productId ? `🆔 <b>Product ID:</b> <code>${escapeHtml(productId)}</code>` : null,
      ];

  return [
    `💰 <b>Payment Submitted — verify in bank app</b>`,
    ``,
    `🎫 <b>Order Ref:</b> <code>${escapeHtml(orderRef)}</code>`,
    `🔑 <b>UTR:</b> <code>${escapeHtml(utr)}</code>`,
    amountLine,
    ...productLines,
    email ? `👤 <b>Deliver to:</b> ${escapeHtml(email)}` : null,
    `📲 <b>Method:</b> ${escapeHtml(method)}`,
    timestamp(),
  ]
    .filter((line) => line !== null)
    .join('\n');
}

router.post('/confirm', confirmRateLimit, async (req, res) => {
  const body = req.body || {};
  const trimmed = (value) => (value ? String(value).trim() : undefined);

  const utr = String(body.utr || '').trim();
  if (!/^\d{12}$/.test(utr)) {
    return res.status(400).json({ error: 'UTR must be exactly 12 digits.' });
  }
  const amount = parseAmount(body.amount);
  if (amount === null) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  const orderRef = String(body.orderRef || '').trim();
  if (!orderRef || orderRef.length > 20) {
    return res.status(400).json({ error: 'Missing order reference.' });
  }

  const order = {
    utr,
    orderRef,
    amount,
    email: trimmed(body.email),
    method: trimmed(body.method) || 'UPI',
  };

  let cartItems = null;
  if (body.items !== undefined) {
    const parsed = parseCartItems(body.items);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    cartItems = parsed.items;
  } else {
    order.productId = trimmed(body.productId);
    order.productName = trimmed(body.productName);
    order.planName = trimmed(body.planName);
  }

  const tooLong = Object.entries(FIELD_MAX_LENGTHS).find(([field, max]) => order[field] && order[field].length > max);
  if (tooLong) {
    return res.status(400).json({ error: `${tooLong[0]} is too long.` });
  }
  if (order.email && !isValidEmail(order.email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  order.expectedAmount = null;
  try {
    if (cartItems) {
      Object.assign(order, await priceCartOrder(cartItems));
    } else {
      order.expectedAmount = await expectedAmountFor(body.productId, body.planIndex, order.planName);
    }
  } catch (err) {
    logger.error('Order price lookup failed', { requestId: req.id, err });
  }
  if (cartItems && !order.items) order.items = cartItems.map(({ productId, planIndex, planName, quantity }) => ({ productId, planIndex, planName, quantity }));
  if (order.items) Object.assign(order, summarize(order.items));
  order.amountMismatch = order.expectedAmount !== null && order.expectedAmount !== amount;

  try {
    await UtrSubmission.create({
      utr: order.utr,
      orderRef: order.orderRef,
      productId: order.productId,
      productName: order.productName,
      planName: order.planName,
      items: order.items,
      amount: order.amount,
      expectedAmount: order.expectedAmount === null ? undefined : order.expectedAmount,
      amountMismatch: order.amountMismatch,
      hasUnavailableItems: order.hasUnavailableItems,
      email: order.email,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "This UTR has already been submitted. If that's a mistake, message us on WhatsApp.",
      });
    }
    logger.error('Saving payment confirmation failed', { requestId: req.id, err });
    return res.status(500).json({ error: 'Could not record your payment. Please try again.' });
  }

  try {
    await sendTelegramMessage(confirmationMessage(order));
    logger.info('Payment confirmation recorded', {
      requestId: req.id,
      orderRef,
      utrLast4: utr.slice(-4),
      lines: order.items ? order.items.length : 1,
      amountMismatch: order.amountMismatch,
    });
  } catch (err) {
    logger.error('Telegram notification failed', { requestId: req.id, orderRef, err });
  }

  res.json({ success: true });
});

module.exports = router;
