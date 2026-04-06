/**
 * Execute Routes for Prolog-Tutor
 */

const express = require('express');
const { createExecuteController } = require('../controllers/executeController');
const { validateExecuteRequest } = require('../middleware/validation');
const { executeLimiter } = require('../middleware/rateLimit');

/**
 * Create execute routes
 * @param {QueryService} queryService - Query service
 * @returns {express.Router} Express router
 */
function createExecuteRoutes(queryService) {
  const router = express.Router();
  const executeController = createExecuteController(queryService);

  // POST /api/execute
  // Apply rate limiting and validation
  router.post('/', executeLimiter, validateExecuteRequest, executeController);

  return router;
}

module.exports = createExecuteRoutes;
