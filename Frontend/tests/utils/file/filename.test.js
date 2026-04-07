/**
 * Tests for file utilities
 * Pure functions for file operations
 */

import { describe, it, expect } from 'vitest';
import {
  generateFilename,
  filenameExists,
  getFileExtension,
  getBaseFilename,
  ensurePlExtension,
} from '../../../src/utils/file/filename';

describe('filename.js', () => {
  describe('generateFilename', () => {
    it('should return baseName.pl when files is empty', () => {
      const result = generateFilename([], 'archivo');
      expect(result).toBe('archivo.pl');
    });

    it('should return baseName.pl when files is null', () => {
      const result = generateFilename(null, 'archivo');
      expect(result).toBe('archivo.pl');
    });

    it('should return baseName.pl when files is undefined', () => {
      const result = generateFilename(undefined, 'archivo');
      expect(result).toBe('archivo.pl');
    });

    it('should return baseName with .pl if already has extension', () => {
      const result = generateFilename([], 'test.pl');
      expect(result).toBe('test.pl');
    });

    it('should return incremented filename when base exists', () => {
      const files = [{ name: 'archivo.pl' }];
      const result = generateFilename(files, 'archivo');
      expect(result).toBe('archivo_1.pl');
    });

    it('should return incremented filename when base with number exists', () => {
      const files = [{ name: 'archivo.pl' }, { name: 'archivo_1.pl' }];
      const result = generateFilename(files, 'archivo');
      expect(result).toBe('archivo_2.pl');
    });

    it('should skip existing numbers and find next available', () => {
      const files = [
        { name: 'archivo.pl' },
        { name: 'archivo_1.pl' },
        { name: 'archivo_2.pl' },
        { name: 'archivo_4.pl' }
      ];
      const result = generateFilename(files, 'archivo');
      expect(result).toBe('archivo_3.pl');
    });

    it('should handle empty files array properly', () => {
      const result = generateFilename([], 'myfile');
      expect(result).toBe('myfile.pl');
    });

    it('should use default baseName when not provided', () => {
      const result = generateFilename([]);
      expect(result).toBe('archivo.pl');
    });

    it('should work with various base names', () => {
      expect(generateFilename([], 'programa')).toBe('programa.pl');
      expect(generateFilename([], 'test')).toBe('test.pl');
      expect(generateFilename([], 'query')).toBe('query.pl');
    });

    it('should handle files with different extensions', () => {
      const files = [{ name: 'archivo.txt' }, { name: 'archivo.pl' }];
      const result = generateFilename(files, 'archivo');
      expect(result).toBe('archivo_1.pl');
    });

    it('should handle files array with non-name properties', () => {
      const files = [{ id: 1 }, { name: 'archivo.pl' }];
      const result = generateFilename(files, 'archivo');
      expect(result).toBe('archivo_1.pl');
    });
  });

  describe('filenameExists', () => {
    it('should return false for empty files array', () => {
      expect(filenameExists([], 'test.pl')).toBe(false);
    });

    it('should return true when filename exists', () => {
      const files = [{ name: 'test.pl' }, { name: 'other.pl' }];
      expect(filenameExists(files, 'test.pl')).toBe(true);
    });

    it('should return false when filename does not exist', () => {
      const files = [{ name: 'test.pl' }];
      expect(filenameExists(files, 'other.pl')).toBe(false);
    });

    it('should return false for empty filename', () => {
      const files = [{ name: 'test.pl' }];
      expect(filenameExists(files, '')).toBe(false);
    });

    it('should be case sensitive', () => {
      const files = [{ name: 'Test.pl' }];
      expect(filenameExists(files, 'test.pl')).toBe(false);
      expect(filenameExists(files, 'Test.pl')).toBe(true);
    });

    it('should return false for null files', () => {
      expect(filenameExists(null, 'test.pl')).toBe(false);
    });

    it('should return false for undefined files', () => {
      expect(filenameExists(undefined, 'test.pl')).toBe(false);
    });

    it('should return false for null filename', () => {
      const files = [{ name: 'test.pl' }];
      expect(filenameExists(files, null)).toBe(false);
    });

    it('should return false for undefined filename', () => {
      const files = [{ name: 'test.pl' }];
      expect(filenameExists(files, undefined)).toBe(false);
    });

    it('should handle empty files array correctly', () => {
      expect(filenameExists([], 'test.pl')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should return extension with dot', () => {
      expect(getFileExtension('test.pl')).toBe('.pl');
    });

    it('should return extension for file with multiple dots', () => {
      expect(getFileExtension('test.backup.pl')).toBe('.pl');
    });

    it('should return empty string for filename without extension', () => {
      expect(getFileExtension('test')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(getFileExtension(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(getFileExtension(undefined)).toBe('');
    });

    it('should handle files starting with dot', () => {
      expect(getFileExtension('.gitignore')).toBe('');
    });

    it('should handle extension with multiple characters', () => {
      expect(getFileExtension('file.tar.gz')).toBe('.gz');
    });
  });

  describe('getBaseFilename', () => {
    it('should return filename without extension', () => {
      expect(getBaseFilename('test.pl')).toBe('test');
    });

    it('should handle file with multiple dots', () => {
      expect(getBaseFilename('test.backup.pl')).toBe('test.backup');
    });

    it('should return full string when no extension', () => {
      expect(getBaseFilename('test')).toBe('test');
    });

    it('should return empty string for empty input', () => {
      expect(getBaseFilename('')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(getBaseFilename(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(getBaseFilename(undefined)).toBe('');
    });

    it('should handle single dot filename', () => {
      expect(getBaseFilename('.')).toBe('.');
    });

    it('should handle filename starting with dot', () => {
      expect(getBaseFilename('.gitignore')).toBe('.gitignore');
    });
  });

  describe('ensurePlExtension', () => {
    it('should add .pl extension when missing', () => {
      expect(ensurePlExtension('test')).toBe('test.pl');
    });

    it('should keep existing .pl extension', () => {
      expect(ensurePlExtension('test.pl')).toBe('test.pl');
    });

    it('should return default for empty string', () => {
      expect(ensurePlExtension('')).toBe('archivo.pl');
    });

    it('should return default for null', () => {
      expect(ensurePlExtension(null)).toBe('archivo.pl');
    });

    it('should return default for undefined', () => {
      expect(ensurePlExtension(undefined)).toBe('archivo.pl');
    });

    it('should handle other extensions', () => {
      expect(ensurePlExtension('test.txt')).toBe('test.txt.pl');
    });
  });
});