const ORDER_STATUSES = ["pending_payment", "verifying", "paid", "payment_failed", "fulfilled", "cancelled"];

const TRANSITIONS = {
  customer: {
    verifying: ["pending_payment", "payment_failed"],
    cancelled: ["pending_payment", "payment_failed"],
  },
  admin: {
    paid: ["verifying", "payment_failed"],
    payment_failed: ["verifying"],
    fulfilled: ["paid"],
  },
};

const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

const MAX_PAYMENT_ATTEMPTS = 3;

module.exports = { ORDER_STATUSES, TRANSITIONS, PAYMENT_WINDOW_MS, MAX_PAYMENT_ATTEMPTS };
