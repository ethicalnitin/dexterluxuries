const mongoose = require("mongoose");
const { ORDER_STATUSES } = require("../config/orders");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    productName: String,
    planIndex: Number,
    planName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: Number,
    unitPriceInr: Number,
    lineTotalInr: Number,
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: String,
    at: { type: Date, default: Date.now },
    by: { type: String, enum: ["customer", "admin", "system"] },
    note: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderRef: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: Number,
    totalInr: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment", index: true },
    source: { type: String, enum: ["cart", "buy_now"], default: "cart" },
    expiresAt: Date,
    idempotencyKey: String,
    itemsSignature: String,
    payment: {
      method: { type: String, default: "UPI" },
      utr: String,
      submittedAt: Date,
      attempts: { type: Number, default: 0 },
      verifiedAt: Date,
      failureReason: String,
    },
    cancelledAt: Date,
    cancelReason: { type: String, enum: ["customer", "expired"] },
    fulfilledAt: Date,
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
orderSchema.index({ "payment.utr": 1 }, { unique: true, partialFilterExpression: { "payment.utr": { $type: "string" } } });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
