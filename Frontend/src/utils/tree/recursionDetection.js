/**
 * Recursion detection utilities for Prolog execution trees
 * Pure functions for analyzing recursive predicate patterns
 */

import { countNodes } from './treeTraversal.js';

/**
 * Extract functor name from a goal string
 * @param {string} goal - Prolog goal (e.g., "parent(tom, bob)")
 * @returns {string|null} Functor name or null
 */
export const extractFunctor = (goal = '') => {
  const trimmed = String(goal).trim();
  const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

/**
 * Count occurrences of a functor in a tree
 * @param {object|null} node - Tree node
 * @param {string} functor - Functor name to count
 * @returns {number} Occurrence count
 */
export const countFunctorOccurrences = (node, functor) => {
  if (!node || !functor) return 0;

  let total = extractFunctor(node.goal) === functor ? 1 : 0;
  if (node.children) {
    node.children.forEach((child) => {
      total += countFunctorOccurrences(child, functor);
    });
  }
  return total;
};

/**
 * Detect if a tree contains recursive calls
 * @param {object|null} node - Root tree node
 * @returns {string|null} Recursive functor name or null
 */
export const detectRecursionFunctor = (node) => {
  if (!node) return null;

  const root = node.goal === 'query' && node.children?.length ? node.children[0] : node;
  const candidate = extractFunctor(root.goal);
  if (!candidate) return null;

  return countFunctorOccurrences(root, candidate) > 1 ? candidate : null;
};

/**
 * Check if a node is a base case of recursion
 * @param {object} node - Tree node
 * @param {string} recursionFunctor - The recursive functor
 * @returns {boolean} True if base case
 */
export const isRecursionBaseCase = (node, recursionFunctor) => {
  if (!recursionFunctor || extractFunctor(node.goal) !== recursionFunctor) return false;

  const hasRecursiveChild = (node.children || []).some(
    (child) => extractFunctor(child.goal) === recursionFunctor
  );

  return !hasRecursiveChild && node.status === 'success';
};

/**
 * Pick the main child from a root node (for tree focus)
 * @param {object|null} root - Root node
 * @returns {object|null} Main child node
 */
export const pickMainRootChild = (root) => {
  if (!root?.children?.length) return null;

  const ranked = root.children
    .filter((child) => child.status !== 'fail')
    .map((child) => {
      const functor = extractFunctor(child.goal);
      const recursiveScore = functor ? countFunctorOccurrences(child, functor) * 5 : 0;
      return {
        child,
        score: countNodes(child) + recursiveScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.child || root.children[0];
};

/**
 * Build a focused tree that highlights recursive structure
 * @param {object|null} tree - Full tree
 * @returns {object|null} Focused tree
 */
export const buildRecursiveFocusedTree = (tree) => {
  if (!tree) return null;

  const sourceRoot = tree.goal === 'query' ? pickMainRootChild(tree) : tree;
  if (!sourceRoot) return tree;

  const functor = detectRecursionFunctor(sourceRoot);
  if (!functor) return tree;

  const transform = (node) => {
    const children = node.children || [];
    const recursiveChildren = children.filter((child) => extractFunctor(child.goal) === functor);
    const mainRecursiveChild = recursiveChildren[0] || null;

    const sideSteps = children.filter(
      (child) => child !== mainRecursiveChild && child.status !== 'fail'
    );

    const newChildren = [...sideSteps];
    if (mainRecursiveChild) {
      newChildren.push(transform(mainRecursiveChild));
    }

    return {
      ...node,
      children: newChildren,
    };
  };

  const focusedRoot = transform(sourceRoot);

  if (tree.goal === 'query') {
    return {
      ...tree,
      children: [focusedRoot],
      status: focusedRoot.status,
    };
  }

  return focusedRoot;
};
