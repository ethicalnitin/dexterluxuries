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
const { isValidEmail, normalizeEmail, readString: readPassword } = require("../utils/validate");
const { config } = require("../config/env");
const { logger } = require("../utils/logger");

const router = express.Router();

const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MIN = 2;
const NAME_MAX = 60;
const MINUTE = 60 * 1000;

function passwordProblem(password) {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  return null;
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwtSecret, { expiresIn: "30d" });
}

const dummyHashPromise = hashPassword(crypto.randomBytes(16).toString("hex"));

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

  await Otp.deleteMany({ email });
  return null;
}

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

      res.status(201).json({ token: issueToken(user), user: user.toPublic() });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "An account with this email already exists. Log in instead." });
      }
      logger.error("Signup failed", { requestId: req.id, err });
      res.status(500).json({ error: "Couldn't create your account. Try again." });
    }
  }
);

router.post(
  "/login",
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
      res.json({ token: issueToken(user), user: user.toPublic() });
    } catch (err) {
      logger.error("Login failed", { requestId: req.id, err });
      res.status(500).json({ error: "Couldn't log you in. Try again." });
    }
  }
);

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
      await Otp.deleteMany({ email });
      await Otp.create({ email, codeHash: hashOtp(code) });

      try {
        await sendPasswordResetEmail(email, code);
      } catch (err) {
        await Otp.deleteMany({ email });
        throw err;
      }

      res.json({ success: true });
    } catch (err) {
      if (err.code === "MAIL_NOT_CONFIGURED") {
        return res.status(503).json({ error: "Password reset is temporarily unavailable. Contact support." });
      }
      logger.error("Forgot-password failed", { requestId: req.id, err });
      res.status(500).json({ error: "Couldn't send the reset code. Try again." });
    }
  }
);

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
      user.passwordChangedAt = new Date();
      user.lastLoginAt = new Date();
      await user.save();

      res.json({ token: issueToken(user), user: user.toPublic() });
    } catch (err) {
      logger.error("Reset-password failed", { requestId: req.id, err });
      res.status(500).json({ error: "Couldn't reset your password. Try again." });
    }
  }
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
