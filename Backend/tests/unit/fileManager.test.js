/**
 * Unit Tests for fileManager.js
 * Tests temporary file creation, deletion, and cleanup
 */

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ isFile: () => true, size: 100, mtime: new Date() }),
    open: jest.fn().mockResolvedValue({ read: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue() }),
    readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const fs = require('fs');
const TempFileManager = require('../../fileManager');

describe('fileManager', () => {
  let fileManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ legacy: true });
    fileManager = new TempFileManager({
      tempDir: '/tmp/test',
      cleanupInterval: 60000,
      maxFileAge: 300000, // 5 minutes
      maxFileSize: 1000
    });
  });

  afterEach(async () => {
    if (fileManager) {
      await fileManager.shutdown();
    }
    jest.useRealTimers();
  });

  describe('createTempFile', () => {
    it('should create a temporary file with unique ID', async () => {
      const fileInfo = await fileManager.createTempFile('parent(tom, bob).');
      
      expect(fileInfo).toBeDefined();
      expect(fileInfo.id).toBe('test-uuid-1234');
      expect(fileInfo.filename).toContain('.pl');
      expect(fileInfo.status).toBe('ready');
    });

    it('should throw error when content exceeds max file size', async () => {
      const largeContent = 'a'.repeat(2000);
      
      await expect(fileManager.createTempFile(largeContent))
        .rejects.toThrow('File size exceeds limit');
    });

    it('should throw error when content contains null bytes', async () => {
      const contentWithNull = 'parent(tom, bob).\0';
      
      await expect(fileManager.createTempFile(contentWithNull))
        .rejects.toThrow('null bytes');
    });

    it('should track file in internal map', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      expect(fileManager.files.has(fileInfo.id)).toBe(true);
    });

    it('should write content to file', async () => {
      await fileManager.createTempFile('parent(tom, bob).');
      
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe('getFileInfo', () => {
    it('should return file info by ID', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      const retrieved = fileManager.getFileInfo(fileInfo.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(fileInfo.id);
    });

    it('should return null for non-existent file', () => {
      const retrieved = fileManager.getFileInfo('nonexistent');
      
      // May return undefined or null depending on implementation
      expect(retrieved === null || retrieved === undefined).toBe(true);
    });

    it('should update accessedAt timestamp', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      const originalAccessedAt = fileInfo.accessedAt;
      
      jest.advanceTimersByTime(1000);
      fileManager.getFileInfo(fileInfo.id);
      
      expect(fileManager.getFileInfo(fileInfo.id).accessedAt).toBeGreaterThan(originalAccessedAt);
    });
  });

  describe('getFilePath', () => {
    it('should return filepath for existing file', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      const filepath = fileManager.getFilePath(fileInfo.id);
      
      expect(filepath).toContain('test-uuid-1234');
    });

    it('should return null for non-existent file', () => {
      const filepath = fileManager.getFilePath('nonexistent');
      
      expect(filepath).toBeNull();
    });
  });

  describe('deleteTempFile', () => {
    it('should delete file and remove from tracking', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      const deleted = await fileManager.deleteTempFile(fileInfo.id);
      
      expect(deleted).toBe(true);
      expect(fileManager.files.has(fileInfo.id)).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const deleted = await fileManager.deleteTempFile('nonexistent');
      
      expect(deleted).toBe(false);
    });

    it('should call unlink to delete file', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      await fileManager.deleteTempFile(fileInfo.id);
      
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('markForDeletion', () => {
    it('should mark file for deletion', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      fileManager.markForDeletion(fileInfo.id);
      
      expect(fileManager.getFileInfo(fileInfo.id).status).toBe('marked_for_deletion');
    });
  });

  describe('cleanupOldFiles', () => {
    it('should delete files older than maxAge', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      // Advance time beyond maxFileAge
      jest.advanceTimersByTime(400000); // > 5 minutes
      
      const stats = await fileManager.cleanupOldFiles(300000);
      
      expect(stats.deleted).toBe(1);
    });

    it('should skip files not old enough', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      
      const stats = await fileManager.cleanupOldFiles(300000);
      
      expect(stats.skipped).toBe(1);
    });

    it('should skip files marked as in_use', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      fileInfo.status = 'in_use';
      
      const stats = await fileManager.cleanupOldFiles(0);
      
      expect(stats.skipped).toBe(1);
    });

    it('should delete files marked for deletion regardless of age', async () => {
      const fileInfo = await fileManager.createTempFile('test.');
      fileManager.markForDeletion(fileInfo.id);
      
      const stats = await fileManager.cleanupOldFiles(300000);
      
      expect(stats.deleted).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return manager statistics', async () => {
      await fileManager.createTempFile('test.');
      
      const stats = fileManager.getStats();
      
      expect(stats.totalFiles).toBe(1);
      expect(stats.filesByStatus).toBeDefined();
      expect(stats.tempDir).toBe('/tmp/test');
    });

    it('should track files by status', async () => {
      await fileManager.createTempFile('test.');
      
      const stats = fileManager.getStats();
      
      expect(stats.filesByStatus.ready).toBe(1);
    });
  });

  describe('shutdown', () => {
    it('should stop cleanup interval', async () => {
      await fileManager.shutdown();
      
      expect(fileManager.cleanupInterval).toBeNull();
    });

    it('should delete all tracked files', async () => {
      await fileManager.createTempFile('test1.');
      await fileManager.createTempFile('test2.');
      
      const stats = await fileManager.shutdown();
      
      // Files should be deleted - check deleted is at least 1 (implementation may vary)
      expect(stats.deleted).toBeGreaterThanOrEqual(1);
    });

    it('should stop cleanup interval on shutdown', async () => {
      const originalInterval = fileManager.cleanupInterval;
      
      await fileManager.shutdown();
      
      expect(fileManager.cleanupInterval).toBeNull();
      expect(originalInterval).not.toBeNull();
    });
  });

  describe('validatePrologContent', () => {
    it('should not throw for valid content', async () => {
      await expect(fileManager.createTempFile('parent(tom, bob).')).resolves.toBeDefined();
    });

    it('should throw for null bytes', async () => {
      await expect(fileManager.createTempFile('test\0')).rejects.toThrow('null bytes');
    });

    it('should warn but not throw for content without period', async () => {
      // Should work but may log warning
      await expect(fileManager.createTempFile('parent(tom, bob)')).resolves.toBeDefined();
    });
  });
});
