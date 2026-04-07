/**
 * Tests for Prolog theme configuration for Monaco Editor
 * Extracted from CodeEditor.jsx
 */

import { describe, it, expect } from 'vitest';
import {
  getPrologTheme,
  getPrologDarkTheme,
  getPrologLightTheme,
} from '../../../src/config/monaco/prologTheme';

describe('prologTheme.js', () => {
  describe('getPrologTheme', () => {
    it('should return light theme base when theme is light', () => {
      const theme = getPrologTheme('light');
      
      expect(theme.base).toBe('vs');
      expect(theme.inherit).toBe(true);
    });

    it('should return dark theme base when theme is dark', () => {
      const theme = getPrologTheme('dark');
      
      expect(theme.base).toBe('vs-dark');
      expect(theme.inherit).toBe(true);
    });

    it('should default to light theme when no theme provided', () => {
      const theme = getPrologTheme();
      
      expect(theme.base).toBe('vs');
    });

    it('should return correct token rules', () => {
      const theme = getPrologTheme();
      
      expect(theme.rules).toBeDefined();
      expect(Array.isArray(theme.rules)).toBe(true);
      expect(theme.rules.length).toBeGreaterThan(0);
    });

    it('should have comment token rule', () => {
      const theme = getPrologTheme();
      
      const commentRule = theme.rules.find(r => r.token === 'comment');
      expect(commentRule).toBeDefined();
      expect(commentRule.foreground).toBeDefined();
    });

    it('should have keyword token rule', () => {
      const theme = getPrologTheme();
      
      const keywordRule = theme.rules.find(r => r.token === 'keyword');
      expect(keywordRule).toBeDefined();
      expect(keywordRule.foreground).toBeDefined();
    });

    it('should have variable token rule', () => {
      const theme = getPrologTheme();
      
      const variableRule = theme.rules.find(r => r.token === 'variable');
      expect(variableRule).toBeDefined();
      expect(variableRule.foreground).toBeDefined();
    });

    it('should have predicate token rule', () => {
      const theme = getPrologTheme();
      
      const predicateRule = theme.rules.find(r => r.token === 'predicate');
      expect(predicateRule).toBeDefined();
      expect(predicateRule.foreground).toBeDefined();
    });

    it('should have string token rule', () => {
      const theme = getPrologTheme();
      
      const stringRule = theme.rules.find(r => r.token === 'string');
      expect(stringRule).toBeDefined();
      expect(stringRule.foreground).toBeDefined();
    });

    it('should have number token rule', () => {
      const theme = getPrologTheme();
      
      const numberRule = theme.rules.find(r => r.token === 'number');
      expect(numberRule).toBeDefined();
      expect(numberRule.foreground).toBeDefined();
    });

    it('should have operator token rule', () => {
      const theme = getPrologTheme();
      
      const operatorRule = theme.rules.find(r => r.token === 'operator');
      expect(operatorRule).toBeDefined();
      expect(operatorRule.foreground).toBeDefined();
    });

    it('should have colors object', () => {
      const theme = getPrologTheme();
      
      expect(theme.colors).toBeDefined();
      expect(theme.colors['editor.background']).toBeDefined();
      expect(theme.colors['editor.foreground']).toBeDefined();
    });

    it('should have light-specific colors when theme is light', () => {
      const theme = getPrologTheme('light');
      
      expect(theme.colors['editor.background']).toBe('#ffffff');
      expect(theme.colors['editor.foreground']).toBe('#374151');
    });

    it('should have dark-specific colors when theme is dark', () => {
      const theme = getPrologTheme('dark');
      
      expect(theme.colors['editor.background']).toBe('#1f2937');
      expect(theme.colors['editor.foreground']).toBe('#d1d5db');
    });

    it('should have cursor color', () => {
      const theme = getPrologTheme();
      
      expect(theme.colors['editorCursor.foreground']).toBe('#0ea5e9');
    });

    it('should have selection background color', () => {
      const theme = getPrologTheme();
      
      expect(theme.colors['editor.selectionBackground']).toBeDefined();
    });

    it('should have line highlight background', () => {
      const theme = getPrologTheme();
      
      expect(theme.colors['editor.lineHighlightBackground']).toBeDefined();
    });
  });

  describe('getPrologDarkTheme', () => {
    it('should return theme with vs-dark base', () => {
      const theme = getPrologDarkTheme();
      
      expect(theme.base).toBe('vs-dark');
    });

    it('should return dark-specific background color', () => {
      const theme = getPrologDarkTheme();
      
      expect(theme.colors['editor.background']).toBe('#1f2937');
    });

    it('should return dark-specific foreground color', () => {
      const theme = getPrologDarkTheme();
      
      expect(theme.colors['editor.foreground']).toBe('#d1d5db');
    });

    it('should inherit from getPrologTheme with dark parameter', () => {
      const darkTheme = getPrologDarkTheme();
      const regularDark = getPrologTheme('dark');
      
      expect(darkTheme.rules).toEqual(regularDark.rules);
    });
  });

  describe('getPrologLightTheme', () => {
    it('should return theme with vs base', () => {
      const theme = getPrologLightTheme();
      
      expect(theme.base).toBe('vs');
    });

    it('should return light-specific background color', () => {
      const theme = getPrologLightTheme();
      
      expect(theme.colors['editor.background']).toBe('#ffffff');
    });

    it('should return light-specific foreground color', () => {
      const theme = getPrologLightTheme();
      
      expect(theme.colors['editor.foreground']).toBe('#374151');
    });

    it('should inherit from getPrologTheme with light parameter', () => {
      const lightTheme = getPrologLightTheme();
      const regularLight = getPrologTheme('light');
      
      expect(lightTheme.rules).toEqual(regularLight.rules);
    });
  });
});