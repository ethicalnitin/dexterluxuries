import { apiRequest } from "../config/api";
import { toQuoteItems } from "../utils/cart";

export function quoteCart(items) {
  return apiRequest("/cart/quote", {
    method: "POST",
    body: { items: toQuoteItems(items) },
    fallbackError: "Couldn't check today's prices. Try again.",
  });
}
