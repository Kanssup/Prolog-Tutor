/**
 * Tests for colors.js theme utilities
 * Tests color palette, getColor, cssVariables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the module under test
import { colors, getColor, cssVariables, saveTheme } from '../../src/themes/colors';

describe('colors.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (global.localStorage) {
      global.localStorage.getItem.mockReturnValue(null);
      global.localStorage.setItem.mockReturnValue(undefined);
      global.localStorage.removeItem.mockReturnValue(undefined);
    }
  });

  describe('colors palette structure', () => {
    it('should have primary color group with 50-900 shades', () => {
      expect(colors.primary).toBeDefined();
      expect(colors.primary[50]).toBe('#f0f9ff');
      expect(colors.primary[500]).toBe('#0ea5e9');
      expect(colors.primary[900]).toBe('#0c4a6e');
    });

    it('should have secondary color group with shades', () => {
      expect(colors.secondary).toBeDefined();
      expect(colors.secondary[500]).toBe('#22c55e');
    });

    it('should have accent color group with shades', () => {
      expect(colors.accent).toBeDefined();
      expect(colors.accent[500]).toBe('#f59e0b');
    });

    it('should have neutral color group with shades', () => {
      expect(colors.neutral).toBeDefined();
      expect(colors.neutral[500]).toBe('#6b7280');
    });

    it('should have prolog semantic colors', () => {
      expect(colors.prolog).toBeDefined();
      expect(colors.prolog.success).toBe('#10b981');
      expect(colors.prolog.error).toBe('#ef4444');
      expect(colors.prolog.warning).toBe('#f59e0b');
      expect(colors.prolog.info).toBe('#3b82f6');
    });

    it('should have syntax highlighting colors', () => {
      expect(colors.prolog.variable).toBe('#8b5cf6');
      expect(colors.prolog.predicate).toBe('#ec4899');
      expect(colors.prolog.atom).toBe('#0ea5e9');
    });

    it('should have UI component colors', () => {
      expect(colors.ui).toBeDefined();
      expect(colors.ui.background.light).toBe('#ffffff');
      expect(colors.ui.background.dark).toBe('#111827');
    });
  });

  describe('getColor', () => {
    it('should retrieve nested color values with dot notation', () => {
      expect(getColor('primary.500')).toBe('#0ea5e9');
      expect(getColor('secondary.500')).toBe('#22c55e');
      expect(getColor('accent.500')).toBe('#f59e0b');
    });

    it('should return theme-specific colors for ui colors', () => {
      expect(getColor('ui.background', 'light')).toBe('#ffffff');
      expect(getColor('ui.background', 'dark')).toBe('#111827');
    });

    it('should return fallback #000000 for invalid paths', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(getColor('invalid.path')).toBe('#000000');
      expect(getColor('nonexistent')).toBe('#000000');
      
      consoleSpy.mockRestore();
    });

    it('should handle prolog semantic colors', () => {
      expect(getColor('prolog.success')).toBe('#10b981');
      expect(getColor('prolog.error')).toBe('#ef4444');
    });

    it('should default to light theme when not specified', () => {
      const color = getColor('ui.background');
      expect(color).toBe('#ffffff');
    });
  });

  describe('cssVariables', () => {
    it('should have light theme variables', () => {
      expect(cssVariables.light['--color-primary']).toBe('#0ea5e9');
      expect(cssVariables.light['--color-background']).toBe('#ffffff');
    });

    it('should have dark theme variables', () => {
      expect(cssVariables.dark['--color-primary']).toBe('#38bdf8');
      expect(cssVariables.dark['--color-background']).toBe('#111827');
    });

    it('should have all required CSS variables', () => {
      const requiredVars = [
        '--color-primary',
        '--color-secondary',
        '--color-accent',
        '--color-success',
        '--color-error',
        '--color-warning',
        '--color-info',
        '--color-background',
        '--color-surface',
        '--color-border',
        '--color-text-primary',
        '--color-text-secondary',
      ];
      
      requiredVars.forEach(varName => {
        expect(cssVariables.light[varName]).toBeDefined();
        expect(cssVariables.dark[varName]).toBeDefined();
      });
    });
  });

  // Skip DOM-dependent tests in Node environment
  // applyTheme and getInitialTheme will be tested in component tests with jsdom
});

// Test saveTheme which doesn't require DOM
describe('colors.js - saveTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (global.localStorage) {
      global.localStorage.getItem.mockReturnValue(null);
      global.localStorage.setItem.mockReturnValue(undefined);
      global.localStorage.removeItem.mockReturnValue(undefined);
    }
  });

  describe('saveTheme', () => {
    it('should save theme to localStorage', () => {
      saveTheme('dark');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('prolog-tutor-theme', 'dark');
    });

    it('should save light theme', () => {
      saveTheme('light');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('prolog-tutor-theme', 'light');
    });
  });
});