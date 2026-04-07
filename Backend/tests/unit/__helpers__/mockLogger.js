/**
 * Mock Logger for Unit Tests
 * Provides a silent logger that doesn't output anything during tests
 */

function createMockLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn()
  };
}

// Create a default silent logger
const mockLogger = createMockLogger();

// Override console methods for debugging test failures
mockLogger.info.mockImplementation((msg, meta) => {
  // Silent by default
});

mockLogger.error.mockImplementation((msg, meta) => {
  // Silent by default  
});

mockLogger.warn.mockImplementation((msg, meta) => {
  // Silent by default
});

mockLogger.debug.mockImplementation((msg, meta) => {
  // Silent by default
});

module.exports = mockLogger;
module.exports.createMockLogger = createMockLogger;
