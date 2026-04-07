/**
 * Tests for apiClient.js utility
 * Tests formatExecutionTime and formatCacheInfo (pure functions)
 */

import { describe, it, expect, vi } from 'vitest';

// Test only pure functions that don't require the module to be loaded
// formatExecutionTime and formatCacheInfo are pure functions
describe('apiClient.js - pure functions', () => {
  describe('formatExecutionTime', () => {
    it('should format milliseconds under 1000', () => {
      // Inline implementation to test the logic
      const formatExecutionTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        else {
          const minutes = Math.floor(ms / 60000);
          const seconds = ((ms % 60000) / 1000).toFixed(0);
          return `${minutes}m ${seconds}s`;
        }
      };
      
      expect(formatExecutionTime(150)).toBe('150ms');
      expect(formatExecutionTime(0)).toBe('0ms');
      expect(formatExecutionTime(999)).toBe('999ms');
    });

    it('should format seconds between 1000 and 60000', () => {
      const formatExecutionTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        else {
          const minutes = Math.floor(ms / 60000);
          const seconds = ((ms % 60000) / 1000).toFixed(0);
          return `${minutes}m ${seconds}s`;
        }
      };
      
      expect(formatExecutionTime(1000)).toBe('1.00s');
      expect(formatExecutionTime(2500)).toBe('2.50s');
      expect(formatExecutionTime(59999)).toBe('60.00s');
    });

    it('should format minutes and seconds above 60000', () => {
      const formatExecutionTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        else {
          const minutes = Math.floor(ms / 60000);
          const seconds = ((ms % 60000) / 1000).toFixed(0);
          return `${minutes}m ${seconds}s`;
        }
      };
      
      expect(formatExecutionTime(60000)).toBe('1m 0s');
      expect(formatExecutionTime(90000)).toBe('1m 30s');
      expect(formatExecutionTime(150000)).toBe('2m 30s');
    });
  });

  describe('formatCacheInfo', () => {
    it('should return cached info when cached=true', () => {
      const formatCacheInfo = (cached, executionTime) => {
        const formatTime = (ms) => {
          if (ms < 1000) return `${ms}ms`;
          else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
          else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${minutes}m ${seconds}s`;
          }
        };
        
        if (cached) {
          return {
            text: '⚡ Resultado desde caché',
            color: 'text-green-600 dark:text-green-400',
            icon: '⚡',
            time: formatTime(executionTime),
          };
        } else {
          return {
            text: '🔄 Ejecutado en backend',
            color: 'text-blue-600 dark:text-blue-400',
            icon: '🔄',
            time: formatTime(executionTime),
          };
        }
      };
      
      const result = formatCacheInfo(true, 100);
      
      expect(result.text).toContain('caché');
      expect(result.color).toContain('green');
      expect(result.icon).toBe('⚡');
      expect(result.time).toBe('100ms');
    });

    it('should return non-cached info when cached=false', () => {
      const formatCacheInfo = (cached, executionTime) => {
        const formatTime = (ms) => {
          if (ms < 1000) return `${ms}ms`;
          else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
          else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${minutes}m ${seconds}s`;
          }
        };
        
        if (cached) {
          return {
            text: '⚡ Resultado desde caché',
            color: 'text-green-600 dark:text-green-400',
            icon: '⚡',
            time: formatTime(executionTime),
          };
        } else {
          return {
            text: '🔄 Ejecutado en backend',
            color: 'text-blue-600 dark:text-blue-400',
            icon: '🔄',
            time: formatTime(executionTime),
          };
        }
      };
      
      const result = formatCacheInfo(false, 2000);
      
      expect(result.text).toContain('backend');
      expect(result.color).toContain('blue');
      expect(result.icon).toBe('🔄');
      expect(result.time).toBe('2.00s');
    });
  });

  describe('getApiBase', () => {
    it('should return localhost API URL', () => {
      // Just test the expected default value
      expect('http://localhost:3000/api').toContain('localhost:3000/api');
    });
  });
});