import { apiRequest } from "../config/api";

const LIST_TTL_MS = 5 * 60 * 1000;
let listCache = null;

export function getProducts() {
  if (listCache && Date.now() - listCache.time < LIST_TTL_MS) return listCache.promise;

  const promise = apiRequest("/products", { fallbackError: "Failed to load products." }).then((data) =>
    Array.isArray(data) ? data : []
  );
  listCache = { promise, time: Date.now() };
  promise.catch(() => {
    if (listCache && listCache.promise === promise) listCache = null;
  });
  return promise;
}

export function getProduct(id) {
  return apiRequest(`/products/${encodeURIComponent(id)}`, { fallbackError: "Failed to fetch product." });
}

export function clearProductCache() {
  listCache = null;
}
