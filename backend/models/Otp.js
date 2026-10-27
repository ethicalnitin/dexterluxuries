const mongoose = require("mongoose");

const OTP_TTL_SECONDS = 5 * 60;

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: OTP_TTL_SECONDS },
});

module.exports = mongoose.model("Otp", otpSchema);