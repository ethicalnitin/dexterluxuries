const express = require('express');
const Cart = require('../models/Cart');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { parseCartItems, priceItems } = require('../services/cart');
const { USD_TO_INR_RATE } = require('../config/pricing');
const { logger } = require('../utils/logger');

const router = express.Router();

const quoteRateLimit = rateLimit({ windowMs: 60 * 1000, max: 60 });

const publicItem = ({ productId, planIndex, planName, quantity, unitPrice }) => ({
  productId,
  ...(planIndex !== undefined && planIndex !== null ? { planIndex } : {}),
  ...(planName ? { planName } : {}),
  quantity,
  ...(unitPrice !== undefined && unitPrice !== null ? { unitPrice } : {}),
});

function dedupe(items) {
  const byKey = new Map();
  items.forEach((item) => byKey.set(`${item.productId}:${item.planIndex ?? ''}:${item.planName ?? ''}`, item));
  return [...byKey.values()];
}

router.post('/quote', quoteRateLimit, async (req, res) => {
  const { items, error } = parseCartItems((req.body || {}).items, { allowEmpty: true });
  if (error) return res.status(400).json({ error });

  try {
    const quote = await priceItems(items);
    res.json({ ...quote, currency: 'INR', usdToInrRate: USD_TO_INR_RATE });
  } catch (err) {
    logger.error('Cart quote failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't check today's prices. Try again." });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).lean();
    res.json({ items: cart ? cart.items.map(publicItem) : [] });
  } catch (err) {
    logger.error('Loading cart failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't load your cart. Try again." });
  }
});

router.put('/', requireAuth, async (req, res) => {
  const { items, error } = parseCartItems((req.body || {}).items, { allowEmpty: true, keepUnitPrice: true });
  if (error) return res.status(400).json({ error });

  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: dedupe(items) } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ items: cart.items.map(publicItem) });
  } catch (err) {
    logger.error('Saving cart failed', { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't save your cart. Try again." });
  }
});

module.exports = router;
