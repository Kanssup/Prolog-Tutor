/**
 * Request Logging Middleware for Prolog-Tutor
 * Winston-based structured request logging
 */

const logger = require('../config/logger');
const serverConstants = require('../constants/server');

/**
 * Create request logging middleware
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function createRequestLogger(options = {}) {
  const {
    logBody = false,
    logQuery = false,
    excludePaths = ['/api/health']
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Attach request ID to request object
    req.requestId = requestId;
    
    // Log incoming request
    const logMeta = {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (logQuery && Object.keys(req.query).length > 0) {
      logMeta.query = req.query;
    }

    logger.info('Incoming request', logMeta);

    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const responseMeta = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip
      };

      // Only log body in development and for non-excluded paths
      if (logBody && process.env.NODE_ENV === 'development') {
        const contentLength = req.get('content-length');
        if (contentLength && parseInt(contentLength) < serverConstants.MAX_LOG_BODY_SIZE) {
          responseMeta.bodySize = contentLength;
        }
      }

      // Determine log level based on status code
      if (res.statusCode >= 500) {
        logger.error('Request completed with server error', responseMeta);
      } else if (res.statusCode >= 400) {
        logger.warn('Request completed with client error', responseMeta);
      } else {
        logger.info('Request completed', responseMeta);
      }
    });

    next();
  };
}

/**
 * Generate a simple request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default request logger with sensible defaults
 */
const requestLogger = createRequestLogger({
  excludePaths: ['/api/health']
});

/**
 * Detailed request logger for debugging
 */
const detailedRequestLogger = createRequestLogger({
  logQuery: true,
  excludePaths: []
});

module.exports = {
  createRequestLogger,
  requestLogger,
  detailedRequestLogger
};
