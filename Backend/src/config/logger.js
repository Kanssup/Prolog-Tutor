/**
 * Winston Logger Configuration for Prolog-Tutor
 * Structured logging with multiple transports
 */

const winston = require('winston');
const path = require('path');
const serverConstants = require('../constants/server');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n${metadata.stack}`;
  } else if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Custom format for production (JSON)
const prodFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  json()
);

// Determine environment
const NODE_ENV = process.env.NODE_ENV || serverConstants.DEV;
const isDev = NODE_ENV === serverConstants.DEV;
const isProd = NODE_ENV === serverConstants.PROD;
const isTest = NODE_ENV === serverConstants.TEST;

// Create transports array
const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    handleErrors: true,
    handleExceptions: true,
    format: isDev 
      ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
      : combine(colorize(), prodFormat)
  })
);

// File transport for errors (always)
transports.push(
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: serverConstants.LOG_MAX_SIZE,
    maxFiles: serverConstants.LOG_MAX_FILES,
    format: prodFormat
  })
);

// File transport for all logs (production)
if (isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: serverConstants.LOG_MAX_SIZE,
      maxFiles: serverConstants.LOG_MAX_FILES,
      format: prodFormat
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: isTest ? 'error' : (isDev ? 'debug' : 'info'),
  defaultMeta: { service: 'prolog-tutor' },
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      maxsize: serverConstants.LOG_MAX_SIZE,
      maxFiles: serverConstants.LOG_MAX_EXCEPTION_FILES
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      maxsize: serverConstants.LOG_MAX_SIZE,
      maxFiles: serverConstants.LOG_MAX_EXCEPTION_FILES
    })
  ]
});

// Create child logger for request context
logger.child = (meta) => {
  return {
    info: (message, metaOrMsg) => logger.info(message, { ...meta, ...(typeof metaOrMsg === 'object' ? metaOrMsg : {}) }),
    warn: (message, metaOrMsg) => logger.warn(message, { ...meta, ...(typeof metaOrMsg === 'object' ? metaOrMsg : {}) }),
    error: (message, metaOrMsg) => logger.error(message, { ...meta, ...(typeof metaOrMsg === 'object' ? metaOrMsg : {}) }),
    debug: (message, metaOrMsg) => logger.debug(message, { ...meta, ...(typeof metaOrMsg === 'object' ? metaOrMsg : {}) }),
  };
};

module.exports = logger;
