export function formatUSD(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPlanDuration(plan) {
  if (plan.name) return plan.name;
  if (!plan.durationInMonths) return "Lifetime";
  return plan.durationInMonths === 1 ? "1 Month" : `${plan.durationInMonths} Months`;
}

export function shortPlanName(plan) {
  return formatPlanDuration(plan)
    .replace(/\blifetime access\b/i, "Lifetime")
    .replace(/\bmonths?\b/i, "mo")
    .replace(/\byears?\b/i, "yr")
    .trim();
}

export function monthlyPrice(plan) {
  const months = Number(plan?.durationInMonths);
  const price = Number(plan?.price);
  if (!Number.isFinite(months) || months < 2 || !Number.isFinite(price)) return null;
  return price / months;
}

export function bestValuePlanIndex(plans) {
  let best = -1;
  let bestMonthly = Infinity;
  let compared = 0;
  (plans || []).forEach((plan, i) => {
    const months = Number(plan.durationInMonths);
    const price = Number(plan.price);
    if (!isPlanAvailable(plan) || !Number.isFinite(months) || months < 1 || !Number.isFinite(price)) return;
    compared += 1;
    const monthly = price / months;
    if (monthly < bestMonthly) {
      bestMonthly = monthly;
      best = i;
    }
  });
  return compared >= 2 ? best : -1;
}

export function isPlanAvailable(plan) {
  return plan?.available !== false;
}

export function isProductInStock(product) {
  return product?.stock !== false;
}

export function getStartingPlan(product) {
  if (!Array.isArray(product.plans) || product.plans.length === 0) return null;
  return product.plans.reduce(
    (cheapest, plan) => (Number(plan.price) < Number(cheapest.price) ? plan : cheapest),
    product.plans[0]
  );
}

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
