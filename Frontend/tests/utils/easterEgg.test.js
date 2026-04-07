/**
 * Tests for easterEgg.js utility
 * Tests checkEasterEgg, createConfettiEffect, localStorage functions, and achievement levels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the module under test
// Note: localStorage is mocked in setup.js
import { checkEasterEgg, getEasterEggCount, incrementEasterEggCount, resetEasterEggCount, hasDiscoveredEasterEggs, getEasterEggAchievement } from '../../src/utils/easterEgg';

describe('easterEgg.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock from setup.js
    if (global.localStorage) {
      global.localStorage.getItem.mockReturnValue(null);
      global.localStorage.setItem.mockReturnValue(undefined);
      global.localStorage.removeItem.mockReturnValue(undefined);
    }
  });

  describe('checkEasterEgg', () => {
    it('should detect easter egg with exact match "free(guapo)"', () => {
      const result = checkEasterEgg('', 'free(guapo)');
      expect(result.isEasterEgg).toBe(true);
      expect(result.response).toBe('capture(lester).');
      expect(result.message).toContain('Easter egg');
      expect(result.specialEffect).toBe('confetti');
    });

    it('should detect easter egg with uppercase "FREE(GUAPO)"', () => {
      const result = checkEasterEgg('', 'FREE(GUAPO)');
      expect(result.isEasterEgg).toBe(true);
      expect(result.response).toBe('capture(lester).');
    });

    it('should detect easter egg with spaces "free( guapo )"', () => {
      const result = checkEasterEgg('', 'free( guapo )');
      expect(result.isEasterEgg).toBe(true);
      expect(result.response).toBe('capture(lester).');
    });

    it('should detect easter egg with trailing period "free(guapo)."', () => {
      const result = checkEasterEgg('', 'free(guapo).');
      expect(result.isEasterEgg).toBe(true);
      expect(result.response).toBe('capture(lester).');
    });

    it('should detect easter egg with newlines and tabs', () => {
      const result = checkEasterEgg('', 'free(\n\tguapo\n)');
      expect(result.isEasterEgg).toBe(true);
    });

    it('should NOT trigger easter egg for non-matching queries', () => {
      expect(checkEasterEgg('', 'parent(X, Y)').isEasterEgg).toBe(false);
      expect(checkEasterEgg('', 'free(other)').isEasterEgg).toBe(false);
      expect(checkEasterEgg('', 'help').isEasterEgg).toBe(false);
      expect(checkEasterEgg('', '').isEasterEgg).toBe(false);
    });

    it('should return empty response when not an easter egg', () => {
      const result = checkEasterEgg('', 'test query');
      expect(result.isEasterEgg).toBe(false);
      expect(result.message).toBe('');
      expect(result.response).toBe('');
    });

    it('should include sound and duration for easter egg', () => {
      const result = checkEasterEgg('', 'free(guapo)');
      expect(result.sound).toBe('chime');
      expect(result.duration).toBe(7000);
      expect(result.theme).toBe('special');
    });
  });

  describe('localStorage functions', () => {
    it('getEasterEggCount should return 0 when localStorage is empty', () => {
      global.localStorage.getItem.mockReturnValue(null);
      expect(getEasterEggCount()).toBe(0);
    });

    it('getEasterEggCount should parse stored count', () => {
      global.localStorage.getItem.mockReturnValue('5');
      expect(getEasterEggCount()).toBe(5);
    });

    it('incrementEasterEggCount should increment and save', () => {
      global.localStorage.getItem.mockReturnValue('2');
      const newCount = incrementEasterEggCount();
      expect(newCount).toBe(3);
      expect(global.localStorage.setItem).toHaveBeenCalledWith('prolog-tutor-easter-egg-count', '3');
    });

    it('resetEasterEggCount should remove the key', () => {
      resetEasterEggCount();
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('prolog-tutor-easter-egg-count');
    });

    it('hasDiscoveredEasterEggs should return true when count > 0', () => {
      global.localStorage.getItem.mockReturnValue('3');
      expect(hasDiscoveredEasterEggs()).toBe(true);
    });

    it('hasDiscoveredEasterEggs should return false when count is 0', () => {
      global.localStorage.getItem.mockReturnValue('0');
      expect(hasDiscoveredEasterEggs()).toBe(false);
    });
  });

  describe('getEasterEggAchievement', () => {
    it('should return "Novato" for count 0', () => {
      global.localStorage.getItem.mockReturnValue('0');
      expect(getEasterEggAchievement()).toBe('Novato');
    });

    it('should return "Descubridor" for count 1', () => {
      global.localStorage.getItem.mockReturnValue('1');
      expect(getEasterEggAchievement()).toBe('Descubridor');
    });

    it('should return "Cazador de Secretos" for count 2-3', () => {
      global.localStorage.getItem.mockReturnValue('2');
      expect(getEasterEggAchievement()).toBe('Cazador de Secretos');
      global.localStorage.getItem.mockReturnValue('3');
      expect(getEasterEggAchievement()).toBe('Cazador de Secretos');
    });

    it('should return "Maestro de los Easter Eggs" for count 4-5', () => {
      global.localStorage.getItem.mockReturnValue('4');
      expect(getEasterEggAchievement()).toBe('Maestro de los Easter Eggs');
      global.localStorage.getItem.mockReturnValue('5');
      expect(getEasterEggAchievement()).toBe('Maestro de los Easter Eggs');
    });

    it('should return "Leyenda de Prolog" for count > 5', () => {
      global.localStorage.getItem.mockReturnValue('10');
      expect(getEasterEggAchievement()).toBe('Leyenda de Prolog');
    });
  });
});