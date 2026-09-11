/**
 * In-memory sliding-window rate limiter middleware.
 * Protects resource-intensive AI endpoints against quota exhaustion.
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 30,
  message = 'Too many requests from this IP. Please wait before retrying.',
} = {}) {
  const ipRequests = new Map();

  // Periodic cleanup to avoid memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequests.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        ipRequests.delete(ip);
      } else {
        ipRequests.set(ip, active);
      }
    }
  }, windowMs);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    const timestamps = ipRequests.get(ip) || [];
    const windowStart = now - windowMs;
    const activeRequests = timestamps.filter((t) => t > windowStart);

    if (activeRequests.length >= maxRequests) {
      const oldest = activeRequests[0];
      const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + windowMs) / 1000));
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds,
      });
    }

    activeRequests.push(now);
    ipRequests.set(ip, activeRequests);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - activeRequests.length));
    next();
  };
}

module.exports = {
  createRateLimiter,
};
