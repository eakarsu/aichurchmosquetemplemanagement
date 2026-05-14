const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// AI endpoints: 20 calls per hour per user (keyed by user ID from JWT or IP as fallback)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Use authenticated user ID if available, otherwise fall back to IP (with IPv6 helper)
    if (req.user && req.user.id) return `user_${req.user.id}`;
    return ipKeyGenerator(req, res);
  },
  message: { error: 'AI rate limit exceeded. Maximum 20 AI requests per hour per user.' }
});

module.exports = { aiRateLimiter };
