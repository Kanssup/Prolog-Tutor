/**
 * Unit Tests for StatsService.js
 */

const StatsService = require('../../../src/services/StatsService');

describe('StatsService', () => {
  let statsService;
  let mockFileManager;
  let mockProcessPool;
  let mockQueryCache;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileManager = {
      getStats: jest.fn().mockReturnValue({
        totalFiles: 5,
        filesByStatus: { ready: 5 }
      })
    };
    
    mockProcessPool = {
      getStats: jest.fn().mockReturnValue({
        processesByStatus: { total: 3, available: 2, in_use: 1 },
        created: 5,
        destroyed: 2,
        acquired: 100,
        released: 99
      })
    };
    
    mockQueryCache = {
      getStats: jest.fn().mockReturnValue({
        hits: 75,
        misses: 25,
        sets: 50,
        entries: 10,
        size: 1024,
        hitRate: 75
      })
    };
    
    statsService = new StatsService({
      fileManager: mockFileManager,
      processPool: mockProcessPool,
      queryCache: mockQueryCache
    });
  });

  describe('getStats', () => {
    it('should return stats from all services', () => {
      const stats = statsService.getStats();
      
      expect(stats.fileManager).toBeDefined();
      expect(stats.processPool).toBeDefined();
      expect(stats.queryCache).toBeDefined();
    });

    it('should include uptime', () => {
      const stats = statsService.getStats();
      
      expect(stats.uptime).toBeDefined();
      expect(typeof stats.uptime).toBe('number');
    });

    it('should call getStats on all dependencies', () => {
      statsService.getStats();
      
      expect(mockFileManager.getStats).toHaveBeenCalled();
      expect(mockProcessPool.getStats).toHaveBeenCalled();
      expect(mockQueryCache.getStats).toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('should return summary with key metrics', () => {
      const summary = statsService.getSummary();
      
      expect(summary.totalFiles).toBe(5);
      expect(summary.totalProcesses).toBe(3);
      expect(summary.availableProcesses).toBe(2);
      expect(summary.cacheHitRate).toBe(75);
      expect(summary.cacheEntries).toBe(10);
      expect(summary.uptime).toBeDefined();
    });

    it('should handle missing process pool stats', () => {
      mockProcessPool.getStats.mockReturnValue({});
      
      const summary = statsService.getSummary();
      
      expect(summary.totalProcesses).toBe(0);
      expect(summary.availableProcesses).toBe(0);
    });

    it('should handle missing query cache stats', () => {
      mockQueryCache.getStats.mockReturnValue({});
      
      const summary = statsService.getSummary();
      
      expect(summary.cacheHitRate).toBe(0);
      expect(summary.cacheEntries).toBe(0);
    });
  });
});
