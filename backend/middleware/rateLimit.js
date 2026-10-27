function rateLimit({ windowMs, max, keyFn = (req) => req.ip, message }) {
  const hits = new Map();

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
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000))));
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
