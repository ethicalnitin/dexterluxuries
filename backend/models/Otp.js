const mongoose = require("mongoose");

const OTP_TTL_SECONDS = 5 * 60; // codes expire 5 minutes after creation

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  // `expires` here creates a MongoDB TTL index — Mongo itself deletes the
  // document once this many seconds have passed since createdAt, so expired
  // codes clean themselves up with no extra cron job needed.
  createdAt: { type: Date, default: Date.now, expires: OTP_TTL_SECONDS },
});

module.exports = mongoose.model("Otp", otpSchema);