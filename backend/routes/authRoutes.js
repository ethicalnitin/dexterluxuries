const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

// ─── POST /api/auth/send-otp ───────────────────────────────────────────────
// body: { email }
router.post("/send-otp", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  try {
    // Cooldown: don't let someone spam an inbox with codes.
    const lastOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (lastOtp) {
      const secondsSince = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      if (secondsSince < OTP_COOLDOWN_SECONDS) {
        return res.status(429).json({
          error: `Please wait ${Math.ceil(OTP_COOLDOWN_SECONDS - secondsSince)}s before requesting another code.`,
        });
      }
    }

    const code = generateOtp();
    await Otp.deleteMany({ email }); // any older, unused codes for this email are now invalid
    await Otp.create({ email, codeHash: hashOtp(code) });

    await sendOtpEmail(email, code);

    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] send-otp error:", err.message);
    res.status(500).json({ error: "Couldn't send the code. Try again." });
  }
});

// ─── POST /api/auth/verify-otp ─────────────────────────────────────────────
// body: { email, otp } -> { token, user: { email } }
router.post("/verify-otp", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: "Enter the 6-digit code sent to your email." });
  }

  try {
    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ error: "That code has expired. Send a new one." });
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      return res.status(429).json({ error: "Too many incorrect attempts. Send a new code." });
    }
    if (record.codeHash !== hashOtp(otp)) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ error: "Incorrect code. Check it and try again." });
    }

    // Correct — consume the code so it can't be reused, then sign them in.
    await Otp.deleteMany({ email });

    const user = await User.findOneAndUpdate(
      { email },
      { email, lastLoginAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ token, user: { email: user.email } });
  } catch (err) {
    console.error("[Auth] verify-otp error:", err.message);
    res.status(500).json({ error: "Couldn't verify the code. Try again." });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Lets the frontend check whether a token it has stored is still valid,
// e.g. on app load, without needing a full protected route to test against.
router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Not signed in." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: { email: payload.email } });
  } catch {
    res.status(401).json({ error: "Session expired." });
  }
});

module.exports = router;