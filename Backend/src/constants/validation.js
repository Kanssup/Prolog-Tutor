/**
 * Validation Constants for Prolog-Tutor
 * Joi schemas and validation configuration
 */

const Joi = require('joi');

// Validation limits
const MAX_CODE_LENGTH = 10000;
const MAX_QUERY_LENGTH = 1000;
const MAX_INPUT_LENGTH = 20000;
const MAX_RUNTIME_FILES = 20;
const MAX_FILENAME_LENGTH = 255;
const MAX_FILE_CONTENT_SIZE = 200 * 1024; // 200KB

/**
 * Schema for execute endpoint request body
 */
const executeRequestSchema = Joi.object({
  code: Joi.string().required().max(MAX_CODE_LENGTH)
    .messages({
      'string.empty': 'Code cannot be empty',
      'any.required': 'Missing required field: code',
      'string.max': `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`
    }),
  query: Joi.string().required().max(MAX_QUERY_LENGTH)
    .messages({
      'string.empty': 'Query cannot be empty',
      'any.required': 'Missing required field: query',
      'string.max': `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`
    }),
  input: Joi.string().allow('').max(MAX_INPUT_LENGTH).default('')
    .messages({
      'string.max': `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`
    }),
  runtimeFiles: Joi.array().items(
    Joi.object({
      name: Joi.string().required()
        .messages({ 'any.required': 'Runtime file name is required' }),
      content: Joi.string().required()
        .messages({ 'any.required': 'Runtime file content is required' })
    })
  ).max(MAX_RUNTIME_FILES).default([])
    .messages({
      'array.max': `Too many runtime files. Maximum is ${MAX_RUNTIME_FILES}`
    })
});

/**
 * Schema for runtime file validation
 */
const runtimeFileSchema = Joi.object({
  name: Joi.string().required().max(MAX_FILENAME_LENGTH)
    .pattern(/^[^/\\:*?"<>|]+$/)
    .messages({
      'string.pattern.base': 'Invalid runtime file name',
      'any.required': 'Runtime file name is required'
    }),
  content: Joi.string().required().max(MAX_FILE_CONTENT_SIZE)
    .messages({
      'any.required': 'Runtime file content is required',
      'string.max': 'Runtime file content exceeds maximum size'
    })
});

/**
 * Schema for health check response
 */
const healthResponseSchema = Joi.object({
  status: Joi.string().valid('healthy', 'unhealthy').required(),
  timestamp: Joi.string().isoDate().required(),
  services: Joi.object({
    fileManager: Joi.object().required(),
    processPool: Joi.object().required(),
    queryCache: Joi.object().required()
  }).required()
});

/**
 * Schema for execute response
 */
const executeResponseSchema = Joi.object({
  success: Joi.boolean().required(),
  tree: Joi.any(),
  consoleOutput: Joi.string().allow(''),
  traceOutput: Joi.string().allow(''),
  executionTime: Joi.number().integer().min(0),
  processId: Joi.number().integer().min(0),
  cached: Joi.boolean(),
  updatedCode: Joi.string().allow(null),
  runtimeFiles: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    content: Joi.string().required(),
    truncated: Joi.boolean(),
    size: Joi.number().integer(),
    lastModified: Joi.string()
  })).allow(null)
});

module.exports = {
  executeRequestSchema,
  runtimeFileSchema,
  healthResponseSchema,
  executeResponseSchema,
  
  // Validation options
  VALIDATION_OPTIONS: {
    abortEarly: false,
    stripUnknown: true
  },
  
  // Validation limits
  MAX_CODE_LENGTH,
  MAX_QUERY_LENGTH,
  MAX_INPUT_LENGTH,
  MAX_RUNTIME_FILES,
  MAX_FILENAME_LENGTH,
  MAX_FILE_CONTENT_SIZE
};
