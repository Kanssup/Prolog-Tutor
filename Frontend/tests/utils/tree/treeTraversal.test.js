/**
 * Tests for tree traversal utilities
 * Pure functions for counting nodes, depth, and status analysis
 */

import { describe, it, expect } from 'vitest';
import { countNodes, getMaxDepth, countNodesByStatus, getTreeStats } from '../../../src/utils/tree/treeTraversal';

describe('treeTraversal.js', () => {
  describe('countNodes', () => {
    it('should return 0 for null node', () => {
      expect(countNodes(null)).toBe(0);
    });

    it('should return 0 for undefined node', () => {
      expect(countNodes(undefined)).toBe(0);
    });

    it('should return 1 for single node without children', () => {
      const node = { id: '1', goal: 'parent(tom, bob)', status: 'success' };
      expect(countNodes(node)).toBe(1);
    });

    it('should count root plus all children recursively', () => {
      const tree = {
        id: '1',
        goal: 'query',
        children: [
          { id: '2', goal: 'parent(tom, bob)', status: 'success' },
          { 
            id: '3', 
            goal: 'parent(bob, alice)', 
            status: 'success',
            children: [
              { id: '4', goal: 'female(alice)', status: 'success' }
            ]
          }
        ]
      };
      expect(countNodes(tree)).toBe(4);
    });

    it('should handle deeply nested tree', () => {
      // Create a linked list style tree
      let node = { id: '1', goal: 'p(a)', status: 'success' };
      for (let i = 2; i <= 10; i++) {
        node = { id: String(i), goal: `p(${String.fromCharCode(96 + i)})`, status: 'success', children: [node] };
      }
      expect(countNodes(node)).toBe(10);
    });

    it('should handle tree with no children array', () => {
      const node = { id: '1', goal: 'test', status: 'success' };
      expect(countNodes(node)).toBe(1);
    });

    it('should handle tree with empty children array', () => {
      const node = { id: '1', goal: 'test', status: 'success', children: [] };
      expect(countNodes(node)).toBe(1);
    });
  });

  describe('getMaxDepth', () => {
    it('should return 0 for null node', () => {
      expect(getMaxDepth(null)).toBe(0);
    });

    it('should return 0 for single node with default depth', () => {
      const node = { id: '1', goal: 'test', status: 'success' };
      expect(getMaxDepth(node)).toBe(0);
    });

    it('should return 1 for tree with one level of children', () => {
      const tree = {
        id: '1',
        goal: 'query',
        children: [
          { id: '2', goal: 'child1', status: 'success' },
          { id: '3', goal: 'child2', status: 'success' }
        ]
      };
      expect(getMaxDepth(tree)).toBe(1);
    });

    it('should return correct depth for balanced tree', () => {
      const tree = {
        id: '1',
        goal: 'query',
        children: [
          { 
            id: '2', 
            goal: 'p(a)',
            children: [
              { id: '4', goal: 'q(a)', children: [] },
              { id: '5', goal: 'q(b)', children: [] }
            ]
          },
          { id: '3', goal: 'p(b)', children: [] }
        ]
      };
      expect(getMaxDepth(tree)).toBe(2);
    });

    it('should return maximum depth for skewed tree (linked list)', () => {
      const tree = {
        id: '1',
        goal: 'p(a)',
        children: [
          {
            id: '2',
            goal: 'p(b)',
            children: [
              {
                id: '3',
                goal: 'p(c)',
                children: []
              }
            ]
          }
        ]
      };
      expect(getMaxDepth(tree)).toBe(2);
    });

    it('should handle nodes without children property', () => {
      const node = { id: '1', goal: 'test', status: 'success' };
      expect(getMaxDepth(node)).toBe(0);
    });
  });

  describe('countNodesByStatus', () => {
    it('should return 0 for null node', () => {
      expect(countNodesByStatus(null, 'success')).toBe(0);
    });

    it('should count success nodes', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'success',
        children: [
          { id: '2', goal: 'p(a)', status: 'success' },
          { id: '3', goal: 'p(b)', status: 'fail' }
        ]
      };
      expect(countNodesByStatus(tree, 'success')).toBe(2);
    });

    it('should count fail nodes', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'fail',
        children: [
          { id: '2', goal: 'p(a)', status: 'fail' },
          { id: '3', goal: 'p(b)', status: 'success' }
        ]
      };
      expect(countNodesByStatus(tree, 'fail')).toBe(2);
    });

    it('should count pending nodes', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'pending',
        children: [
          { id: '2', goal: 'p(a)', status: 'pending' },
          { id: '3', goal: 'p(b)', status: 'success' }
        ]
      };
      expect(countNodesByStatus(tree, 'pending')).toBe(2);
    });

    it('should return 0 for non-existent status', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'success',
        children: [
          { id: '2', goal: 'p(a)', status: 'success' }
        ]
      };
      expect(countNodesByStatus(tree, 'nonexistent')).toBe(0);
    });

    it('should handle deeply nested mixed statuses', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'success',
        children: [
          { 
            id: '2', 
            goal: 'p(a)', 
            status: 'success',
            children: [
              { id: '4', goal: 'q(a)', status: 'fail' },
              { id: '5', goal: 'r(a)', status: 'success' }
            ]
          },
          { id: '3', goal: 'p(b)', status: 'pending' }
        ]
      };
      expect(countNodesByStatus(tree, 'success')).toBe(3);
      expect(countNodesByStatus(tree, 'fail')).toBe(1);
      expect(countNodesByStatus(tree, 'pending')).toBe(1);
    });

    it('should count correctly with initial accumulator', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'success',
        children: [
          { id: '2', goal: 'p(a)', status: 'success' }
        ]
      };
      expect(countNodesByStatus(tree, 'success', 5)).toBe(7);
    });
  });

  describe('getTreeStats', () => {
    it('should return zero stats for null tree', () => {
      const stats = getTreeStats(null);
      expect(stats).toEqual({
        total: 0,
        depth: 0,
        success: 0,
        fail: 0,
        pending: 0
      });
    });

    it('should return zero stats for undefined tree', () => {
      const stats = getTreeStats(undefined);
      expect(stats.total).toBe(0);
      expect(stats.depth).toBe(0);
    });

    it('should return correct stats for single node', () => {
      const node = { id: '1', goal: 'test', status: 'success' };
      const stats = getTreeStats(node);
      
      expect(stats.total).toBe(1);
      expect(stats.depth).toBe(0);
      expect(stats.success).toBe(1);
      expect(stats.fail).toBe(0);
      expect(stats.pending).toBe(0);
    });

    it('should return correct stats for complex tree', () => {
      const tree = {
        id: '1',
        goal: 'query',
        status: 'success',
        children: [
          { 
            id: '2', 
            goal: 'p(a)', 
            status: 'success',
            children: [
              { id: '4', goal: 'q(a)', status: 'fail' },
              { id: '5', goal: 'r(a)', status: 'pending' }
            ]
          },
          { 
            id: '3', 
            goal: 'p(b)', 
            status: 'fail',
            children: [
              { id: '6', goal: 'q(b)', status: 'fail' }
            ]
          }
        ]
      };
      
      const stats = getTreeStats(tree);
      
      expect(stats.total).toBe(6);
      expect(stats.depth).toBe(2);
      expect(stats.success).toBe(2);
      expect(stats.fail).toBe(3);
      expect(stats.pending).toBe(1);
    });

    it('should handle tree without status property', () => {
      const node = { id: '1', goal: 'test' };
      const stats = getTreeStats(node);
      
      expect(stats.total).toBe(1);
      expect(stats.success).toBe(0);
      expect(stats.fail).toBe(0);
      expect(stats.pending).toBe(0);
    });
  });
});