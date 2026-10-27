const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { expireOverdue, transition, toAdmin } = require("../services/orders");
const { ORDER_STATUSES, TRANSITIONS } = require("../config/orders");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { sendDeliveryEmail } = require("../utils/mailer");
const { isValidEmail, normalizeEmail, readString, isHttpsUrl } = require("../utils/validate");
const DELIVERY_PRESETS = require("../config/deliveryPresets");
const { logger, maskEmail } = require("../utils/logger");

const router = express.Router();

router.use(requireAuth, requireAdmin);

const DEFAULT_MESSAGE =
  "Thank you for your purchase! Your plan is now active. Use the link below to access your content.";

router.get("/delivery-presets", (req, res) => {
  res.json({ presets: DELIVERY_PRESETS });
});

router.post("/deliveries", async (req, res) => {
  const body = req.body || {};
  const customerEmail = normalizeEmail(body.customerEmail);
  const productName = readString(body.productName).trim();
  const planDuration = readString(body.planDuration).trim();
  const driveLink = readString(body.driveLink).trim();
  const message = readString(body.message).trim() || DEFAULT_MESSAGE;

  if (!isValidEmail(customerEmail)) {
    return res.status(400).json({ error: "Enter a valid customer email." });
  }
  if (!productName || productName.length > 120) {
    return res.status(400).json({ error: "Enter the product name (up to 120 characters)." });
  }
  if (!planDuration || planDuration.length > 60) {
    return res.status(400).json({ error: "Enter the plan duration (up to 60 characters)." });
  }
  if (driveLink.length > 2000 || !isHttpsUrl(driveLink)) {
    return res.status(400).json({ error: "The access link must be a valid https:// URL." });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: "The message must be at most 2000 characters." });
  }

  try {
    await sendDeliveryEmail({ to: customerEmail, productName, planDuration, link: driveLink, message });
    logger.info("Delivery email sent", { requestId: req.id, adminId: req.user.id, to: maskEmail(customerEmail), productName, planDuration });
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === "MAIL_NOT_CONFIGURED") {
      return res.status(503).json({ error: "Email isn't configured on the server (SMTP settings missing)." });
    }
    logger.error("Delivery email failed", { requestId: req.id, to: maskEmail(customerEmail), err });
    res.status(502).json({ error: "Couldn't send the email. Try again." });
  }
});

router.get("/orders", async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(", ")}.` });
  }
  try {
    await expireOverdue();
    const orders = await Order.find(status ? { status } : {}).sort({ _id: -1 }).limit(100).populate("user", "email name");
    res.json({ orders: orders.map(toAdmin) });
  } catch (err) {
    logger.error("Listing orders failed", { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't load orders. Try again." });
  }
});

router.post("/orders/:id/status", async (req, res) => {
  const body = req.body || {};
  const status = readString(body.status);
  const reason = readString(body.reason).trim();
  if (!Object.keys(TRANSITIONS.admin).includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${Object.keys(TRANSITIONS.admin).join(", ")}.` });
  }
  if (status === "payment_failed" && (!reason || reason.length > 200)) {
    return res.status(400).json({ error: "Give the customer a reason (up to 200 characters)." });
  }
  if (reason.length > 200) return res.status(400).json({ error: "The note must be at most 200 characters." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Order not found." });

  const now = new Date();
  const changes = {
    paid: { set: { "payment.verifiedAt": now }, unset: { "payment.failureReason": "" } },
    payment_failed: { set: { "payment.failureReason": reason } },
    fulfilled: { set: { fulfilledAt: now } },
  }[status];

  try {
    const updated = await transition({ _id: req.params.id }, status, "admin", { ...changes, note: reason || undefined });
    if (!updated) {
      const current = await Order.findById(req.params.id).populate("user", "email name");
      if (!current) return res.status(404).json({ error: "Order not found." });
      return res.status(409).json({ error: `This order is ${current.status.replace("_", " ")}, so it can't be marked ${status.replace("_", " ")}.`, order: toAdmin(current) });
    }
    await updated.populate("user", "email name");
    logger.info("Order status changed by admin", { requestId: req.id, adminId: req.user.id, orderRef: updated.orderRef, status });
    res.json({ order: toAdmin(updated) });
  } catch (err) {
    logger.error("Updating order status failed", { requestId: req.id, err });
    res.status(500).json({ error: "Couldn't update the order. Try again." });
  }
});

module.exports = router;
