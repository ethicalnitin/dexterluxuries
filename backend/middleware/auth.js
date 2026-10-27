const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { config } = require("../config/env");
const { logger } = require("../utils/logger");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Sign in required to continue." });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ error: "Your session has expired. Sign in again." });
  }

  try {
    const user = mongoose.isValidObjectId(payload.sub) ? await User.findById(payload.sub) : null;
    if (!user) {
      return res.status(401).json({ error: "Your session has expired. Sign in again." });
    }
    if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ error: "Your password was changed. Sign in again." });
    }

    req.user = user.toPublic();
    next();
  } catch (err) {
    logger.error("requireAuth failed", { requestId: req.id, err });
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "You don't have permission to do that." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
