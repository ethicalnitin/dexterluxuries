const id = (orderId) => encodeURIComponent(orderId);

export const placeOrder = (authRequest, body) =>
  authRequest("/orders", { method: "POST", body, fallbackError: "Couldn't place your order. Try again." });

export const listOrders = (authRequest, before) =>
  authRequest(`/orders${before ? `?before=${id(before)}` : ""}`, { fallbackError: "Couldn't load your orders. Try again." });

export const getOrder = (authRequest, orderId) =>
  authRequest(`/orders/${id(orderId)}`, { fallbackError: "Couldn't load this order. Try again." });

export const submitPayment = (authRequest, orderId, utr) =>
  authRequest(`/orders/${id(orderId)}/payment`, {
    method: "POST",
    body: { utr },
    fallbackError: "Could not record your payment. Please try again.",
  });

export const cancelOrder = (authRequest, orderId) =>
  authRequest(`/orders/${id(orderId)}/cancel`, { method: "POST", fallbackError: "Couldn't cancel this order. Try again." });

export const adminListOrders = (authRequest, status) =>
  authRequest(`/admin/orders${status ? `?status=${id(status)}` : ""}`, { fallbackError: "Couldn't load orders." });

export const adminSetOrderStatus = (authRequest, orderId, status, reason) =>
  authRequest(`/admin/orders/${id(orderId)}/status`, {
    method: "POST",
    body: { status, ...(reason ? { reason } : {}) },
    fallbackError: "Couldn't update the order.",
  });
