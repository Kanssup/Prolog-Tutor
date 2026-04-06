/**
 * Prolog-Tutor Backend - Orchestration Layer
 * 
 * This file re-exports from server.js to maintain backward compatibility.
 * All application logic has been moved to server.js and the src/ directory.
 * 
 * @deprecated Use server.js as the entry point instead
 */

const { createApp } = require('./server');
const logger = require('./src/config/logger');

// Re-export everything for backward compatibility
module.exports = { createApp };

// For direct execution, start the server
if (require.main === module) {
  logger.warn('Warning: app.js is deprecated. Please use server.js as the entry point.');
  createApp();
}
