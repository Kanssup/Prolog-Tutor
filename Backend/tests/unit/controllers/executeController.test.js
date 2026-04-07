/**
 * Unit Tests for executeController.js
 * Tests HTTP responses for execute endpoint
 */

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/middleware/validation', () => ({
  validateRuntimeFiles: jest.fn(() => ({ valid: true, errors: [] }))
}));

jest.mock('../../../src/constants/execution', () => ({
  MAX_CODE_LENGTH: 10000,
  MAX_QUERY_LENGTH: 1000,
  MAX_INPUT_LENGTH: 20000
}));

jest.mock('../../../src/constants/server', () => ({
  MAX_ERROR_SNIPPET_LENGTH: 200
}));

const { createExecuteController } = require('../../../src/controllers/executeController');

describe('executeController', () => {
  let controller;
  let mockQueryService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQueryService = {
      executeQuery: jest.fn()
    };
    
    controller = createExecuteController(mockQueryService);
    
    mockReq = {
      body: {}
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('successful execution', () => {
    it('should return success response with execution result', async () => {
      mockReq.body = {
        code: 'parent(tom, bob).',
        query: 'parent(tom, X).'
      };
      
      mockQueryService.executeQuery.mockResolvedValue({
        success: true,
        tree: [{ level: 1, goal: 'parent(tom, X)', status: 'success', children: [] }],
        consoleOutput: 'X = tom',
        executionTime: 100,
        processId: 1,
        cached: false
      });
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tree: expect.any(Array),
          executionTime: expect.any(Number)
        })
      );
    });
  });

  describe('validation - code too long', () => {
    it('should return 400 when code exceeds MAX_CODE_LENGTH', async () => {
      mockReq.body = {
        code: 'a'.repeat(10001),
        query: 'true.'
      };
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Code exceeds maximum length')
        })
      );
    });
  });

  describe('validation - query too long', () => {
    it('should return 400 when query exceeds MAX_QUERY_LENGTH', async () => {
      mockReq.body = {
        code: 'true.',
        query: 'a'.repeat(1001)
      };
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Query exceeds maximum length')
        })
      );
    });
  });

  describe('validation - input too long', () => {
    it('should return 400 when input exceeds MAX_INPUT_LENGTH', async () => {
      mockReq.body = {
        code: 'true.',
        query: 'true.',
        input: 'a'.repeat(20001)
      };
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Input exceeds maximum length')
        })
      );
    });
  });

  describe('validation - invalid runtime files', () => {
    it('should return 400 when runtime files are invalid', async () => {
      const { validateRuntimeFiles } = require('../../../src/middleware/validation');
      validateRuntimeFiles.mockReturnValueOnce({
        valid: false,
        errors: ['Too many runtime files']
      });
      
      mockReq.body = {
        code: 'true.',
        query: 'true.',
        runtimeFiles: Array(25).fill({ name: 'test.pl', content: 'test.' })
      };
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid runtime files'
        })
      );
    });
  });

  describe('error handling - timeout', () => {
    it('should return 408 when query execution times out', async () => {
      mockReq.body = {
        code: 'parent(tom, bob).',
        query: 'parent(tom, X).'
      };
      
      mockQueryService.executeQuery.mockRejectedValue(
        new Error('Query execution timeout after 30000ms')
      );
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query execution timeout'
        })
      );
    });
  });

  describe('error handling - file size exceeds', () => {
    it('should return 400 when file size exceeds limit', async () => {
      mockReq.body = {
        code: 'parent(tom, bob).',
        query: 'parent(tom, X).'
      };
      
      mockQueryService.executeQuery.mockRejectedValue(
        new Error('File size exceeds limit of 1048576 bytes')
      );
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('File size exceeds')
        })
      );
    });
  });

  describe('error handling - Prolog runtime error', () => {
    it('should return 400 for Prolog runtime errors', async () => {
      mockReq.body = {
        code: 'undefined.',
        query: 'foo.'
      };
      
      mockQueryService.executeQuery.mockRejectedValue(
        new Error('Prolog runtime error: foo/0: Undefined procedure')
      );
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Prolog runtime error')
        })
      );
    });
  });

  describe('error handling - generic error', () => {
    it('should return 500 for generic errors', async () => {
      mockReq.body = {
        code: 'parent(tom, bob).',
        query: 'parent(tom, X).'
      };
      
      mockQueryService.executeQuery.mockRejectedValue(
        new Error('Some internal error')
      );
      
      await controller(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error'
        })
      );
    });
  });
});
