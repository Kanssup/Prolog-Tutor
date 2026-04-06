const crypto = require('crypto');
const { LRUCache } = require('lru-cache');
const logger = require('./src/config/logger');
const executionConstants = require('./src/constants/execution');

/**
 * Query Cache for Prolog Tutor
 * Caches parsed execution trees to avoid re-executing identical queries
 */
class QueryCache {
  constructor(options = {}) {
    this.options = {
      maxSize: executionConstants.DEFAULT_CACHE_MAX_SIZE,
      ttl: executionConstants.CACHE_TTL_MS,
      maxEntrySize: executionConstants.MAX_ENTRY_SIZE,
      checkPeriod: executionConstants.CACHE_CHECK_PERIOD_MS,
      compressionThreshold: executionConstants.COMPRESSION_THRESHOLD,
      ...options
    };

    // Initialize LRU cache
    this.cache = new LRUCache({
      max: this.options.maxSize,
      ttl: this.options.ttl,
      updateAgeOnGet: true,
      allowStale: false,
      noDisposeOnSet: true,
      dispose: (key, value) => {
        this.handleDisposal(key, value);
      }
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      compressions: 0,
      size: 0,
      lastCleanup: Date.now()
    };

    this.compressionEnabled = typeof require('zlib') !== 'undefined';
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from code and query
   * @param {string} code - Prolog code
   * @param {string} query - Prolog query
   * @returns {string} Cache key
   */
  generateKey(code, query) {
    // Normalize input: trim whitespace, sort lines for consistent hashing
    const normalizedCode = code
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .sort()
      .join('\n');
    
    const normalizedQuery = query.trim();
    
    const content = `${normalizedCode}\n---\n${normalizedQuery}`;
    
    // Use SHA-256 for consistent hashing
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Estimate size of a cache entry
   * @param {any} value - Cache value
   * @returns {number} Estimated size in bytes
   */
  estimateSize(value) {
    try {
      const jsonString = JSON.stringify(value);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch (error) {
      // Fallback estimation
      return executionConstants.DEFAULT_SIZE_ESTIMATE;
    }
  }

  /**
   * Compress data if needed
   * @param {any} data - Data to compress
   * @returns {Promise<Buffer|any>} Compressed or original data
   */
  async compressIfNeeded(data) {
    if (!this.compressionEnabled || this.estimateSize(data) < this.options.compressionThreshold) {
      return data;
    }

    try {
      const zlib = require('zlib');
      const jsonString = JSON.stringify(data);
      
      return new Promise((resolve, reject) => {
        zlib.gzip(jsonString, (error, compressed) => {
          if (error) {
            reject(error);
          } else {
            this.stats.compressions++;
            resolve({
              compressed: true,
              data: compressed,
              originalSize: Buffer.byteLength(jsonString, 'utf8'),
              compressedSize: compressed.length
            });
          }
        });
      });
    } catch (error) {
      logger.warn(`[QueryCache] Compression failed: ${error.message}`);
      return data;
    }
  }

  /**
   * Decompress data if needed
   * @param {any} data - Data to decompress
   * @returns {Promise<any>} Decompressed data
   */
  async decompressIfNeeded(data) {
    if (!data || typeof data !== 'object' || !data.compressed) {
      return data;
    }

    try {
      const zlib = require('zlib');
      
      return new Promise((resolve, reject) => {
        zlib.gunzip(data.data, (error, decompressed) => {
          if (error) {
            reject(error);
          } else {
            resolve(JSON.parse(decompressed.toString()));
          }
        });
      });
    } catch (error) {
      logger.warn(`[QueryCache] Decompression failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cached result
   * @param {string} code - Prolog code
   * @param {string} query - Prolog query
   * @returns {Promise<any|null>} Cached result or null
   */
  async get(code, query) {
    const key = this.generateKey(code, query);
    const cached = this.cache.get(key);

    if (cached === undefined) {
      this.stats.misses++;
      this.emitStats('miss');
      return null;
    }

    try {
      const value = await this.decompressIfNeeded(cached.value);
      this.stats.hits++;
      this.emitStats('hit');
      
      // Update access metadata
      cached.lastAccessed = Date.now();
      cached.accessCount = (cached.accessCount || 0) + 1;
      
      return value;
    } catch (error) {
      logger.warn(`[QueryCache] Failed to retrieve cached value for key ${key}: ${error.message}`);
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cache entry
   * @param {string} code - Prolog code
   * @param {string} query - Prolog query
   * @param {any} value - Value to cache
   * @param {Object} [options] - Cache options
   * @returns {Promise<boolean>} True if cached successfully
   */
  async set(code, query, value, options = {}) {
    const key = this.generateKey(code, query);
    const entrySize = this.estimateSize(value);
    
    // Check if entry is too large
    if (entrySize > this.options.maxEntrySize) {
      logger.warn(`[QueryCache] Entry too large (${entrySize} bytes), skipping cache`);
      return false;
    }

    // Check cache capacity
    if (this.stats.size + entrySize > this.options.maxSize * this.options.maxEntrySize) {
      logger.warn('[QueryCache] Cache capacity exceeded, performing emergency eviction');
      this.performEmergencyEviction();
    }

    try {
      const compressedValue = await this.compressIfNeeded(value);
      
      const cacheEntry = {
        value: compressedValue,
        metadata: {
          key,
          codeHash: crypto.createHash('md5').update(code).digest('hex'),
          queryHash: crypto.createHash('md5').update(query).digest('hex'),
          size: entrySize,
          compressed: typeof compressedValue === 'object' && compressedValue.compressed,
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          ttl: options.ttl || this.options.ttl
        }
      };

    this.cache.set(key, cacheEntry, {
      ttl: cacheEntry.metadata.ttl
    });

      this.stats.sets++;
      this.stats.size += entrySize;
      this.emitStats('set');
      
      return true;
    } catch (error) {
      logger.warn(`[QueryCache] Failed to cache value: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete cache entry
   * @param {string} code - Prolog code
   * @param {string} query - Prolog query
   * @returns {boolean} True if deleted
   */
  delete(code, query) {
    const key = this.generateKey(code, query);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.emitStats('delete');
    }
    
    return deleted;
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {number} Number of entries invalidated
   */
  invalidate(pattern) {
    let invalidated = 0;
    
    if (pattern === '*') {
      // Clear entire cache
      invalidated = this.cache.size;
      this.clear();
      return invalidated;
    }

    // Simple pattern matching (supports * at end)
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      this.emitStats('invalidate', { pattern, count: invalidated });
    }

    return invalidated;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const sizeBefore = this.cache.size;
    this.cache.clear();
    this.stats.size = 0;
    this.emitStats('clear', { cleared: sizeBefore });
  }

  /**
   * Handle cache disposal (when entry is evicted)
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   */
  handleDisposal(key, value) {
    this.stats.evictions++;
    this.stats.size -= value.metadata?.size || 0;
    this.emitStats('eviction', { key, size: value.metadata?.size });
  }

  /**
   * Perform emergency eviction when cache is full
   */
  performEmergencyEviction() {
    const targetReduction = this.options.maxSize * this.options.maxEntrySize * executionConstants.CACHE_EMERGENCY_EVICTION_RATIO;
    let freedSize = 0;
    
    // Get entries sorted by last accessed (oldest first)
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        value,
        lastAccessed: value.metadata?.lastAccessed || 0,
        size: value.metadata?.size || 0
      }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    for (const entry of entries) {
      if (freedSize >= targetReduction) break;
      
      this.cache.delete(entry.key);
      freedSize += entry.size;
      this.stats.evictions++;
    }

    this.stats.size -= freedSize;
    logger.info(`[QueryCache] Emergency eviction freed ${freedSize} bytes`);
    this.emitStats('emergency_eviction', { freedSize });
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.options.checkPeriod);
  }

  /**
   * Perform periodic cleanup
   */
  performCleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // The LRU cache handles TTL automatically, but we can add additional cleanup logic
    this.stats.lastCleanup = now;
    
    // Emit cleanup event
    this.emitStats('cleanup', {
      timestamp: now,
      size: this.stats.size,
      entries: this.cache.size
    });
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Emit cache statistics
   * @param {string} event - Event type
   * @param {Object} [data] - Additional data
   */
  emitStats(event, data = {}) {
    const statsEvent = {
      event,
      timestamp: Date.now(),
      stats: { ...this.stats },
      ...data
    };

    // In production, this would emit to a metrics system
    if (process.env.NODE_ENV !== 'test') {
      const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
      
      if (event === 'hit' || event === 'miss') {
        logger.debug(`[QueryCache] ${event.toUpperCase()}: hitRate=${(hitRate * 100).toFixed(1)}%, size=${this.formatBytes(this.stats.size)}`);
      }
    }
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get cache statistics
   * @returns {CacheStats} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    const compressionRatio = this.stats.compressions > 0 ? 
      (this.stats.size / (this.stats.size * 1.5)) : 1; // Simplified ratio
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 10000) / 100, // Percentage with 2 decimals
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      entries: this.cache.size,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl,
      formattedSize: this.formatBytes(this.stats.size)
    };
  }

  /**
   * Get cache entries (for debugging/admin)
   * @param {number} [limit=50] - Maximum entries to return
   * @returns {Array<CacheEntryInfo>} Cache entries info
   */
  getEntries(limit = 50) {
    const entries = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (entries.length >= limit) break;
      
      entries.push({
        key,
        metadata: value.metadata,
        size: value.metadata?.size || 0,
        age: Date.now() - (value.metadata?.createdAt || Date.now()),
        accessCount: value.metadata?.accessCount || 0
      });
    }
    
    return entries;
  }

  /**
   * Shutdown cache
   */
  async shutdown() {
    this.stopCleanupInterval();
    this.clear();
    logger.info('[QueryCache] Cache shutdown complete');
  }
}

/**
 * @typedef {Object} CacheStats
 * @property {number} hits - Cache hits
 * @property {number} misses - Cache misses
 * @property {number} sets - Cache sets
 * @property {number} evictions - Cache evictions
 * @property {number} compressions - Number of compressions
 * @property {number} size - Current cache size in bytes
 * @property {number} lastCleanup - Last cleanup timestamp
 * @property {number} hitRate - Cache hit rate percentage
 * @property {number} compressionRatio - Compression ratio
 * @property {number} entries - Number of cache entries
 * @property {number} maxSize - Maximum cache size
 * @property {number} ttl - Time to live in ms
 * @property {string} formattedSize - Formatted size string
 */

/**
 * @typedef {Object} CacheEntryInfo
 * @property {string} key - Cache key
 * @property {Object} metadata - Entry metadata
 * @property {number} size - Entry size in bytes
 * @property {number} age - Entry age in ms
 * @property {number} accessCount - Number of accesses
 */

module.exports = QueryCache;