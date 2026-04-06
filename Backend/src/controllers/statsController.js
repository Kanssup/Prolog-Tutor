/**
 * Stats Controller for Prolog-Tutor
 * Handles request/response for the stats endpoint
 */

/**
 * Create a stats controller with injected service
 * @param {StatsService} statsService - Stats service instance
 * @returns {Function} Express request handler
 */
function createStatsController(statsService) {
  return (req, res) => {
    const stats = statsService.getStats();
    res.json(stats);
  };
}

module.exports = { createStatsController };
