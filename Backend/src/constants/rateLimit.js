/**
 * Rate Limit Constants for Prolog-Tutor
 * Centralized rate limiting configuration
 */

// HTTP Status
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// Default rate limiter (100 requests per 15 minutes)
const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;

// Execute endpoint limiter (30 requests per minute)
const EXECUTE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const EXECUTE_RATE_LIMIT_MAX = 30;

// Health endpoint limiter (120 requests per minute)
const HEALTH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const HEALTH_RATE_LIMIT_MAX = 120;

module.exports = {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_MAX,
  EXECUTE_RATE_LIMIT_WINDOW_MS,
  EXECUTE_RATE_LIMIT_MAX,
  HEALTH_RATE_LIMIT_WINDOW_MS,
  HEALTH_RATE_LIMIT_MAX
};
