/**
 * Unit Tests for prologPool.js
 * Tests process pool creation, acquire, release, execute, and drain
 */

// Mock dependencies BEFORE requiring the module
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/constants/execution', () => ({
  DEFAULT_POOL_SIZE: 2,
  MAX_POOL_SIZE: 5,
  IDLE_TIMEOUT_MS: 30000,
  QUERY_TIMEOUT_MS: 30000,
  HEALTH_CHECK_INTERVAL_MS: 60000,
  MAX_MEMORY_USAGE: 100 * 1024 * 1024,
  PROCESS_INIT_TIMEOUT_MS: 5000,
  PROCESS_ACQUIRE_TIMEOUT_MS: 5000,
  PROCESS_READY_DELAY_MS: 50,
  HEALTH_CHECK_SAMPLE_SIZE: 2,
  HEALTH_CHECK_TIMEOUT_MS: 3000
}));

const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const PrologProcessPool = require('../../../prologPool');

// Mock setInterval to prevent health check intervals from running
let activeIntervals = [];
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

beforeAll(() => {
  global.setInterval = (...args) => {
    const id = originalSetInterval(...args);
    activeIntervals.push(id);
    return id;
  };
  global.clearInterval = (id) => {
    activeIntervals = activeIntervals.filter(i => i !== id);
    originalClearInterval(id);
  };
});

afterAll(() => {
  global.setInterval = originalSetInterval;
  global.clearInterval = originalClearInterval;
});

describe('prologPool', () => {
  let pool;
  let mockProcess;

  // Helper to create a mock child process
  const createMockProcess = () => {
    const emitter = new EventEmitter();
    let stdoutHandler = null;
    let stderrHandler = null;
    
    const proc = {
      pid: Math.floor(Math.random() * 10000) + 1000,
      stdin: {
        write: jest.fn(() => true),
        end: jest.fn(),
        destroy: jest.fn()
      },
      stdout: {
        on: jest.fn((event, handler) => {
          if (event === 'data') stdoutHandler = handler;
          return proc.stdout;
        }),
        once: jest.fn((event, handler) => {
          if (event === 'data') stdoutHandler = handler;
          return proc.stdout;
        }),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn()
      },
      stderr: {
        on: jest.fn((event, handler) => {
          if (event === 'data') stderrHandler = handler;
          return proc.stderr;
        }),
        once: jest.fn((event, handler) => {
          if (event === 'data') stderrHandler = handler;
          return proc.stderr;
        }),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn()
      },
      kill: jest.fn(),
      killed: false,
      exitCode: null,
      signalCode: null,
      on: emitter.on.bind(emitter),
      once: emitter.once.bind(emitter),
      emit: emitter.emit.bind(emitter),
      off: emitter.off.bind(emitter),
      addListener: emitter.addListener.bind(emitter),
      removeListener: emitter.removeListener.bind(emitter),
      removeAllListeners: emitter.removeAllListeners.bind(emitter),
      
      // Test helpers
      emitStdout: (data) => {
        if (stdoutHandler) stdoutHandler(Buffer.isBuffer(data) ? data : Buffer.from(data));
      },
      emitStderr: (data) => {
        if (stderrHandler) stderrHandler(Buffer.isBuffer(data) ? data : Buffer.from(data));
      },
      emitExit: (code = 0, signal = null) => {
        proc.exitCode = code;
        proc.signalCode = signal;
        proc.killed = true;
        emitter.emit('exit', code, signal);
      },
      emitError: (error) => {
        emitter.emit('error', error);
      }
    };
    
    return proc;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcess = createMockProcess();
    spawn.mockReturnValue(mockProcess);
  });

  afterEach(async () => {
    if (pool) {
      await pool.drain();
      pool = null;
    }
    // Clear any remaining intervals
    activeIntervals.forEach(id => originalClearInterval(id));
    activeIntervals = [];
  });

  describe('pool initialization', () => {
    it('should create pool with specified size', async () => {
      pool = new PrologProcessPool({ poolSize: 2 });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(pool.pool).toHaveLength(2);
      expect(pool.available).toHaveLength(2);
    });

    it('should spawn processes on initialization', async () => {
      pool = new PrologProcessPool({ poolSize: 3 });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(spawn).toHaveBeenCalledTimes(3);
    });

    it('should initialize stats', async () => {
      pool = new PrologProcessPool({ poolSize: 1 });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(pool.stats).toBeDefined();
      expect(pool.stats.created).toBeGreaterThan(0);
    });
  });

  describe('acquire process', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return available process and mark as in_use', async () => {
      const processInfo = await pool.acquire(5000);
      
      expect(processInfo).toBeDefined();
      expect(processInfo.status).toBe('in_use');
      expect(pool.inUse.has(processInfo.id)).toBe(true);
    });

    it('should increment acquired counter', async () => {
      const initialAcquired = pool.stats.acquired;
      
      await pool.acquire(5000);
      
      expect(pool.stats.acquired).toBe(initialAcquired + 1);
    });

    it('should remove from available list', async () => {
      const initialAvailable = pool.available.length;
      
      await pool.acquire(5000);
      
      expect(pool.available.length).toBe(initialAvailable - 1);
    });
  });

  describe('acquire when no processes available', () => {
    it('should add request to waiting queue', async () => {
      pool = new PrologProcessPool({ poolSize: 1, maxPoolSize: 1 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Acquire the only process
      await pool.acquire(5000);
      
      // Try to acquire another - should queue
      const acquirePromise = pool.acquire(5000);
      
      expect(pool.waitingQueue.length).toBe(1);
      
      // Clean up
      pool.waitingQueue.forEach(req => req.reject(new Error('test')));
      await acquirePromise.catch(() => {});
    });
  });

  describe('acquire timeout', () => {
    it('should reject with timeout error when queue wait exceeds timeout', async () => {
      pool = new PrologProcessPool({ poolSize: 1, maxPoolSize: 1 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Acquire the only process
      await pool.acquire(5000);
      
      // Try to acquire another with short timeout
      await expect(pool.acquire(100)).rejects.toThrow('timeout');
    });
  });

  describe('release process', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return process to available pool when recycling', async () => {
      const processInfo = await pool.acquire(5000);
      
      pool.release(processInfo, true);
      
      expect(pool.available.length).toBe(2);
      expect(processInfo.status).toBe('ready');
    });

    it('should increment released counter', async () => {
      const processInfo = await pool.acquire(5000);
      const initialReleased = pool.stats.released;
      
      pool.release(processInfo, true);
      
      expect(pool.stats.released).toBe(initialReleased + 1);
    });

    it('should remove from inUse map', async () => {
      const processInfo = await pool.acquire(5000);
      
      pool.release(processInfo, true);
      
      expect(pool.inUse.has(processInfo.id)).toBe(false);
    });
  });

  describe('release process with recycle=false', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should destroy process when recycle is false', async () => {
      const processInfo = await pool.acquire(5000);
      
      pool.release(processInfo, false);
      
      expect(pool.pool.find(p => p.id === processInfo.id)).toBeUndefined();
    });
  });

  describe('destroy process', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should remove process from pool', async () => {
      const processInfo = pool.available[0];
      const processId = processInfo.id;
      
      pool.destroyProcess(processId);
      
      expect(pool.pool.find(p => p.id === processId)).toBeUndefined();
      expect(pool.available.find(p => p.id === processId)).toBeUndefined();
    });

    it('should increment destroyed counter', async () => {
      const initialDestroyed = pool.stats.destroyed;
      const processInfo = pool.available[0];
      
      pool.destroyProcess(processInfo.id);
      
      expect(pool.stats.destroyed).toBe(initialDestroyed + 1);
    });
  });

  describe('drain', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should stop health check interval', async () => {
      await pool.drain();
      
      expect(pool.healthCheckInterval).toBeNull();
    });

    it('should reject all waiting requests', async () => {
      // Use same maxPoolSize as poolSize to prevent creating new processes
      // This forces the second acquire to go to waiting queue
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 2 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Acquire both processes so queue is used
      await pool.acquire(5000);
      await pool.acquire(5000);
      
      // Now try to acquire another - should go to waiting queue
      const waitingPromise = pool.acquire(5000);
      
      await pool.drain();
      
      await expect(waitingPromise).rejects.toThrow('Pool is draining');
    });

    it('should destroy all processes', async () => {
      await pool.drain();
      
      expect(pool.pool).toHaveLength(0);
      expect(pool.available).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      pool = new PrologProcessPool({ poolSize: 2, maxPoolSize: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return pool statistics', () => {
      const stats = pool.getStats();
      
      expect(stats).toHaveProperty('created');
      expect(stats).toHaveProperty('destroyed');
      expect(stats).toHaveProperty('acquired');
      expect(stats).toHaveProperty('released');
      expect(stats).toHaveProperty('processesByStatus');
      expect(stats.processesByStatus).toHaveProperty('available');
      expect(stats.processesByStatus).toHaveProperty('in_use');
      expect(stats.processesByStatus).toHaveProperty('total');
    });

    it('should include waiting queue length', () => {
      const stats = pool.getStats();
      
      expect(stats.waitingQueue).toBeDefined();
    });
  });

  describe('events', () => {
    it('should emit processDestroyed event', async () => {
      pool = new PrologProcessPool({ poolSize: 1, maxPoolSize: 2 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const processInfo = pool.available[0];
      const listener = jest.fn();
      pool.on('processDestroyed', listener);
      
      pool.destroyProcess(processInfo.id);
      
      expect(listener).toHaveBeenCalled();
    });
  });
});
