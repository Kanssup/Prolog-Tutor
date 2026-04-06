/**
 * Validation Middleware for Prolog-Tutor
 * Joi-based input validation middleware
 */

const Joi = require('joi');
const logger = require('../config/logger');
const { 
  executeRequestSchema, 
  VALIDATION_OPTIONS,
  MAX_RUNTIME_FILES,
  MAX_FILE_CONTENT_SIZE,
  HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE,
  HTTP_STATUS_BAD_REQUEST
} = require('../constants');

/**
 * Create validation middleware for a specific schema
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validate(schema, property = 'body', options = {}) {
  const { abortEarly = false, stripUnknown = true } = { ...VALIDATION_OPTIONS, ...options };

  return (req, res, next) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly,
      stripUnknown
    });

    if (error) {
      const validationError = {
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };

      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: validationError.details
      });

      return res.status(HTTP_STATUS_BAD_REQUEST).json(validationError);
    }

    // Replace with validated/sanitized value
    req[property] = value;
    next();
  };
}

/**
 * Validate execute request body
 */
const validateExecuteRequest = validate(executeRequestSchema, 'body');

/**
 * Validate content type is JSON
 */
function requireJson(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
}

/**
 * Validate runtime file entries
 * @param {Array} runtimeFiles - Array of runtime file objects
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
function validateRuntimeFiles(runtimeFiles) {
  if (!Array.isArray(runtimeFiles)) {
    return { valid: false, errors: ['runtimeFiles must be an array'] };
  }

  if (runtimeFiles.length > MAX_RUNTIME_FILES) {
    return { valid: false, errors: [`Too many runtime files. Max ${MAX_RUNTIME_FILES}.`] };
  }

  const errors = [];
  
  for (let i = 0; i < runtimeFiles.length; i++) {
    const file = runtimeFiles[i];
    
    if (typeof file !== 'object' || file === null) {
      errors.push(`runtimeFiles[${i}]: must be an object`);
      continue;
    }
    
    if (!file.name || typeof file.name !== 'string') {
      errors.push(`runtimeFiles[${i}].name: required and must be a string`);
    }
    
    if (!file.content || typeof file.content !== 'string') {
      errors.push(`runtimeFiles[${i}].content: required and must be a string`);
    }
    
    if (file.name && /[/\\:*?"<>|]/.test(file.name)) {
      errors.push(`runtimeFiles[${i}].name: contains invalid characters`);
    }
    
    if (file.content && Buffer.byteLength(file.content, 'utf8') > MAX_FILE_CONTENT_SIZE) {
      errors.push(`runtimeFiles[${i}].content: exceeds 200KB limit`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validate,
  validateExecuteRequest,
  requireJson,
  validateRuntimeFiles
};
