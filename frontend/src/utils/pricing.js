// Pricing helpers shared by the catalog (HomePage) and ProductPage.
// Prices come from the backend in USD. Behaviour is unchanged from the
// copies that previously lived in each page.

export function formatUSD(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Turns a plan's `durationInMonths` into the label shown on its card.
// null / 0 / undefined means "lifetime" per the model's own comment.
export function formatPlanDuration(plan) {
  if (plan.name) return plan.name;
  if (!plan.durationInMonths) return "Lifetime";
  return plan.durationInMonths === 1 ? "1 Month" : `${plan.durationInMonths} Months`;
}

// A plan is treated as in-stock unless it explicitly says otherwise —
// matches the schema's `available: { default: true }`.
export function isPlanAvailable(plan) {
  return plan?.available !== false;
}

// stock === false -> explicitly out of stock. Missing/undefined `stock`
// is treated as in-stock.
export function isProductInStock(product) {
  return product?.stock !== false;
}

// Cheapest plan, used for the "From $x" price on catalog cards.
export function getStartingPlan(product) {
  if (!Array.isArray(product.plans) || product.plans.length === 0) return null;
  return product.plans.reduce(
    (cheapest, plan) => (Number(plan.price) < Number(cheapest.price) ? plan : cheapest),
    product.plans[0]
  );
}

// Formatted price, strike-through price and whole-number discount % for a plan.
export function getPlanPricing(plan) {
  if (!plan) return { price: null, strike: null, discountPct: null };

  const strike = Number(plan.strikeThroughPrice);
  const price = Number(plan.price);
  const hasStrike = Number.isFinite(strike) && Number.isFinite(price) && strike > price;

  return {
    price: formatUSD(plan.price),
    strike: hasStrike ? formatUSD(plan.strikeThroughPrice) : null,
    discountPct: hasStrike ? Math.round(((strike - price) / strike) * 100) : null,
  };
}

// Checkout is paid in rupees over UPI.
export const USD_TO_INR_RATE = 99;

export function convertUsdToInr(usdAmount) {
  const n = Number(usdAmount);
  if (Number.isNaN(n)) return null;
  return Math.round(n * USD_TO_INR_RATE);
}

export function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
