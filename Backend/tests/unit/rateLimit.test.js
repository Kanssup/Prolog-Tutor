/**
 * Unit Tests for rateLimit.js middleware
 */

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../src/constants', () => ({
  HTTP_STATUS_TOO_MANY_REQUESTS: 429,
  DEFAULT_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  DEFAULT_RATE_LIMIT_MAX: 100,
  EXECUTE_RATE_LIMIT_WINDOW_MS: 60 * 1000,
  EXECUTE_RATE_LIMIT_MAX: 20,
  HEALTH_RATE_LIMIT_WINDOW_MS: 60 * 1000,
  HEALTH_RATE_LIMIT_MAX: 1000
}));

jest.mock('express-rate-limit', () => {
  const store = new Map();
  let hitCount = 0;
  
  return jest.fn().mockImplementation((options) => {
    const { windowMs, max, handler } = options;
    
    return (req, res, next) => {
      const key = req.ip || 'default';
      const now = Date.now();
      
      // Simple in-memory rate limiting for tests
      if (!store.has(key)) {
        store.set(key, { resetTime: now + windowMs, count: 0 });
      }
      
      const record = store.get(key);
      
      if (now > record.resetTime) {
        record.resetTime = now + windowMs;
        record.count = 0;
      }
      
      record.count++;
      hitCount++;
      
      if (record.count > max) {
        return handler(req, res, next, options);
      }
      
      next();
    };
  });
});

const {
  createLimiter,
  createCustomLimiter,
  defaultLimiter,
  executeLimiter,
  healthLimiter,
  DEFAULT_LIMITER_OPTIONS,
  EXECUTE_LIMITER_OPTIONS,
  HEALTH_LIMITER_OPTIONS
} = require('../../src/middleware/rateLimit');

describe('rateLimit middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/api/test'
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('createLimiter', () => {
    it('should create a rate limiter function', () => {
      const limiter = createLimiter();
      
      expect(typeof limiter).toBe('function');
    });

    it('should call next() for requests under limit', () => {
      const limiter = createLimiter({ max: 10, windowMs: 60000 });
      
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 429 when limit exceeded', () => {
      const limiter = createLimiter({ max: 1, windowMs: 60000 });
      
      // First request succeeds
      limiter(mockReq, mockRes, mockNext);
      mockNext.mockClear();
      
      // Second request should be blocked
      mockNext = jest.fn();
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });
  });

  describe('createCustomLimiter', () => {
    it('should create limiter with custom window and max', () => {
      const limiter = createCustomLimiter(60000, 50);
      
      expect(typeof limiter).toBe('function');
    });
  });

  describe('defaultLimiter', () => {
    it('should be configured with default options', () => {
      expect(DEFAULT_LIMITER_OPTIONS).toBeDefined();
      expect(DEFAULT_LIMITER_OPTIONS.windowMs).toBe(15 * 60 * 1000);
      expect(DEFAULT_LIMITER_OPTIONS.max).toBe(100);
    });

    it('should allow requests under default limit', () => {
      defaultLimiter(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('executeLimiter', () => {
    it('should be configured with stricter options', () => {
      expect(EXECUTE_LIMITER_OPTIONS.max).toBeLessThan(DEFAULT_LIMITER_OPTIONS.max);
    });

    it('should apply stricter rate limiting', () => {
      // Execute limiter has max of 20
      for (let i = 0; i < 21; i++) {
        executeLimiter(mockReq, mockRes, mockNext);
        mockNext.mockClear();
      }
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('healthLimiter', () => {
    it('should be configured with relaxed options', () => {
      expect(HEALTH_LIMITER_OPTIONS.max).toBeGreaterThan(DEFAULT_LIMITER_OPTIONS.max);
    });
  });

  describe('limiter options', () => {
    it('should include standardHeaders option', () => {
      expect(DEFAULT_LIMITER_OPTIONS.standardHeaders).toBe(true);
    });

    it('should include legacyHeaders option', () => {
      expect(DEFAULT_LIMITER_OPTIONS.legacyHeaders).toBe(false);
    });

    it('should include custom handler', () => {
      expect(DEFAULT_LIMITER_OPTIONS.handler).toBeDefined();
      expect(typeof DEFAULT_LIMITER_OPTIONS.handler).toBe('function');
    });

    it('should include message', () => {
      expect(DEFAULT_LIMITER_OPTIONS.message).toBeDefined();
      expect(DEFAULT_LIMITER_OPTIONS.message.success).toBe(false);
    });
  });
});
