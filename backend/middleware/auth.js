const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Protects a route: rejects with 401 if there's no valid "Authorization:
// Bearer <token>" header, otherwise attaches { id, email } to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Sign in required to continue." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Sign in again." });
  }
}

module.exports = { requireAuth };