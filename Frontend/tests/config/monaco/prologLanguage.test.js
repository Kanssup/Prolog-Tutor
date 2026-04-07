/**
 * Tests for Prolog language configuration for Monaco Editor
 * Extracted from CodeEditor.jsx
 */

import { describe, it, expect } from 'vitest';
import {
  getPrologLanguageConfig,
  getPrologTokenizer,
  getPrologLanguageDefinition,
} from '../../../src/config/monaco/prologLanguage';

describe('prologLanguage.js', () => {
  describe('getPrologLanguageConfig', () => {
    it('should return correct comment configuration', () => {
      const config = getPrologLanguageConfig();
      
      expect(config.comments).toBeDefined();
      expect(config.comments.lineComment).toBe('%');
      expect(config.comments.blockComment).toEqual(['/*', '*/']);
    });

    it('should return correct bracket pairs', () => {
      const config = getPrologLanguageConfig();
      
      expect(config.brackets).toBeDefined();
      expect(config.brackets).toContainEqual(['(', ')']);
      expect(config.brackets).toContainEqual(['[', ']']);
      expect(config.brackets).toContainEqual(['{', '}']);
    });

    it('should return correct auto-closing pairs', () => {
      const config = getPrologLanguageConfig();
      
      expect(config.autoClosingPairs).toBeDefined();
      expect(config.autoClosingPairs.length).toBeGreaterThan(0);
      
      // Check for specific pairs
      const hasParens = config.autoClosingPairs.some(p => p.open === '(' && p.close === ')');
      const hasBrackets = config.autoClosingPairs.some(p => p.open === '[' && p.close === ']');
      const hasBraces = config.autoClosingPairs.some(p => p.open === '{' && p.close === '}');
      
      expect(hasParens).toBe(true);
      expect(hasBrackets).toBe(true);
      expect(hasBraces).toBe(true);
    });

    it('should return correct surrounding pairs', () => {
      const config = getPrologLanguageConfig();
      
      expect(config.surroundingPairs).toBeDefined();
      expect(config.surroundingPairs.length).toBeGreaterThan(0);
    });

    it('should handle light theme parameter', () => {
      const config = getPrologLanguageConfig('light');
      expect(config.comments).toBeDefined();
    });

    it('should handle dark theme parameter', () => {
      const config = getPrologLanguageConfig('dark');
      expect(config.comments).toBeDefined();
    });
  });

  describe('getPrologTokenizer', () => {
    it('should return tokenizer with defaultToken', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.defaultToken).toBe('');
      expect(tokenizer.tokenPostfix).toBe('.pl');
    });

    it('should have keywords array including asserta and retract', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.keywords).toBeDefined();
      expect(tokenizer.keywords).toContain('asserta');
      expect(tokenizer.keywords).toContain('retract');
      expect(tokenizer.keywords).toContain('assertz');
      expect(tokenizer.keywords).toContain('retractall');
    });

    it('should have other important keywords', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.keywords).toContain('true');
      expect(tokenizer.keywords).toContain('false');
      expect(tokenizer.keywords).toContain('fail');
      expect(tokenizer.keywords).toContain('not');
      expect(tokenizer.keywords).toContain('call');
    });

    it('should have operators array', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.operators).toBeDefined();
      expect(tokenizer.operators).toContain(':-');
      expect(tokenizer.operators).toContain('->');
      expect(tokenizer.operators).toContain(';');
      expect(tokenizer.operators).toContain(',');
      expect(tokenizer.operators).toContain('\\+');
    });

    it('should have tokenizer root rules', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.tokenizer).toBeDefined();
      expect(tokenizer.tokenizer.root).toBeDefined();
      expect(tokenizer.tokenizer.root.length).toBeGreaterThan(0);
    });

    it('should have comment rules in tokenizer', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.tokenizer.root).toContainEqual(expect.arrayContaining([/%.*/, 'comment']));
    });

    it('should have number rules in tokenizer', () => {
      const tokenizer = getPrologTokenizer();
      
      // Should have rules for integers and floats
      const hasNumberRule = tokenizer.tokenizer.root.some(
        rule => Array.isArray(rule) && rule[1] === 'number'
      );
      expect(hasNumberRule).toBe(true);
    });

    it('should have variable rules for uppercase/underscore', () => {
      const tokenizer = getPrologTokenizer();
      
      // Should match variables like X, Y, _, Variable
      const hasVariableRule = tokenizer.tokenizer.root.some(
        rule => Array.isArray(rule) && rule[0] && rule[0].toString().includes('A-Z')
      );
      expect(hasVariableRule).toBe(true);
    });

    it('should have predicate/keyword rules for lowercase', () => {
      const tokenizer = getPrologTokenizer();
      
      // Should match predicates like parent, test
      const hasPredicateRule = tokenizer.tokenizer.root.some(
        rule => Array.isArray(rule) && rule[1] && rule[1].cases && rule[1].cases['@keywords']
      );
      expect(hasPredicateRule).toBe(true);
    });

    it('should have comment state for block comments', () => {
      const tokenizer = getPrologTokenizer();
      
      expect(tokenizer.tokenizer.comment).toBeDefined();
      expect(tokenizer.tokenizer.comment.length).toBeGreaterThan(0);
    });
  });

  describe('getPrologLanguageDefinition', () => {
    it('should return complete language definition', () => {
      const definition = getPrologLanguageDefinition();
      
      expect(definition).toBeDefined();
      expect(definition.languageConfig).toBeDefined();
      expect(definition.tokenizer).toBeDefined();
    });

    it('should include languageConfig with comments and brackets', () => {
      const definition = getPrologLanguageDefinition();
      
      expect(definition.languageConfig.comments).toBeDefined();
      expect(definition.languageConfig.brackets).toBeDefined();
      expect(definition.languageConfig.autoClosingPairs).toBeDefined();
    });

    it('should include tokenizer with keywords', () => {
      const definition = getPrologLanguageDefinition();
      
      expect(definition.tokenizer.keywords).toBeDefined();
      expect(definition.tokenizer.operators).toBeDefined();
      expect(definition.tokenizer.tokenizer).toBeDefined();
    });

    it('should accept theme parameter', () => {
      const lightDef = getPrologLanguageDefinition('light');
      const darkDef = getPrologLanguageDefinition('dark');
      
      expect(lightDef).toBeDefined();
      expect(darkDef).toBeDefined();
    });

    it('should default to light theme', () => {
      const definition = getPrologLanguageDefinition();
      const lightDefinition = getPrologLanguageDefinition('light');
      
      expect(definition.tokenizer.keywords).toEqual(lightDefinition.tokenizer.keywords);
    });
  });
});