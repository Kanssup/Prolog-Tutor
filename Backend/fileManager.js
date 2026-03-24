const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Temporary File Manager for Prolog Tutor
 * Manages creation, tracking, and cleanup of temporary Prolog files
 */
class TempFileManager {
  constructor(options = {}) {
    this.options = {
      tempDir: path.join(__dirname, 'temp'),
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      maxFileAge: 10 * 60 * 1000, // 10 minutes
      maxFileSize: 1024 * 1024, // 1MB
      ...options
    };

    this.files = new Map(); // Map<fileId, FileInfo>
    this.cleanupInterval = null;
    
    this.ensureTempDir();
    this.startCleanupInterval();
  }

  /**
   * Ensure temporary directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.options.tempDir)) {
      fs.mkdirSync(this.options.tempDir, { recursive: true });
    }
  }

  /**
   * Create a temporary file with Prolog code
   * @param {string} content - Prolog code content
   * @param {string} extension - File extension (default: .pl)
   * @returns {Promise<FileInfo>} File information
   */
  async createTempFile(content, extension = '.pl') {
    // Validate content size
    if (Buffer.byteLength(content, 'utf8') > this.options.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.options.maxFileSize} bytes`);
    }

    // Validate Prolog content (basic validation)
    this.validatePrologContent(content);

    const fileId = uuidv4();
    const filename = `${fileId}${extension}`;
    const filepath = path.join(this.options.tempDir, filename);

    const fileInfo = {
      id: fileId,
      filename,
      filepath,
      extension,
      createdAt: Date.now(),
      size: Buffer.byteLength(content, 'utf8'),
      accessedAt: Date.now(),
      status: 'created'
    };

    try {
      // Write file asynchronously
      await fs.promises.writeFile(filepath, content, 'utf8');
      fileInfo.status = 'ready';
      
      // Track file
      this.files.set(fileId, fileInfo);
      
      // Log creation
      this.logFileEvent('created', fileInfo);
      
      return fileInfo;
    } catch (error) {
      fileInfo.status = 'error';
      fileInfo.error = error.message;
      this.logFileEvent('error', fileInfo, error);
      throw new Error(`Failed to create temporary file: ${error.message}`);
    }
  }

  /**
   * Get file information by ID
   * @param {string} fileId - File ID
   * @returns {FileInfo|null} File information or null if not found
   */
  getFileInfo(fileId) {
    const fileInfo = this.files.get(fileId);
    if (fileInfo) {
      fileInfo.accessedAt = Date.now();
    }
    return fileInfo;
  }

  /**
   * Get file path by ID
   * @param {string} fileId - File ID
   * @returns {string|null} File path or null if not found
   */
  getFilePath(fileId) {
    const fileInfo = this.getFileInfo(fileId);
    return fileInfo ? fileInfo.filepath : null;
  }

  /**
   * Delete a temporary file
   * @param {string} fileId - File ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteTempFile(fileId) {
    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      return false;
    }

    try {
      if (fs.existsSync(fileInfo.filepath)) {
        await fs.promises.unlink(fileInfo.filepath);
      }
      
      this.files.delete(fileId);
      fileInfo.status = 'deleted';
      fileInfo.deletedAt = Date.now();
      
      this.logFileEvent('deleted', fileInfo);
      return true;
    } catch (error) {
      fileInfo.status = 'delete_error';
      fileInfo.error = error.message;
      this.logFileEvent('delete_error', fileInfo, error);
      return false;
    }
  }

  /**
   * Mark file for deletion (deferred cleanup)
   * @param {string} fileId - File ID to mark
   */
  markForDeletion(fileId) {
    const fileInfo = this.files.get(fileId);
    if (fileInfo) {
      fileInfo.status = 'marked_for_deletion';
      fileInfo.markedAt = Date.now();
    }
  }

  /**
   * Cleanup old files
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<CleanupStats>} Cleanup statistics
   */
  async cleanupOldFiles(maxAge = this.options.maxFileAge) {
    const now = Date.now();
    const stats = {
      total: this.files.size,
      deleted: 0,
      errors: 0,
      skipped: 0
    };

    const deletionPromises = [];

    for (const [fileId, fileInfo] of this.files.entries()) {
      const age = now - fileInfo.createdAt;
      
      // Skip if file is not old enough
      if (age < maxAge && fileInfo.status !== 'marked_for_deletion') {
        stats.skipped++;
        continue;
      }

      // Skip if file is currently being used
      if (fileInfo.status === 'in_use') {
        stats.skipped++;
        continue;
      }

      deletionPromises.push(
        this.deleteTempFile(fileId)
          .then(deleted => {
            if (deleted) {
              stats.deleted++;
            } else {
              stats.errors++;
            }
          })
          .catch(() => {
            stats.errors++;
          })
      );
    }

    await Promise.all(deletionPromises);
    
    this.logCleanup(stats);
    return stats;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldFiles().catch(error => {
        console.error('Cleanup interval error:', error);
      });
    }, this.options.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get manager statistics
   * @returns {ManagerStats} Manager statistics
   */
  getStats() {
    const now = Date.now();
    const filesByStatus = {};
    let totalSize = 0;

    for (const fileInfo of this.files.values()) {
      filesByStatus[fileInfo.status] = (filesByStatus[fileInfo.status] || 0) + 1;
      totalSize += fileInfo.size || 0;
    }

    return {
      totalFiles: this.files.size,
      filesByStatus,
      totalSize,
      tempDir: this.options.tempDir,
      cleanupInterval: this.options.cleanupInterval,
      maxFileAge: this.options.maxFileAge
    };
  }

  /**
   * Validate Prolog content (basic validation)
   * @param {string} content - Prolog code to validate
   */
  validatePrologContent(content) {
    // Check for null bytes or other dangerous characters
    if (content.includes('\0')) {
      throw new Error('Prolog code contains null bytes');
    }

    // Check for extremely long lines (potential DoS)
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.length > 10000) {
        throw new Error('Line too long (max 10000 characters)');
      }
    }

    // Basic Prolog syntax check (ensure it ends with period)
    const trimmed = content.trim();
    if (trimmed.length > 0 && !trimmed.endsWith('.')) {
      console.warn('Prolog code might not end with period');
    }
  }

  /**
   * Log file event
   * @param {string} event - Event type
   * @param {FileInfo} fileInfo - File information
   * @param {Error} [error] - Optional error
   */
  logFileEvent(event, fileInfo, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      fileId: fileInfo.id,
      filename: fileInfo.filename,
      size: fileInfo.size,
      status: fileInfo.status
    };

    if (error) {
      logEntry.error = error.message;
      logEntry.stack = error.stack;
    }

    // In production, this would use a proper logger
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[FileManager] ${event}: ${fileInfo.filename} (${fileInfo.size} bytes)`);
      if (error) {
        console.error(`[FileManager] Error: ${error.message}`);
      }
    }
  }

  /**
   * Log cleanup statistics
   * @param {CleanupStats} stats - Cleanup statistics
   */
  logCleanup(stats) {
    if (stats.deleted > 0 || stats.errors > 0) {
      console.log(`[FileManager] Cleanup: deleted=${stats.deleted}, errors=${stats.errors}, skipped=${stats.skipped}, total=${stats.total}`);
    }
  }

  /**
   * Shutdown manager and cleanup all files
   * @returns {Promise<CleanupStats>} Final cleanup statistics
   */
  async shutdown() {
    this.stopCleanupInterval();
    
    // Delete all files
    const stats = {
      total: this.files.size,
      deleted: 0,
      errors: 0,
      skipped: 0
    };

    const deletionPromises = [];
    
    for (const [fileId] of this.files.entries()) {
      deletionPromises.push(
        this.deleteTempFile(fileId)
          .then(deleted => {
            if (deleted) {
              stats.deleted++;
            } else {
              stats.errors++;
            }
          })
          .catch(() => {
            stats.errors++;
          })
      );
    }

    await Promise.all(deletionPromises);
    
    console.log(`[FileManager] Shutdown complete: deleted ${stats.deleted} files`);
    return stats;
  }
}

/**
 * @typedef {Object} FileInfo
 * @property {string} id - Unique file ID
 * @property {string} filename - Generated filename
 * @property {string} filepath - Full file path
 * @property {string} extension - File extension
 * @property {number} createdAt - Creation timestamp
 * @property {number} size - File size in bytes
 * @property {number} accessedAt - Last access timestamp
 * @property {string} status - File status
 * @property {string} [error] - Error message if any
 * @property {number} [deletedAt] - Deletion timestamp
 * @property {number} [markedAt] - Marked for deletion timestamp
 */

/**
 * @typedef {Object} CleanupStats
 * @property {number} total - Total files before cleanup
 * @property {number} deleted - Number of files deleted
 * @property {number} errors - Number of deletion errors
 * @property {number} skipped - Number of files skipped
 */

/**
 * @typedef {Object} ManagerStats
 * @property {number} totalFiles - Total managed files
 * @property {Object} filesByStatus - Files count by status
 * @property {number} totalSize - Total size of all files in bytes
 * @property {string} tempDir - Temporary directory path
 * @property {number} cleanupInterval - Cleanup interval in ms
 * @property {number} maxFileAge - Maximum file age in ms
 */

module.exports = TempFileManager;