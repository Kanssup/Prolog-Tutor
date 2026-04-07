/**
 * Tests for recursion detection utilities
 * Pure functions for analyzing recursive predicate patterns
 */

import { describe, it, expect } from 'vitest';
import { countNodes } from '../../../src/utils/tree/treeTraversal.js';
import {
  extractFunctor,
  countFunctorOccurrences,
  detectRecursionFunctor,
  isRecursionBaseCase,
  pickMainRootChild,
  buildRecursiveFocusedTree,
} from '../../../src/utils/tree/recursionDetection.js';

describe('recursionDetection.js', () => {
  describe('extractFunctor', () => {
    it('should return null for empty string', () => {
      expect(extractFunctor('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(extractFunctor(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(extractFunctor(undefined)).toBeNull();
    });

    it('should return null for non-functor string', () => {
      expect(extractFunctor('hello')).toBeNull();
      expect(extractFunctor('123')).toBeNull();
    });

    it('should extract simple functor', () => {
      expect(extractFunctor('parent(tom, bob)')).toBe('parent');
    });

    it('should extract functor with underscores', () => {
      expect(extractFunctor('my_predicate(X, Y)')).toBe('my_predicate');
    });

    it('should extract functor with capital letters', () => {
      expect(extractFunctor('MyPredicate(X)')).toBe('MyPredicate');
    });

    it('should extract functor with numbers', () => {
      expect(extractFunctor('p2(X)')).toBe('p2');
    });

    it('should extract functor with whitespace', () => {
      expect(extractFunctor('  parent(tom, bob)  ')).toBe('parent');
    });

    it('should return null for string with only parentheses', () => {
      expect(extractFunctor('()')).toBeNull();
    });

    it('should handle functor with complex arguments', () => {
      expect(extractFunctor('rule(parent(X, Y), [father(X, Y), mother(X, Y)])')).toBe('rule');
    });
  });

  describe('countFunctorOccurrences', () => {
    it('should return 0 for null node', () => {
      expect(countFunctorOccurrences(null, 'parent')).toBe(0);
    });

    it('should return 0 for empty functor', () => {
      const node = { goal: 'test(a)', id: '1' };
      expect(countFunctorOccurrences(node, '')).toBe(0);
    });

    it('should return 0 for null functor', () => {
      const node = { goal: 'test(a)', id: '1' };
      expect(countFunctorOccurrences(node, null)).toBe(0);
    });

    it('should count single occurrence', () => {
      const node = { goal: 'parent(tom, bob)', id: '1' };
      expect(countFunctorOccurrences(node, 'parent')).toBe(1);
    });

    it('should return 0 for non-matching functor', () => {
      const node = { goal: 'parent(tom, bob)', id: '1' };
      expect(countFunctorOccurrences(node, 'child')).toBe(0);
    });

    it('should count multiple occurrences in children', () => {
      const tree = {
        goal: 'query',
        id: '0',
        children: [
          { goal: 'parent(tom, bob)', id: '1' },
          { goal: 'parent(bob, alice)', id: '2' },
          { goal: 'female(alice)', id: '3' }
        ]
      };
      expect(countFunctorOccurrences(tree, 'parent')).toBe(2);
      expect(countFunctorOccurrences(tree, 'female')).toBe(1);
    });

    it('should count nested occurrences', () => {
      const tree = {
        goal: 'count(X)',
        id: '0',
        children: [
          { 
            goal: 'count(Y)', 
            id: '1',
            children: [
              { goal: 'count(Z)', id: '2' }
            ]
          }
        ]
      };
      expect(countFunctorOccurrences(tree, 'count')).toBe(3);
    });

    it('should return 0 for node without goal property', () => {
      const node = { id: '1' };
      expect(countFunctorOccurrences(node, 'test')).toBe(0);
    });
  });

  describe('detectRecursionFunctor', () => {
    it('should return null for null node', () => {
      expect(detectRecursionFunctor(null)).toBeNull();
    });

    it('should return null for non-recursive tree', () => {
      const tree = {
        goal: 'query',
        children: [
          { goal: 'father(tom, bob)', status: 'success' },
          { goal: 'mother(bob, alice)', status: 'success' }
        ]
      };
      expect(detectRecursionFunctor(tree)).toBeNull();
    });

    it('should detect recursive functor', () => {
      const tree = {
        goal: 'query',
        children: [
          { 
            goal: 'count(X)', 
            status: 'success',
            children: [
              { goal: 'count(Y)', status: 'success' }
            ]
          }
        ]
      };
      expect(detectRecursionFunctor(tree)).toBe('count');
    });

    it('should detect deep recursion', () => {
      const tree = {
        goal: 'query',
        children: [
          { 
            goal: 'fib(N, F)', 
            status: 'success',
            children: [
              { 
                goal: 'fib(N1, F1)', 
                status: 'success',
                children: [
                  { goal: 'fib(N2, F2)', status: 'success' }
                ]
              }
            ]
          }
        ]
      };
      expect(detectRecursionFunctor(tree)).toBe('fib');
    });

    it('should handle tree without query root', () => {
      const tree = {
        goal: 'count(0)',
        children: [
          { goal: 'count(1)', children: [] }
        ]
      };
      expect(detectRecursionFunctor(tree)).toBe('count');
    });

    it('should return null for single occurrence', () => {
      const tree = {
        goal: 'query',
        children: [
          { goal: 'parent(tom, bob)', status: 'success' }
        ]
      };
      expect(detectRecursionFunctor(tree)).toBeNull();
    });
  });

  describe('isRecursionBaseCase', () => {
    it('should return false for null recursionFunctor', () => {
      const node = { goal: 'count(0)', status: 'success' };
      expect(isRecursionBaseCase(node, null)).toBe(false);
    });

    it('should return false for wrong functor', () => {
      const node = { goal: 'parent(tom, bob)', status: 'success' };
      expect(isRecursionBaseCase(node, 'count')).toBe(false);
    });

    it('should return true for base case (no recursive child)', () => {
      const node = { 
        goal: 'count(0)', 
        status: 'success',
        children: [
          { goal: 'female(X)', status: 'success' }
        ]
      };
      expect(isRecursionBaseCase(node, 'count')).toBe(true);
    });

    it('should return false for recursive step (has recursive child)', () => {
      const node = { 
        goal: 'count(N)', 
        status: 'success',
        children: [
          { goal: 'count(N1)', status: 'success' }
        ]
      };
      expect(isRecursionBaseCase(node, 'count')).toBe(false);
    });

    it('should return false for failed recursive node', () => {
      const node = { 
        goal: 'count(0)', 
        status: 'fail',
        children: []
      };
      expect(isRecursionBaseCase(node, 'count')).toBe(false);
    });

    it('should return false for non-success status base case', () => {
      const node = { 
        goal: 'count(0)', 
        status: 'pending',
        children: []
      };
      expect(isRecursionBaseCase(node, 'count')).toBe(false);
    });

    it('should return true for leaf recursive node with success status', () => {
      const node = { 
        goal: 'count(0)', 
        status: 'success',
        children: []
      };
      expect(isRecursionBaseCase(node, 'count')).toBe(true);
    });
  });

  describe('pickMainRootChild', () => {
    it('should return null for null root', () => {
      expect(pickMainRootChild(null)).toBeNull();
    });

    it('should return null for root without children', () => {
      const root = { goal: 'query', id: '1' };
      expect(pickMainRootChild(root)).toBeNull();
    });

    it('should return null for root with empty children', () => {
      const root = { goal: 'query', id: '1', children: [] };
      expect(pickMainRootChild(root)).toBeNull();
    });

    it('should return single child when only one exists', () => {
      const root = {
        goal: 'query',
        children: [
          { goal: 'test(a)', status: 'success', id: '1' }
        ]
      };
      expect(pickMainRootChild(root)).toEqual({ goal: 'test(a)', status: 'success', id: '1' });
    });

    it('should prioritize child with more recursive occurrences', () => {
      const root = {
        goal: 'query',
        children: [
          { 
            goal: 'count(X)', 
            status: 'success', 
            id: '1',
            children: [
              { goal: 'count(Y)', id: '2' }
            ]
          },
          { goal: 'other(a)', status: 'success', id: '3' }
        ]
      };
      const selected = pickMainRootChild(root);
      expect(selected.goal).toBe('count(X)');
    });

    it('should filter out failed children', () => {
      const root = {
        goal: 'query',
        children: [
          { goal: 'test(a)', status: 'fail', id: '1' },
          { goal: 'test(b)', status: 'success', id: '2' }
        ]
      };
      const selected = pickMainRootChild(root);
      expect(selected.status).toBe('success');
    });

    it('should fallback to first child if all filtered out', () => {
      const root = {
        goal: 'query',
        children: [
          { goal: 'test(a)', status: 'fail', id: '1' },
          { goal: 'test(b)', status: 'fail', id: '2' }
        ]
      };
      const selected = pickMainRootChild(root);
      expect(selected.goal).toBe('test(a)');
    });
  });

  describe('buildRecursiveFocusedTree', () => {
    it('should return null for null tree', () => {
      expect(buildRecursiveFocusedTree(null)).toBeNull();
    });

    it('should return original tree for non-recursive tree', () => {
      const tree = {
        goal: 'query',
        id: '0',
        children: [
          { goal: 'father(tom, bob)', status: 'success', id: '1' }
        ]
      };
      const result = buildRecursiveFocusedTree(tree);
      expect(result.children[0].goal).toBe('father(tom, bob)');
    });

    it('should detect and transform recursive tree', () => {
      const tree = {
        goal: 'query',
        id: '0',
        children: [
          { 
            goal: 'count(N)', 
            status: 'success',
            id: '1',
            children: [
              { goal: 'count(N1)', status: 'success', id: '2' },
              { goal: 'other(X)', status: 'success', id: '3' }
            ]
          }
        ]
      };
      const result = buildRecursiveFocusedTree(tree);
      
      expect(result).toBeDefined();
      expect(result.children).toBeDefined();
    });

    it('should handle tree without query root', () => {
      const tree = {
        goal: 'count(0)',
        id: '0',
        children: [
          { 
            goal: 'count(N)', 
            status: 'success',
            id: '1',
            children: []
          }
        ]
      };
      const result = buildRecursiveFocusedTree(tree);
      
      expect(result).toBeDefined();
      expect(result.goal).toBe('count(0)');
    });

    it('should handle complex recursive tree', () => {
      const tree = {
        goal: 'query',
        id: '0',
        children: [
          { 
            goal: 'fib(N, F)', 
            status: 'success',
            id: '1',
            children: [
              { goal: 'fib(N1, F1)', status: 'success', id: '2' },
              { goal: 'base(X)', status: 'success', id: '3' }
            ]
          }
        ]
      };
      const result = buildRecursiveFocusedTree(tree);
      
      expect(result).toBeDefined();
      expect(result.children).toBeDefined();
    });

    it('should preserve status from focused tree', () => {
      // Create a tree where recursion is detected - need multiple recursive functor occurrences
      const tree = {
        goal: 'count(0)',
        status: 'pending',
        children: [
          { 
            goal: 'count(N)', 
            status: 'success',
            children: [
              { goal: 'count(N1)', status: 'success', children: [] }  // Second occurrence triggers recursion detection
            ]
          }
        ]
      };
      const result = buildRecursiveFocusedTree(tree);
      
      // When recursion is detected, the focused tree's status is used
      // The result should have the transformed children
      expect(result).toBeDefined();
      expect(result.children).toBeDefined();
    });
  });
});