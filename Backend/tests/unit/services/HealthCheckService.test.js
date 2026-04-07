/**
 * Unit Tests for HealthCheckService.js
 */

const HealthCheckService = require('../../../src/services/HealthCheckService');

describe('HealthCheckService', () => {
  let healthCheckService;
  let mockFileManager;
  let mockProcessPool;
  let mockQueryCache;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFileManager = {
      getStats: jest.fn().mockReturnValue({
        totalFiles: 5,
        tempDir: '/tmp/test'
      })
    };
    
    mockProcessPool = {
      getStats: jest.fn().mockReturnValue({
        processesByStatus: { total: 3, available: 2, in_use: 1 }
      })
    };
    
    mockQueryCache = {
      getStats: jest.fn().mockReturnValue({
        entries: 10,
        hitRate: 75
      })
    };
    
    healthCheckService = new HealthCheckService({
      fileManager: mockFileManager,
      processPool: mockProcessPool,
      queryCache: mockQueryCache
    });
  });

  describe('getHealth', () => {
    it('should return healthy status', () => {
      const health = healthCheckService.getHealth();
      
      expect(health.status).toBe('healthy');
    });

    it('should include timestamp', () => {
      const health = healthCheckService.getHealth();
      
      expect(health.timestamp).toBeDefined();
      expect(new Date(health.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include service stats', () => {
      const health = healthCheckService.getHealth();
      
      expect(health.services).toBeDefined();
      expect(health.services.fileManager).toBeDefined();
      expect(health.services.processPool).toBeDefined();
      expect(health.services.queryCache).toBeDefined();
    });

    it('should call getStats on all services', () => {
      healthCheckService.getHealth();
      
      expect(mockFileManager.getStats).toHaveBeenCalled();
      expect(mockProcessPool.getStats).toHaveBeenCalled();
      expect(mockQueryCache.getStats).toHaveBeenCalled();
    });
  });

  describe('isServiceHealthy', () => {
    it('should return true for fileManager when totalFiles is defined', () => {
      const result = healthCheckService.isServiceHealthy('fileManager');
      
      expect(result).toBe(true);
    });

    it('should return true for processPool when processes exist', () => {
      const result = healthCheckService.isServiceHealthy('processPool');
      
      expect(result).toBe(true);
    });

    it('should return true for queryCache when entries is defined', () => {
      const result = healthCheckService.isServiceHealthy('queryCache');
      
      expect(result).toBe(true);
    });

    it('should return false for unknown service', () => {
      const result = healthCheckService.isServiceHealthy('unknown');
      
      expect(result).toBe(false);
    });

    it('should return false for fileManager when totalFiles is undefined', () => {
      mockFileManager.getStats.mockReturnValue({});
      
      const result = healthCheckService.isServiceHealthy('fileManager');
      
      expect(result).toBe(false);
    });

    it('should return false for processPool when no processes', () => {
      mockProcessPool.getStats.mockReturnValue({
        processesByStatus: { total: 0 }
      });
      
      const result = healthCheckService.isServiceHealthy('processPool');
      
      expect(result).toBe(false);
    });
  });
});
