const crypto = require("crypto");
const { config } = require("../config/env");

const PEPPER = config.otpSecret || "dev-only-insecure-pepper-change-me";

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashOtp(code) {
  return crypto.createHmac("sha256", PEPPER).update(String(code)).digest("hex");
}

module.exports = { generateOtp, hashOtp };
