export const MAX_CART_LINES = 20;
export const MAX_ITEM_QUANTITY = 5;

export const CART_STORAGE_KEY = "mkr_cart_v1";

export const lineKey = ({ productId, planIndex, planName }) => `${productId}:${planIndex ?? ""}:${planName ?? ""}`;

export const cartCount = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

export const clampQuantity = (n) => Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(Number(n)) || 1));

export function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  const byKey = new Map();
  raw.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const productId = Number(entry.productId);
    if (!Number.isInteger(productId) || productId <= 0) return;
    const item = { productId, quantity: clampQuantity(entry.quantity) };
    if (Number.isInteger(entry.planIndex) && entry.planIndex >= 0) item.planIndex = entry.planIndex;
    if (typeof entry.planName === "string" && entry.planName.trim()) item.planName = entry.planName.trim();
    if (item.planIndex === undefined && !item.planName) return;
    if (typeof entry.unitPrice === "number" && Number.isFinite(entry.unitPrice)) item.unitPrice = entry.unitPrice;
    if (typeof entry.name === "string") item.name = entry.name;
    if (typeof entry.image === "string") item.image = entry.image;
    byKey.set(lineKey(item), item);
  });
  return [...byKey.values()].slice(0, MAX_CART_LINES);
}

export function addLine(items, line, quantity = 1) {
  const key = lineKey(line);
  const existing = items.find((item) => lineKey(item) === key);
  if (existing) {
    const next = Math.min(MAX_ITEM_QUANTITY, existing.quantity + quantity);
    return {
      items: items.map((item) => (item === existing ? { ...item, ...line, quantity: next } : item)),
      added: next - existing.quantity,
      quantity: next,
      full: false,
    };
  }
  if (items.length >= MAX_CART_LINES) return { items, added: 0, quantity: 0, full: true };
  const next = clampQuantity(quantity);
  return { items: [...items, { ...line, quantity: next }], added: next, quantity: next, full: false };
}

export const setLineQuantity = (items, key, quantity) =>
  items.map((item) => (lineKey(item) === key ? { ...item, quantity: clampQuantity(quantity) } : item));

export const removeLine = (items, key) => items.filter((item) => lineKey(item) !== key);

export function mergeCarts(base, incoming) {
  const merged = new Map(base.map((item) => [lineKey(item), item]));
  incoming.forEach((item) => {
    const key = lineKey(item);
    const current = merged.get(key);
    merged.set(key, current ? { ...item, ...current, quantity: Math.max(current.quantity, item.quantity) } : item);
  });
  return [...merged.values()].slice(0, MAX_CART_LINES);
}

export const toQuoteItems = (items) =>
  items.map(({ productId, planIndex, planName, quantity }) => ({ productId, planIndex, planName, quantity }));

export const toSavedItems = (items) =>
  items.map(({ productId, planIndex, planName, quantity, unitPrice }) => ({ productId, planIndex, planName, quantity, unitPrice }));

export function readStoredCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "null");
    if (!stored || typeof stored !== "object") return { owner: null, items: [], dirty: false };
    return {
      owner: typeof stored.owner === "string" ? stored.owner : null,
      items: sanitizeItems(stored.items),
      dirty: stored.dirty === true,
    };
  } catch {
    return { owner: null, items: [], dirty: false };
  }
}

export function writeStoredCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
  }
}

export function clearStoredCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
  }
}
