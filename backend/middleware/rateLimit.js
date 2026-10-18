// Tiny in-memory rate limiter, same idea as confirmRateLimit in index.js but
// reusable. Good enough for a single server instance; counts reset on restart.
//
//   router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), handler)
function rateLimit({ windowMs, max, keyFn = (req) => req.ip, message }) {
  const hits = new Map();

  // Without this sweep the Map would keep one entry per key forever.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyFn(req);
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({
        error: message || "Too many attempts. Please wait a few minutes and try again.",
      });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

module.exports = { rateLimit };
