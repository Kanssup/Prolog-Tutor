/**
 * Health Controller for Prolog-Tutor
 * Handles request/response for the health endpoint
 */

/**
 * Create a health controller with injected service
 * @param {HealthCheckService} healthCheckService - Health check service instance
 * @returns {Function} Express request handler
 */
function createHealthController(healthCheckService) {
  return (req, res) => {
    const health = healthCheckService.getHealth();
    res.json(health);
  };
}

module.exports = { createHealthController };
