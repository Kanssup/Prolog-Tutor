/**
 * Stats Service for Prolog-Tutor
 * Handles statistics gathering business logic
 */

class StatsService {
  /**
   * Create a StatsService with injected dependencies
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
   * Get comprehensive statistics from all services
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      fileManager: this.fileManager.getStats(),
      processPool: this.processPool.getStats(),
      queryCache: this.queryCache.getStats(),
      uptime: process.uptime()
    };
  }

  /**
   * Get summary statistics
   * @returns {Object} Summary statistics
   */
  getSummary() {
    const stats = this.getStats();
    return {
      totalFiles: stats.fileManager.totalFiles,
      totalProcesses: stats.processPool.processesByStatus?.total || 0,
      availableProcesses: stats.processPool.processesByStatus?.available || 0,
      cacheHitRate: stats.queryCache.hitRate || 0,
      cacheEntries: stats.queryCache.entries || 0,
      uptime: stats.uptime
    };
  }
}

module.exports = StatsService;
