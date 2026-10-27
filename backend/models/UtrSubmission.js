const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: Number,
    productName: String,
    planIndex: Number,
    planName: String,
    quantity: Number,
    unitPriceInr: Number,
    lineTotalInr: Number,
    status: String,
  },
  { _id: false }
);

const utrSchema = new mongoose.Schema({
  utr: { type: String, required: true, unique: true },
  orderRef: String,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  productId: String,
  productName: String,
  planName: String,
  items: { type: [orderItemSchema], default: undefined },
  amount: Number,
  expectedAmount: Number,
  amountMismatch: Boolean,
  hasUnavailableItems: Boolean,
  email: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.UtrSubmission || mongoose.model("UtrSubmission", utrSchema);
