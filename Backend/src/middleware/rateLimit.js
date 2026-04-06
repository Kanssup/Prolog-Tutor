/**
 * Rate Limiting Middleware for Prolog-Tutor
 * Configurable per-endpoint rate limiting
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_MAX,
  EXECUTE_RATE_LIMIT_WINDOW_MS,
  EXECUTE_RATE_LIMIT_MAX,
  HEALTH_RATE_LIMIT_WINDOW_MS,
  HEALTH_RATE_LIMIT_MAX
} = require('../constants');

/**
 * Default rate limit configuration
 */
const DEFAULT_LIMITER_OPTIONS = {
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
  max: DEFAULT_RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(HTTP_STATUS_TOO_MANY_REQUESTS).json(options.message);
  }
};

/**
 * Strict limiter for execute endpoint
 */
const EXECUTE_LIMITER_OPTIONS = {
  windowMs: EXECUTE_RATE_LIMIT_WINDOW_MS,
  max: EXECUTE_RATE_LIMIT_MAX,
  message: {
    success: false,
    error: `Rate limit exceeded for execute endpoint. Max ${EXECUTE_RATE_LIMIT_MAX} requests per minute.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Execute rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(HTTP_STATUS_TOO_MANY_REQUESTS).json(options.message);
  }
};

/**
 * Relaxed limiter for health endpoint
 */
const HEALTH_LIMITER_OPTIONS = {
  windowMs: HEALTH_RATE_LIMIT_WINDOW_MS,
  max: HEALTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
};

/**
 * Create a rate limiter with custom options
 * @param {Object} options - Rate limit options
 * @returns {Function} Express rate limiter middleware
 */
function createLimiter(options = {}) {
  return rateLimit({ ...DEFAULT_LIMITER_OPTIONS, ...options });
}

/**
 * Default API limiter
 */
const defaultLimiter = createLimiter();

/**
 * Strict limiter for execute endpoint
 */
const executeLimiter = createLimiter(EXECUTE_LIMITER_OPTIONS);

/**
 * Relaxed limiter for health endpoint
 */
const healthLimiter = createLimiter(HEALTH_LIMITER_OPTIONS);

/**
 * Create a custom limiter for a specific window and max requests
 * @param {number} windowMs - Window in milliseconds
 * @param {number} max - Maximum requests per window
 * @returns {Function} Express rate limiter middleware
 */
function createCustomLimiter(windowMs, max) {
  return createLimiter({ windowMs, max });
}

module.exports = {
  createLimiter,
  createCustomLimiter,
  defaultLimiter,
  executeLimiter,
  healthLimiter,
  DEFAULT_LIMITER_OPTIONS,
  EXECUTE_LIMITER_OPTIONS,
  HEALTH_LIMITER_OPTIONS
};
