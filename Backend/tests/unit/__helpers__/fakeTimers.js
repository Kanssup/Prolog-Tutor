/**
 * Fake Timers Utilities for Jest Tests
 * Helper functions for managing Jest fake timers
 */

let fakeTimersEnabled = false;

/**
 * Enable fake timers for testing time-dependent code
 * @param {Object} options - Timer options
 */
function enableFakeTimers(options = {}) {
  const defaultOptions = {
    legacy: false,
    doNotFake: [
      'nextTick',
      'setImmediate'
    ]
  };
  
  jest.useFakeTimers({ ...defaultOptions, ...options });
  fakeTimersEnabled = true;
}

/**
 * Disable fake timers and use real timers
 */
function disableFakeTimers() {
  jest.useRealTimers();
  fakeTimersEnabled = false;
}

/**
 * Advance all timers by a specified time
 * @param {number} time - Time in milliseconds
 */
function advanceTimersByTime(time) {
  if (!fakeTimersEnabled) {
    throw new Error('Fake timers not enabled. Call enableFakeTimers() first.');
  }
  jest.advanceTimersByTime(time);
}

/**
 * Run all pending timers
 */
function runAllTimers() {
  if (!fakeTimersEnabled) {
    throw new Error('Fake timers not enabled. Call enableFakeTimers() first.');
  }
  jest.runAllTimers();
}

/**
 * Run only pending timers (not infinite loops)
 */
function runOnlyPendingTimers() {
  if (!fakeTimersEnabled) {
    throw new Error('Fake timers not enabled. Call enableFakeTimers() first.');
  }
  jest.runOnlyPendingTimers();
}

/**
 * Advance timers by a specific amount and flush all async operations
 * @param {number} time - Time in milliseconds
 */
async function advanceTimersAndFlush(time) {
  jest.advanceTimersByTime(time);
  // Flush microtasks
  await jest.runAllTicks();
  // Flush timers
  await jest.runAllTimers();
}

/**
 * Set the current system time
 * @param {Date|number} time - Time to set
 */
function setSystemTime(time) {
  if (!fakeTimersEnabled) {
    throw new Error('Fake timers not enabled. Call enableFakeTimers() first.');
  }
  const timestamp = typeof time === 'number' ? time : time.getTime();
  jest.setSystemTime(timestamp);
}

/**
 * Get the current fake time
 * @returns {number} Current timestamp
 */
function getFakeTime() {
  return Date.now();
}

module.exports = {
  enableFakeTimers,
  disableFakeTimers,
  advanceTimersByTime,
  runAllTimers,
  runOnlyPendingTimers,
  advanceTimersAndFlush,
  setSystemTime,
  getFakeTime,
  isEnabled: () => fakeTimersEnabled
};
