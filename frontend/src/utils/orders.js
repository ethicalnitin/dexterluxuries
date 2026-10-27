export const ORDER_STATUS = {
  pending_payment: { label: "Awaiting payment", variant: "warning" },
  verifying: { label: "Checking payment", variant: "primary" },
  paid: { label: "Payment confirmed", variant: "success" },
  payment_failed: { label: "Payment not found", variant: "danger" },
  fulfilled: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const statusInfo = (status) => ORDER_STATUS[status] || { label: status, variant: "neutral" };

const TIMELINE_LABEL = {
  pending_payment: "Order placed",
  verifying: "Payment submitted",
  paid: "Payment confirmed",
  payment_failed: "Payment not found",
  fulfilled: "Access delivered",
  cancelled: "Cancelled",
};

export const timelineLabel = (status) => TIMELINE_LABEL[status] || status;

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function itemsSummary(items) {
  if (!items || items.length === 0) return "";
  const first = items[0].productName || `Product #${items[0].productId}`;
  return items.length === 1 ? first : `${first} + ${items.length - 1} more`;
}

export function newCheckoutKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
