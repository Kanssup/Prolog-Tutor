/**
 * Health Routes for Prolog-Tutor
 */

const express = require('express');
const { createHealthController } = require('../controllers/healthController');

/**
 * Create health routes
 * @param {HealthCheckService} healthCheckService - Health check service
 * @returns {express.Router} Express router
 */
function createHealthRoutes(healthCheckService) {
  const router = express.Router();
  const healthController = createHealthController(healthCheckService);

  // GET /api/health
  router.get('/', healthController);

  return router;
}

module.exports = createHealthRoutes;
