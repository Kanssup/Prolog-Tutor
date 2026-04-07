/**
 * Unit Tests for validation.js middleware
 */

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { validate, validateRuntimeFiles, requireJson } = require('../../../src/middleware/validation');
const { executeRequestSchema, MAX_RUNTIME_FILES, MAX_FILE_CONTENT_SIZE } = require('../../../src/constants');

describe('validation middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      method: 'POST',
      path: '/api/execute',
      get: jest.fn()
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('validate middleware', () => {
    describe('valid request', () => {
      it('should call next() for valid request', () => {
        const schema = {
          validate: jest.fn().mockReturnValue({
            error: null,
            value: { code: 'test', query: 'test' }
          })
        };
        
        const middleware = validate(schema, 'body');
        mockReq.body = { code: 'test', query: 'test' };
        
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('should replace body with validated value', () => {
        const validatedValue = { code: 'validated', query: 'validated' };
        const schema = {
          validate: jest.fn().mockReturnValue({
            error: null,
            value: validatedValue
          })
        };
        
        const middleware = validate(schema, 'body');
        mockReq.body = { code: 'original' };
        
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockReq.body).toEqual(validatedValue);
      });
    });

    describe('invalid request', () => {
      it('should return 400 for invalid request', () => {
        const validationError = {
          details: [
            { path: ['code'], message: 'Code is required' }
          ]
        };
        
        const schema = {
          validate: jest.fn().mockReturnValue({
            error: validationError,
            value: null
          })
        };
        
        const middleware = validate(schema, 'body');
        mockReq.body = {};
        
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Validation failed',
            details: expect.any(Array)
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('validateRuntimeFiles', () => {
    it('should return valid for empty array', () => {
      const result = validateRuntimeFiles([]);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for valid runtime files', () => {
      const runtimeFiles = [
        { name: 'test.pl', content: 'test_data(1).' }
      ];
      
      const result = validateRuntimeFiles(runtimeFiles);
      
      expect(result.valid).toBe(true);
    });

    it('should return invalid when runtimeFiles is not an array', () => {
      const result = validateRuntimeFiles('not an array');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('runtimeFiles must be an array');
    });

    it('should return invalid when exceeds MAX_RUNTIME_FILES', () => {
      const runtimeFiles = Array(MAX_RUNTIME_FILES + 1).fill({
        name: 'test.pl',
        content: 'test.'
      });
      
      const result = validateRuntimeFiles(runtimeFiles);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Too many runtime files'))).toBe(true);
    });

    it('should return invalid when file is not an object', () => {
      const result = validateRuntimeFiles(['not an object']);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an object'))).toBe(true);
    });

    it('should return invalid when name is missing', () => {
      const result = validateRuntimeFiles([{ content: 'test.' }]);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name: required'))).toBe(true);
    });

    it('should return invalid when content is missing', () => {
      const result = validateRuntimeFiles([{ name: 'test.pl' }]);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('content: required'))).toBe(true);
    });

    it('should return invalid when name contains invalid characters', () => {
      const result = validateRuntimeFiles([
        { name: 'test<>file.pl', content: 'test.' }
      ]);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid characters'))).toBe(true);
    });

    it('should return invalid when content exceeds MAX_FILE_CONTENT_SIZE', () => {
      const largeContent = 'a'.repeat(MAX_FILE_CONTENT_SIZE + 1);
      const result = validateRuntimeFiles([
        { name: 'test.pl', content: largeContent }
      ]);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('200KB limit'))).toBe(true);
    });
  });

  describe('requireJson middleware', () => {
    it('should call next() for POST with application/json', () => {
      mockReq.method = 'POST';
      mockReq.get.mockReturnValue('application/json');
      
      requireJson(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() for non-POST methods', () => {
      mockReq.method = 'GET';
      
      requireJson(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 415 for POST without application/json', () => {
      mockReq.method = 'POST';
      mockReq.get.mockReturnValue('text/plain');
      
      requireJson(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(415);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Content-Type must be application/json'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 415 for PUT without application/json', () => {
      mockReq.method = 'PUT';
      mockReq.get.mockReturnValue('multipart/form-data');
      
      requireJson(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(415);
    });

    it('should return 415 for PATCH without application/json', () => {
      mockReq.method = 'PATCH';
      mockReq.get.mockReturnValue('');
      
      requireJson(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(415);
    });
  });
});
