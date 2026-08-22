const crypto = require("crypto");

// Set OTP_SECRET in your .env — this "peppers" the hash so a stolen DB dump
// alone isn't enough to forge codes. Any long random string works.
const PEPPER = process.env.OTP_SECRET;
if (!PEPPER) {
  console.warn("[OTP] OTP_SECRET is not set — using an insecure default. Set it in .env before deploying.");
}

function generateOtp() {
  // 6-digit numeric code, zero-padded (e.g. "004821")
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function hashOtp(code) {
  return crypto
    .createHmac("sha256", PEPPER || "dev-only-insecure-pepper-change-me")
    .update(String(code))
    .digest("hex");
}

module.exports = { generateOtp, hashOtp };