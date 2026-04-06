/**
 * Health Check Service for Prolog-Tutor
 * Handles health check business logic
 */

class HealthCheckService {
  /**
   * Create a HealthCheckService with injected dependencies
   * @param {Object} dependencies - Injected dependencies
   * @param {Object} dependencies.fileManager - File manager instance
   * @param {Object} dependencies.processPool - Process pool instance
   * @param {Object} dependencies.queryCache - Query cache instance
   */
  constructor({ fileManager, processPool, queryCache }) {
    this.fileManager = fileManager;
    this.processPool = processPool;
    this.queryCache = queryCache;
  }

  /**
   * Get health status of all services
   * @returns {Object} Health status object
   */
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        fileManager: this.fileManager.getStats(),
        processPool: this.processPool.getStats(),
        queryCache: this.queryCache.getStats()
      }
    };
  }

  /**
   * Check if a specific service is healthy
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if service is healthy
   */
  isServiceHealthy(serviceName) {
    const health = this.getHealth();
    const service = health.services[serviceName];
    
    if (!service) return false;
    
    // Check based on service type
    switch (serviceName) {
      case 'fileManager':
        return service.totalFiles !== undefined;
      case 'processPool':
        return service.processesByStatus?.total > 0;
      case 'queryCache':
        return service.entries !== undefined;
      default:
        return true;
    }
  }
}

module.exports = HealthCheckService;
