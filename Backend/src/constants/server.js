/**
 * Server Constants for Prolog-Tutor
 * Centralized configuration for the Express server
 */

module.exports = {
  // Server
  DEFAULT_PORT: 3000,
  
  // Default pool and cache sizes
  DEFAULT_POOL_SIZE: 5,
  DEFAULT_CACHE_MAX_SIZE: 100,
  
  // HTTP Status Codes
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_INTERNAL_ERROR: 500,
  HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE: 415,
  HTTP_STATUS_BAD_REQUEST: 400,
  
  // Environment
  DEV: 'development',
  PROD: 'production',
  TEST: 'test',
  
  // Paths
  PROLOG_FILES_DIR: process.env.PROLOG_FILES_DIR || 'prolog_files',
  TEMP_DIR: 'temp',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // JSON body parser
  JSON_BODY_LIMIT: '1mb',
  
  // Shutdown
  SHUTDOWN_TIMEOUT_MS: 10000,
  
  // Logging
  LOG_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_MAX_FILES: 5,
  LOG_MAX_EXCEPTION_FILES: 3,
  MAX_LOG_BODY_SIZE: 10000, // bytes threshold for logging request body
  
  // Error Snippet Limits
  MAX_ERROR_SNIPPET_LENGTH: 100,
  MAX_CACHE_LOG_LENGTH: 50,
};
