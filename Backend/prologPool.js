const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const logger = require('./src/config/logger');
const executionConstants = require('./src/constants/execution');

/**
 * SWI-Prolog Process Pool
 * Manages a pool of reusable SWI-Prolog processes to reduce startup overhead
 */
class PrologProcessPool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      poolSize: executionConstants.DEFAULT_POOL_SIZE,
      maxPoolSize: executionConstants.MAX_POOL_SIZE,
      idleTimeout: executionConstants.IDLE_TIMEOUT_MS,
      processTimeout: executionConstants.QUERY_TIMEOUT_MS,
      healthCheckInterval: executionConstants.HEALTH_CHECK_INTERVAL_MS,
      maxMemoryUsage: executionConstants.MAX_MEMORY_USAGE,
      ...options
    };

    this.pool = [];
    this.available = [];
    this.inUse = new Map(); // Map<processId, ProcessInfo>
    this.waitingQueue = [];
    this.processCounter = 0;
    this.stats = {
      created: 0,
      destroyed: 0,
      acquired: 0,
      released: 0,
      timeouts: 0,
      errors: 0,
      healthChecks: 0
    };

    this.healthCheckInterval = null;
    this.initializePool();
    this.startHealthChecks();
  }

  /**
   * Initialize the process pool
   */
  async initializePool() {
    logger.info(`[ProcessPool] Initializing pool with ${this.options.poolSize} processes`);
    
    const initPromises = [];
    for (let i = 0; i < this.options.poolSize; i++) {
      initPromises.push(this.createProcess());
    }

    try {
      await Promise.all(initPromises);
      logger.info(`[ProcessPool] Pool initialized with ${this.pool.length} processes`);
    } catch (error) {
      logger.error(`[ProcessPool] Failed to initialize pool: ${error.message}`);
      this.emit('error', error);
    }
  }

  /**
   * Create a new SWI-Prolog process
   * @returns {Promise<ProcessInfo>} Process information
   */
  async createProcess() {
    const processId = ++this.processCounter;
    
    return new Promise((resolve, reject) => {
      try {
        // Spawn SWI-Prolog with safe options
        // Use -f none to prevent loading init file
        const process = spawn('swipl', [
          '-q',                    // Quiet mode
          '-f', 'none',            // Don't load init file
          '--no-tty',              // No terminal
          '--stack-limit=100M',    // Limit Prolog stacks
          '--table-space=50M'      // Limit table space
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false
        });

        const processInfo = {
          id: processId,
          process,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          status: 'initializing',
          stats: {
            executions: 0,
            totalTime: 0,
            lastExecutionTime: 0
          }
        };

        // Handle process events
        process.on('error', (error) => {
          processInfo.status = 'error';
          processInfo.error = error;
          this.handleProcessError(processId, error);
          reject(error);
        });

        process.on('exit', (code, signal) => {
          processInfo.status = 'exited';
          processInfo.exitCode = code;
          processInfo.exitSignal = signal;
          this.handleProcessExit(processId, code, signal);
        });

        // Wait for process to be ready
        const readyTimeout = setTimeout(() => {
          processInfo.status = 'timeout';
          reject(new Error(`Process ${processId} initialization timeout`));
        }, executionConstants.PROCESS_INIT_TIMEOUT_MS);

        // SWI-Prolog with -q flag starts ready, no need for handshake
        // Just wait a bit to ensure process is stable
        setTimeout(() => {
          clearTimeout(readyTimeout);
          processInfo.status = 'ready';
          this.addToPool(processInfo);
          resolve(processInfo);
        }, executionConstants.PROCESS_READY_DELAY_MS);

        this.stats.created++;
        this.emit('processCreated', processInfo);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add process to available pool
   * @param {ProcessInfo} processInfo - Process information
   */
  addToPool(processInfo) {
    this.pool.push(processInfo);
    this.available.push(processInfo);
    logger.debug(`[ProcessPool] Process ${processInfo.id} added to pool`);
    this.emit('processAdded', processInfo);
    
    // Check if there are waiting requests
    this.checkWaitingQueue();
  }

  /**
   * Acquire a process from the pool
   * @param {number} timeout - Acquisition timeout in ms
   * @returns {Promise<ProcessInfo>} Acquired process
   */
  async acquire(timeout = executionConstants.PROCESS_ACQUIRE_TIMEOUT_MS) {
    this.stats.acquired++;

    // Try to get from available pool first
    if (this.available.length > 0) {
      const processInfo = this.available.pop();
      this.markAsInUse(processInfo);
      return processInfo;
    }

    // Create new process if pool not at max size
    if (this.pool.length < this.options.maxPoolSize) {
      try {
        const processInfo = await this.createProcess();
        this.markAsInUse(processInfo);
        return processInfo;
      } catch (error) {
        logger.warn(`[ProcessPool] Failed to create new process: ${error.message}`);
        // Continue to waiting queue
      }
    }

    // Add to waiting queue
    return new Promise((resolve, reject) => {
      const request = {
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.waitingQueue.push(request);

      // Set timeout for acquisition
      const timeoutId = setTimeout(() => {
        const index = this.waitingQueue.indexOf(request);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          this.stats.timeouts++;
          reject(new Error(`Process acquisition timeout after ${timeout}ms`));
        }
      }, timeout);

      request.timeoutId = timeoutId;
    });
  }

  /**
   * Acquire with timeout wrapper
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<ProcessInfo>} Acquired process
   */
  async acquireWithTimeout(timeout) {
    return this.acquire(timeout);
  }

  /**
   * Mark process as in use
   * @param {ProcessInfo} processInfo - Process information
   */
  markAsInUse(processInfo) {
    processInfo.status = 'in_use';
    processInfo.lastUsed = Date.now();
    this.inUse.set(processInfo.id, processInfo);
    
    // Remove from available if it's there
    const availableIndex = this.available.indexOf(processInfo);
    if (availableIndex !== -1) {
      this.available.splice(availableIndex, 1);
    }
  }

  /**
   * Release a process back to the pool
   * @param {ProcessInfo} processInfo - Process to release
   * @param {boolean} [recycle=true] - Whether to recycle or destroy
   */
  release(processInfo, recycle = true) {
    this.stats.released++;

    // Remove from in-use map
    this.inUse.delete(processInfo.id);

    if (recycle && processInfo.status !== 'error' && processInfo.status !== 'exited') {
      // Reset process state
      this.resetProcess(processInfo);
      
      // Add back to available pool
      processInfo.status = 'ready';
      this.available.push(processInfo);
      
      this.emit('processReleased', processInfo);
      logger.debug(`[ProcessPool] Process ${processInfo.id} released back to pool`);
    } else {
      // Destroy process
      this.destroyProcess(processInfo.id);
    }

    // Check waiting queue
    this.checkWaitingQueue();
  }

  /**
   * Reset process state between uses
   * @param {ProcessInfo} processInfo - Process to reset
   */
  resetProcess(processInfo) {
    try {
      // Clear any pending output
      processInfo.process.stdout.removeAllListeners('data');
      processInfo.process.stderr.removeAllListeners('data');
      
      // Send reset commands
      processInfo.process.stdin.write('abolish_all_tables.\n');
      processInfo.process.stdin.write('retractall(_).\n');
      
    } catch (error) {
      logger.warn(`[ProcessPool] Failed to reset process ${processInfo.id}: ${error.message}`);
    }
  }

  /**
   * Execute a query using a process
   * @param {ProcessInfo} processInfo - Process to use
   * @param {string} filepath - Path to Prolog file
   * @param {string} query - Prolog query
   * @param {number} timeout - Execution timeout in ms
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeQuery(
    processInfo,
    filepath,
    query,
    timeout = this.options.processTimeout,
    options = {}
  ) {
    const startTime = Date.now();
    const { captureSnapshot = false, input = '' } = options;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.handleExecutionTimeout(processInfo.id, timeout);
        reject(new Error(`Query execution timeout after ${timeout}ms`));
      }, timeout);

      let stdoutData = '';
      let stderrData = '';

       // Setup output handlers
       processInfo.process.stdout.on('data', (data) => {
         const text = data.toString();
         stdoutData += text;
         logger.debug(`[ProcessPool] Process ${processInfo.id} stdout: ${text.trim()}`);
       });

       processInfo.process.stderr.on('data', (data) => {
         const text = data.toString();
         stderrData += text;
         logger.debug(`[ProcessPool] Process ${processInfo.id} stderr: ${text.trim()}`);
       });

      // Handle process completion
      const completionHandler = (code) => {
        clearTimeout(timeoutId);
        
        const executionTime = Date.now() - startTime;
        
        // Update process stats
        processInfo.stats.executions++;
        processInfo.stats.totalTime += executionTime;
        processInfo.stats.lastExecutionTime = executionTime;

        const result = {
          stdout: stdoutData,
          stderr: stderrData,
          exitCode: code,
          executionTime,
          processId: processInfo.id
        };

        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Prolog execution failed with code ${code}: ${stderrData}`));
        }
      };

      processInfo.process.once('exit', completionHandler);

        // Send commands to Prolog
       try {
         // Run only one derivation path to avoid toplevel backtracking artifacts
         // that pollute the visualization tree with unrelated fail/redo branches.
         const normalizedQuery = query.trim().replace(/\.+\s*$/, '');
         const queryGoal = `once((${normalizedQuery}))`;
           const interactiveInput = typeof input === 'string' ? input : '';

           const filesDirRaw = process.env.PROLOG_FILES_DIR || path.join(__dirname, 'prolog_files');
           const filesDir = filesDirRaw.replace(/\\/g, '/').replace(/'/g, "\\'");
         
         const commands = [
           "leash(-all).",
           "visible(+all).",
             `(exists_directory('${filesDir}') -> working_directory(_, '${filesDir}') ; true).`,
           `consult('${filepath.replace(/\\/g, '/')}').`,
         ];

         commands.push('trace.');

           // Always isolate query input from command stream so read/1/get0/1
           // can never consume control commands such as notrace./halt.
           const escapedInput = JSON.stringify(interactiveInput);
           commands.push(
             `\\+ \\+ setup_call_cleanup((open_string(${escapedInput}, _PTInput), set_stream(_PTInput, alias(pt_input)), current_input(_PTOldInput), set_input(pt_input)), ${queryGoal}, (set_input(_PTOldInput), close(pt_input))).`
           );

         commands.push('notrace.');

         if (captureSnapshot) {
           commands.push("writeln('__PT_SNAPSHOT_BEGIN__').");
           commands.push('listing.');
           commands.push("writeln('__PT_SNAPSHOT_END__').");
         }

         commands.push('halt.');

          const commandString = commands.join('\n');
          logger.debug(`[ProcessPool] Sending commands to process ${processInfo.id}:`);
          logger.debug(commandString);
         
         processInfo.process.stdin.write(commandString);
         processInfo.process.stdin.end();
       } catch (error) {
         clearTimeout(timeoutId);
         reject(error);
       }
    });
  }

  /**
   * Handle execution timeout
   * @param {number} processId - Process ID
   * @param {number} timeout - Timeout duration
   */
  handleExecutionTimeout(processId, timeout) {
    const processInfo = this.inUse.get(processId) || this.pool.find(p => p.id === processId);
    if (processInfo) {
      logger.warn(`[ProcessPool] Process ${processId} execution timeout after ${timeout}ms`);
      
      try {
        // Kill the process
        processInfo.process.kill('SIGKILL');
        this.destroyProcess(processId);
      } catch (error) {
        logger.error(`[ProcessPool] Failed to kill timed out process ${processId}: ${error.message}`);
      }
    }
  }

  /**
   * Handle process error
   * @param {number} processId - Process ID
   * @param {Error} error - Error object
   */
  handleProcessError(processId, error) {
    logger.error(`[ProcessPool] Process ${processId} error: ${error.message}`);
    this.stats.errors++;
    this.destroyProcess(processId);
    this.emit('processError', { processId, error });
  }

  /**
   * Handle process exit
   * @param {number} processId - Process ID
   * @param {number} code - Exit code
   * @param {string} signal - Exit signal
   */
  handleProcessExit(processId, code, signal) {
    logger.info(`[ProcessPool] Process ${processId} exited with code ${code} signal ${signal}`);
    this.destroyProcess(processId);
  }

  /**
   * Destroy a process
   * @param {number} processId - Process ID to destroy
   */
  destroyProcess(processId) {
    const processInfo = this.pool.find(p => p.id === processId);
    if (!processInfo) return;

    try {
      // Kill process if still running
      if (processInfo.process && !processInfo.process.killed) {
        processInfo.process.kill('SIGTERM');
      }
    } catch (error) {
      // Ignore kill errors
    }

    // Remove from all collections
    this.pool = this.pool.filter(p => p.id !== processId);
    this.available = this.available.filter(p => p.id !== processId);
    this.inUse.delete(processId);

    this.stats.destroyed++;
    this.emit('processDestroyed', processInfo);
    
    // Check waiting queue in case we need to create new processes
    this.checkWaitingQueue();
  }

  /**
   * Check waiting queue and fulfill requests if possible
   */
  checkWaitingQueue() {
    while (this.waitingQueue.length > 0 && this.available.length > 0) {
      const request = this.waitingQueue.shift();
      clearTimeout(request.timeoutId);
      
      const processInfo = this.available.pop();
      this.markAsInUse(processInfo);
      request.resolve(processInfo);
    }
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  /**
   * Perform health checks on all processes
   */
  async performHealthChecks() {
    this.stats.healthChecks++;
    
    const now = Date.now();
    const checks = [];

    // Check idle processes
    for (const processInfo of this.available) {
      const idleTime = now - processInfo.lastUsed;
      if (idleTime > this.options.idleTimeout) {
        logger.debug(`[ProcessPool] Process ${processInfo.id} idle for ${idleTime}ms, destroying`);
        checks.push(this.destroyProcess(processInfo.id));
      }
    }

    // Perform active health check on a sample of processes
    const sampleSize = Math.min(executionConstants.HEALTH_CHECK_SAMPLE_SIZE, this.available.length);
    const sample = this.available.slice(0, sampleSize);
    
    for (const processInfo of sample) {
      checks.push(this.healthCheckProcess(processInfo));
    }

    await Promise.allSettled(checks);
    this.emit('healthCheckCompleted', this.stats);
  }

  /**
   * Health check individual process
   * @param {ProcessInfo} processInfo - Process to check
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheckProcess(processInfo) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn(`[ProcessPool] Health check timeout for process ${processInfo.id}`);
        this.destroyProcess(processInfo.id);
        resolve(false);
      }, executionConstants.HEALTH_CHECK_TIMEOUT_MS);

      try {
        processInfo.process.stdin.write('true.\n');
        processInfo.process.stdin.write('halt.\n');

        processInfo.process.stdout.once('data', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        processInfo.process.stderr.once('data', (data) => {
          clearTimeout(timeout);
          logger.warn(`[ProcessPool] Health check error for process ${processInfo.id}: ${data.toString()}`);
          this.destroyProcess(processInfo.id);
          resolve(false);
        });

      } catch (error) {
        clearTimeout(timeout);
        logger.warn(`[ProcessPool] Health check failed for process ${processInfo.id}: ${error.message}`);
        this.destroyProcess(processInfo.id);
        resolve(false);
      }
    });
  }

  /**
   * Get pool statistics
   * @returns {PoolStats} Pool statistics
   */
  getStats() {
    const now = Date.now();
    const processesByStatus = {
      available: this.available.length,
      in_use: this.inUse.size,
      total: this.pool.length
    };

    const avgExecutionTime = this.pool.reduce((sum, p) => sum + p.stats.totalTime, 0) / 
                           (this.pool.reduce((sum, p) => sum + p.stats.executions, 0) || 1);

    return {
      ...this.stats,
      processesByStatus,
      waitingQueue: this.waitingQueue.length,
      avgExecutionTime: Math.round(avgExecutionTime),
      timestamp: now
    };
  }

  /**
   * Drain the pool (for shutdown)
   * @returns {Promise<void>}
   */
  async drain() {
    logger.info('[ProcessPool] Draining pool...');
    
    // Clear health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Reject all waiting requests
    for (const request of this.waitingQueue) {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Pool is draining'));
    }
    this.waitingQueue = [];

    // Destroy all processes
    const destroyPromises = this.pool.map(processInfo => 
      this.destroyProcess(processInfo.id)
    );

    await Promise.allSettled(destroyPromises);
    logger.info('[ProcessPool] Pool drained');
    this.emit('poolDrained');
  }
}

/**
 * @typedef {Object} ProcessInfo
 * @property {number} id - Process ID
 * @property {ChildProcess} process - Child process object
 * @property {number} createdAt - Creation timestamp
 * @property {number} lastUsed - Last used timestamp
 * @property {string} status - Process status
 * @property {Object} stats - Process statistics
 * @property {number} stats.executions - Number of executions
 * @property {number} stats.totalTime - Total execution time
 * @property {number} stats.lastExecutionTime - Last execution time
 * @property {Error} [error] - Error if any
 * @property {number} [exitCode] - Exit code if exited
 * @property {string} [exitSignal] - Exit signal if any
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {string} stdout - Standard output
 * @property {string} stderr - Standard error
 * @property {number} exitCode - Exit code
 * @property {number} executionTime - Execution time in ms
 * @property {number} processId - Process ID used
 */

/**
 * @typedef {Object} PoolStats
 * @property {number} created - Total processes created
 * @property {number} destroyed - Total processes destroyed
 * @property {number} acquired - Total acquisitions
 * @property {number} released - Total releases
 * @property {number} timeouts - Acquisition timeouts
 * @property {number} errors - Process errors
 * @property {number} healthChecks - Health checks performed
 * @property {Object} processesByStatus - Process counts by status
 * @property {number} waitingQueue - Waiting queue length
 * @property {number} avgExecutionTime - Average execution time
 * @property {number} timestamp - Stats timestamp
 */

module.exports = PrologProcessPool;