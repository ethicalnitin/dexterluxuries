import { getPlanPricing, isPlanAvailable, isProductInStock } from "./pricing";

export function getOfferEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function findBiggestDeal(products) {
  let best = null;
  (products || []).forEach((product) => {
    if (!isProductInStock(product) || !Array.isArray(product.plans)) return;
    product.plans.forEach((plan) => {
      if (!isPlanAvailable(plan)) return;
      const pricing = getPlanPricing(plan);
      if (pricing.discountPct && (!best || pricing.discountPct > best.pricing.discountPct)) {
        best = { product, plan, pricing };
      }
    });
  });
  return best;
}
