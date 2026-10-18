const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { generateOtp, hashOtp } = require("../utils/otp");
const { hashPassword, verifyPassword } = require("../utils/password");
const { sendPasswordResetEmail } = require("../utils/mailer");
const { requireAuth } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MIN = 2;
const NAME_MAX = 60;
const MINUTE = 60 * 1000;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
// Only accept real strings so `{ "password": {...} }` can't sneak through.
const readPassword = (value) => (typeof value === "string" ? value : "");

function passwordProblem(password) {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  return null;
}

function toPublicUser(user) {
  return { id: user._id.toString(), name: user.name || "", email: user.email };
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

// Login with an unknown email still runs one scrypt, so response time doesn't
// reveal which emails have accounts.
const dummyHashPromise = hashPassword(crypto.randomBytes(16).toString("hex"));

// Checks a reset code and consumes it on success. Returns null when the code
// is good, otherwise { status, error }. Attempts are counted with an atomic
// $inc *before* comparing, so parallel guesses can't exceed OTP_MAX_ATTEMPTS.
async function consumeOtp(email, code) {
  const record = await Otp.findOneAndUpdate(
    { email, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { sort: { createdAt: -1 }, new: true }
  );

  if (!record) {
    const exhausted = await Otp.exists({ email });
    if (exhausted) {
      await Otp.deleteMany({ email });
      return { status: 429, error: "Too many incorrect attempts. Request a new code." };
    }
    return { status: 400, error: "That code has expired. Request a new one." };
  }
  if (record.codeHash !== hashOtp(code)) {
    return { status: 400, error: "Incorrect code. Check it and try again." };
  }

  await Otp.deleteMany({ email }); // one-time use
  return null;
}

// ─── POST /api/auth/signup ─────────────────────────────────────────────────
// body: { name, email, password } -> 201 { token, user }
router.post(
  "/signup",
  rateLimit({ windowMs: 60 * MINUTE, max: 10, message: "Too many sign-up attempts. Try again later." }),
  async (req, res) => {
    const name = String(req.body.name || "").trim().replace(/\s+/g, " ");
    const email = normalizeEmail(req.body.email);
    const password = readPassword(req.body.password);

    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return res.status(400).json({ error: `Enter your name (${NAME_MIN}–${NAME_MAX} characters).` });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    const problem = passwordProblem(password);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    try {
      const existing = await User.findOne({ email }).select("+passwordHash");
      if (existing) {
        return res.status(409).json({
          error: existing.passwordHash
            ? "An account with this email already exists. Log in instead."
            : "This email already has an account without a password. Use “Forgot password” to set one.",
        });
      }

      const user = await User.create({
        name,
        email,
        passwordHash: await hashPassword(password),
        lastLoginAt: new Date(),
      });

      res.status(201).json({ token: issueToken(user), user: toPublicUser(user) });
    } catch (err) {
      if (err.code === 11000) {
        // Two sign-ups for the same email raced past the findOne above.
        return res.status(409).json({ error: "An account with this email already exists. Log in instead." });
      }
      console.error("[Auth] signup error:", err.message);
      res.status(500).json({ error: "Couldn't create your account. Try again." });
    }
  }
);

// ─── POST /api/auth/login ──────────────────────────────────────────────────
// body: { email, password } -> { token, user }
router.post(
  "/login",
  // Keyed on IP + email so one shared mobile-carrier IP doesn't lock out
  // everyone behind it, while still capping guesses against any one account.
  rateLimit({
    windowMs: 15 * MINUTE,
    max: 10,
    keyFn: (req) => `${req.ip}|${normalizeEmail(req.body && req.body.email)}`,
    message: "Too many login attempts. Wait 15 minutes or reset your password.",
  }),
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = readPassword(req.body.password);

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: "Enter your email and password." });
    }

    try {
      const user = await User.findOne({ email }).select("+passwordHash");

      if (!user || !user.passwordHash) {
        await verifyPassword(password, await dummyHashPromise);
        if (user) {
          return res.status(401).json({
            error: "This account doesn't have a password yet. Use “Forgot password” to set one.",
          });
        }
        return res.status(401).json({ error: "Incorrect email or password." });
      }

      if (!(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({ error: "Incorrect email or password." });
      }

      await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
      res.json({ token: issueToken(user), user: toPublicUser(user) });
    } catch (err) {
      console.error("[Auth] login error:", err.message);
      res.status(500).json({ error: "Couldn't log you in. Try again." });
    }
  }
);

// ─── POST /api/auth/forgot-password ────────────────────────────────────────
// body: { email } -> { success: true }
// Emails a 6-digit reset code. Responds the same way whether or not the
// account exists.
router.post(
  "/forgot-password",
  rateLimit({ windowMs: 15 * MINUTE, max: 10 }),
  async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    try {
      const user = await User.exists({ email });
      if (!user) {
        return res.json({ success: true });
      }

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

      try {
        await sendPasswordResetEmail(email, code);
      } catch (err) {
        // Drop the code we couldn't deliver so the cooldown doesn't block a retry.
        await Otp.deleteMany({ email });
        throw err;
      }

      res.json({ success: true });
    } catch (err) {
      console.error("[Auth] forgot-password error:", err.message);
      res.status(500).json({ error: "Couldn't send the reset code. Try again." });
    }
  }
);

// ─── POST /api/auth/reset-password ─────────────────────────────────────────
// body: { email, otp, password } -> { token, user }
router.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * MINUTE, max: 20 }),
  async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const password = readPassword(req.body.password);

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "Enter the 6-digit code sent to your email." });
    }
    const problem = passwordProblem(password);
    if (problem) {
      return res.status(400).json({ error: problem });
    }

    try {
      const otpError = await consumeOtp(email, otp);
      if (otpError) {
        return res.status(otpError.status).json({ error: otpError.error });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "That code has expired. Request a new one." });
      }

      user.passwordHash = await hashPassword(password);
      user.passwordChangedAt = new Date(); // signs out every other session
      user.lastLoginAt = new Date();
      await user.save();

      res.json({ token: issueToken(user), user: toPublicUser(user) });
    } catch (err) {
      console.error("[Auth] reset-password error:", err.message);
      res.status(500).json({ error: "Couldn't reset your password. Try again." });
    }
  }
);

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Lets the frontend check whether a token it has stored is still valid,
// e.g. on app load, and returns the current profile.
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
