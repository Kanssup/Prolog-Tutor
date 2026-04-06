/**
 * Stats Routes for Prolog-Tutor
 */

const express = require('express');
const { createStatsController } = require('../controllers/statsController');

/**
 * Create stats routes
 * @param {StatsService} statsService - Stats service
 * @returns {express.Router} Express router
 */
function createStatsRoutes(statsService) {
  const router = express.Router();
  const statsController = createStatsController(statsService);

  // GET /api/stats
  router.get('/', statsController);

  return router;
}

module.exports = createStatsRoutes;
