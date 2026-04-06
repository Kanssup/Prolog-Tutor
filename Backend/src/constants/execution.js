/**
 * Execution Constants for Prolog-Tutor
 * Centralized hardcoded values related to query execution
 */

module.exports = {
  // Query execution
  QUERY_TIMEOUT_MS: 30000,
  
  // Process pool
  DEFAULT_POOL_SIZE: 5,
  MAX_POOL_SIZE: 20,
  IDLE_TIMEOUT_MS: 30000,
  HEALTH_CHECK_INTERVAL_MS: 60000,
  HEALTH_CHECK_TIMEOUT_MS: 3000,
  PROCESS_INIT_TIMEOUT_MS: 5000,
  PROCESS_ACQUIRE_TIMEOUT_MS: 5000,
  MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  PROCESS_READY_DELAY_MS: 100, // Delay to ensure process is stable
  HEALTH_CHECK_SAMPLE_SIZE: 3, // Number of processes to health check
  
  // File management
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_FILE_AGE_MS: 10 * 60 * 1000, // 10 minutes
  
  // Cache
  DEFAULT_CACHE_MAX_SIZE: 100,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_ENTRY_SIZE: 10 * 1024 * 1024, // 10MB
  COMPRESSION_THRESHOLD: 1024 * 1024, // 1MB
  CACHE_CHECK_PERIOD_MS: 60 * 1000, // 1 minute cleanup check
  CACHE_EMERGENCY_EVICTION_RATIO: 0.3, // Reduce by 30%
  DEFAULT_SIZE_ESTIMATE: 1024, // 1KB default size estimate
  
  // Runtime files
  MAX_RUNTIME_FILES: 20,
  MAX_RUNTIME_FILE_SIZE: 200 * 1024, // 200KB
  MAX_FILES_TO_COLLECT: 10,
  MAX_FILE_SNAPSHOT_SIZE: 200 * 1024, // 200KB
  
  // Input validation
  MAX_CODE_LENGTH: 10000,
  MAX_QUERY_LENGTH: 1000,
  MAX_INPUT_LENGTH: 20000,
  MAX_LINE_LENGTH: 10000,
  MAX_PROLOG_LINE_LENGTH: 10000,
  
  // Snapshot markers
  SNAPSHOT_BEGIN: '__PT_SNAPSHOT_BEGIN__',
  SNAPSHOT_END: '__PT_SNAPSHOT_END__',
};
