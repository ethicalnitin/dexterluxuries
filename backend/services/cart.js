const Product = require('../models/productData');
const { USD_TO_INR_RATE, MAX_CART_LINES, MAX_ITEM_QUANTITY, planLabel } = require('../config/pricing');

const PLAN_NAME_MAX = 100;

function wholeNumber(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value === 'string' && /^\d{1,9}$/.test(value.trim())) return Number(value.trim());
  return NaN;
}

function parseCartItems(raw, { allowEmpty = false, keepUnitPrice = false } = {}) {
  if (!Array.isArray(raw)) return { error: 'items must be a list.' };
  if (raw.length === 0 && !allowEmpty) return { error: 'Your cart is empty.' };
  if (raw.length > MAX_CART_LINES) return { error: `A cart can hold at most ${MAX_CART_LINES} items.` };

  const items = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: 'Invalid cart item.' };

    const productId = wholeNumber(entry.productId);
    if (!(productId > 0)) return { error: 'Invalid product in cart.' };

    const quantity = entry.quantity === undefined ? 1 : wholeNumber(entry.quantity);
    if (!(quantity >= 1 && quantity <= MAX_ITEM_QUANTITY)) {
      return { error: `Quantity must be between 1 and ${MAX_ITEM_QUANTITY}.` };
    }

    const item = { productId, quantity };
    if (entry.planIndex !== undefined && entry.planIndex !== null) {
      const planIndex = wholeNumber(entry.planIndex);
      if (!(planIndex >= 0 && planIndex < 100)) return { error: 'Invalid plan in cart.' };
      item.planIndex = planIndex;
    }
    if (entry.planName !== undefined && entry.planName !== null) {
      const planName = String(entry.planName).trim();
      if (planName.length > PLAN_NAME_MAX) return { error: 'Invalid plan in cart.' };
      if (planName) item.planName = planName;
    }
    if (item.planIndex === undefined && !item.planName) return { error: 'Choose a plan for every item.' };

    if (keepUnitPrice && entry.unitPrice !== undefined && entry.unitPrice !== null) {
      const unitPrice = Number(entry.unitPrice);
      if (typeof entry.unitPrice === 'number' && Number.isFinite(unitPrice) && unitPrice >= 0) item.unitPrice = unitPrice;
    }
    items.push(item);
  }
  return { items };
}

function resolvePlan(product, planIndex, planName) {
  const plans = Array.isArray(product && product.plans) ? product.plans : [];
  let index = Number.isInteger(planIndex) && plans[planIndex] ? planIndex : -1;
  if (index === -1 || (planName && planLabel(plans[index]) !== planName)) {
    index = planName ? plans.findIndex((p) => planLabel(p) === planName) : -1;
  }
  return index === -1 ? null : { plan: plans[index], index };
}

function toInr(usd) {
  const inr = Math.round(Number(usd) * USD_TO_INR_RATE);
  return Number.isFinite(inr) && inr > 0 ? inr : null;
}

const roundCents = (n) => Math.round(n * 100) / 100;

async function priceItems(items) {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = ids.length
    ? await Product.find({ id: { $in: ids } }).select('id name image category stock plans').lean()
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item) => {
    const product = byId.get(item.productId);
    const resolved = product ? resolvePlan(product, item.planIndex, item.planName) : null;
    const unitPriceInr = resolved ? toInr(resolved.plan.price) : null;
    if (!resolved || unitPriceInr === null) {
      return {
        productId: item.productId,
        planIndex: item.planIndex === undefined ? null : item.planIndex,
        planName: item.planName || null,
        productName: product ? product.name || '' : null,
        quantity: item.quantity,
        status: 'not_found',
      };
    }
    const available = product.stock !== false && resolved.plan.available !== false;
    return {
      productId: item.productId,
      planIndex: resolved.index,
      planName: planLabel(resolved.plan),
      productName: product.name || '',
      image: product.image || '',
      category: product.category || '',
      quantity: item.quantity,
      unitPrice: Number(resolved.plan.price),
      unitPriceInr,
      lineTotalInr: unitPriceInr * item.quantity,
      status: available ? 'ok' : 'unavailable',
    };
  });

  const okLines = lines.filter((line) => line.status === 'ok');
  return {
    items: lines,
    subtotal: roundCents(okLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)),
    totalInr: okLines.reduce((sum, line) => sum + line.lineTotalInr, 0),
    allAvailable: lines.length > 0 && okLines.length === lines.length,
  };
}

async function expectedAmountFor(productId, planIndex, planName) {
  const numericId = Number(productId);
  if (!Number.isInteger(numericId)) return null;

  const product = await Product.findOne({ id: numericId }).select('plans').lean();
  const resolved = product ? resolvePlan(product, planIndex, planName) : null;
  return resolved ? toInr(resolved.plan.price) : null;
}

module.exports = { parseCartItems, priceItems, resolvePlan, expectedAmountFor };
