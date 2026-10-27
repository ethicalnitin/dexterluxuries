const USD_TO_INR_RATE = 99;

const MAX_CART_LINES = 20;
const MAX_ITEM_QUANTITY = 5;

function planLabel(plan) {
  if (plan.name) return String(plan.name).trim();
  if (!plan.durationInMonths) return "Lifetime";
  return plan.durationInMonths === 1 ? "1 Month" : `${plan.durationInMonths} Months`;
}

module.exports = { USD_TO_INR_RATE, MAX_CART_LINES, MAX_ITEM_QUANTITY, planLabel };
