/**
 * Mock Child Process Factory for Unit Tests
 * Creates fake ChildProcess instances with EventEmitter behavior
 */

const { EventEmitter } = require('events');

/**
 * Create a fake ChildProcess for testing
 * @param {Object} options - Process options
 * @returns {Object} Fake child process
 */
function createMockChildProcess(options = {}) {
  const {
    exitCode = 0,
    shouldFail = false,
    failAfterMs = null,
    stdoutData = '',
    stderrData = ''
  } = options;

  const emitter = new EventEmitter();
  
  // Create mock stdin
  const stdin = {
    write: jest.fn((data, callback) => {
      // Simulate async write
      if (callback) {
        setImmediate(callback);
      }
      return true;
    }),
    end: jest.fn(),
    destroy: jest.fn(),
    paused: false,
    writable: true
  };

  // Create mock stdout
  const stdout = new EventEmitter();
  let stdoutHandler = null;

  // Create mock stderr
  const stderr = new EventEmitter();
  let stderrHandler = null;

  // Track if process has exited
  let hasExited = false;

  // Create the mock process
  const mockProcess = {
    // Event emitter methods
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
    addListener: emitter.addListener.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),

    // Process properties
    pid: Math.floor(Math.random() * 10000) + 1000,
    stdin,
    stdout: {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          stdoutHandler = handler;
        }
        return mockProcess.stdout;
      }),
      once: jest.fn((event, handler) => {
        if (event === 'data') {
          stdoutHandler = handler;
        }
        return mockProcess.stdout;
      }),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      readable: true,
      writable: false
    },
    stderr: {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          stderrHandler = handler;
        }
        return mockProcess.stderr;
      }),
      once: jest.fn((event, handler) => {
        if (event === 'data') {
          stderrHandler = handler;
        }
        return mockProcess.stderr;
      }),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      readable: true,
      writable: false
    },
    k: jest.fn((signal) => {
      // Simulate kill
      if (!hasExited) {
        mockProcess.emit('exit', 137, signal);
        hasExited = true;
      }
    }),
    kill: jest.fn((signal) => {
      // Alias for kill
      if (!hasExited) {
        mockProcess.emit('exit', 137, signal || 'SIGTERM');
        hasExited = true;
      }
    }),
    killed: false,
    connected: true,
    exitCode: null,
    signalCode: null,
    spawning: false,

    // Methods
    ref: jest.fn(),
    unref: jest.fn(),
    send: jest.fn(),

    // Helper to simulate stdout data
    emitStdout: (data) => {
      if (stdoutHandler) {
        stdoutHandler(Buffer.isBuffer(data) ? data : Buffer.from(data));
      }
    },

    // Helper to simulate stderr data
    emitStderr: (data) => {
      if (stderrHandler) {
        stderrHandler(Buffer.isBuffer(data) ? data : Buffer.from(data));
      }
    },

    // Helper to simulate process exit
    emitExit: (code = 0, signal = null) => {
      if (!hasExited) {
        hasExited = true;
        mockProcess.exitCode = code;
        mockProcess.signalCode = signal;
        mockProcess.killed = true;
        emitter.emit('exit', code, signal);
      }
    },

    // Helper to simulate process error
    emitError: (error) => {
      emitter.emit('error', error);
    }
  };

  // Set up automatic exit after specified delay if needed
  if (failAfterMs !== null) {
    setTimeout(() => {
      if (!hasExited) {
        if (shouldFail) {
          mockProcess.emitExit(1, shouldFail ? 'SIGTERM' : null);
        } else {
          mockProcess.emitExit(exitCode);
        }
      }
    }, failAfterMs);
  }

  // Initial spawn behavior - emit ready after a tick
  setImmediate(() => {
    if (stderrData && stderrHandler) {
      mockProcess.emitStderr(stderrData);
    }
    // Auto-exit after some data is sent
    setTimeout(() => {
      if (!hasExited) {
        mockProcess.emitExit(shouldFail ? 1 : exitCode);
      }
    }, 50);
  });

  return mockProcess;
}

/**
 * Create a mock spawn function
 * @param {Object} defaultOptions - Default options for spawned processes
 * @returns {Function} Mock spawn function
 */
function createMockSpawn(defaultOptions = {}) {
  return jest.fn((command, args, options) => {
    const mergedOptions = { ...defaultOptions, ...options };
    return createMockChildProcess(mergedOptions);
  });
}

module.exports = {
  createMockChildProcess,
  createMockSpawn
};
