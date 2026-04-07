/**
 * Unit Tests for requestLogger.js middleware
 */

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../src/constants/server', () => ({
  MAX_LOG_BODY_SIZE: 1000
}));

const { createRequestLogger, requestLogger, detailedRequestLogger } = require('../../src/middleware/requestLogger');

describe('requestLogger middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = require('../../src/config/logger');
    
    mockReq = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn((header) => {
        if (header === 'user-agent') return 'test-agent';
        return null;
      })
    };
    
    mockRes = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setImmediate(callback);
        }
      })
    };
    
    mockNext = jest.fn();
  });

  describe('createRequestLogger', () => {
    it('should create a request logger middleware', () => {
      const logger = createRequestLogger();
      
      expect(typeof logger).toBe('function');
    });

    it('should call next()', () => {
      const logger = createRequestLogger();
      
      logger(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach requestId to req', () => {
      const logger = createRequestLogger();
      
      logger(mockReq, mockRes, mockNext);
      
      expect(mockReq.requestId).toBeDefined();
      expect(mockReq.requestId).toMatch(/^req_/);
    });

    it('should log incoming request', () => {
      const logger = createRequestLogger();
      
      logger(mockReq, mockRes, mockNext);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          requestId: expect.any(String),
          method: 'GET',
          path: '/api/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent'
        })
      );
    });
  });

  describe('requestLogger default', () => {
    it('should use default options', () => {
      requestLogger(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('detailedRequestLogger', () => {
    it('should log query parameters when logQuery is true', () => {
      mockReq.query = { foo: 'bar' };
      
      detailedRequestLogger(mockReq, mockRes, mockNext);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          query: { foo: 'bar' }
        })
      );
    });
  });

  describe('requestId generation', () => {
    it('should generate unique request IDs', () => {
      const logger = createRequestLogger();
      
      logger(mockReq, mockRes, mockNext);
      const requestId1 = mockReq.requestId;
      
      mockReq.requestId = null;
      logger(mockReq, mockRes, mockNext);
      const requestId2 = mockReq.requestId;
      
      expect(requestId1).not.toBe(requestId2);
    });
  });
});
