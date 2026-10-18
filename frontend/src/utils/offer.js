import { getPlanPricing, isPlanAvailable, isProductInStock } from "./pricing";

// When the current sale offer ends: midnight tonight (00:00 the next calendar
// day). Shared by the product page's "Offer ends in" timer and the
// first-visit offer popup so the two always agree.
export function getOfferEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

// The in-stock product plan with the largest real discount (price vs its
// strike-through price), or null if nothing is discounted.
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
