const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

// Protects a route: rejects with 401 if there's no valid "Authorization:
// Bearer <token>" header, otherwise attaches { id, name, email } to req.user.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Sign in required to continue." });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Sign in again." });
  }

  try {
    const user = mongoose.isValidObjectId(payload.sub) ? await User.findById(payload.sub) : null;
    if (!user) {
      return res.status(401).json({ error: "Your session has expired. Sign in again." });
    }
    // iat is in whole seconds, so compare at that resolution.
    if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ error: "Your password was changed. Sign in again." });
    }

    req.user = { id: user._id.toString(), name: user.name || "", email: user.email };
    next();
  } catch (err) {
    console.error("[Auth] requireAuth error:", err.message);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
}

module.exports = { requireAuth };
