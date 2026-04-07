/**
 * Tree traversal utilities for Prolog-Tutor
 * Pure functions for counting nodes, depth, and status analysis
 */

/**
 * Count total nodes in a tree
 * @param {object|null} node - Tree node
 * @returns {number} Total node count
 */
export const countNodes = (node) => {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
};

/**
 * Get maximum depth of a tree
 * @param {object|null} node - Tree node
 * @param {number} currentDepth - Current depth level
 * @returns {number} Maximum depth
 */
export const getMaxDepth = (node, currentDepth = 0) => {
  if (!node) return currentDepth;
  let maxDepth = currentDepth;
  if (node.children) {
    node.children.forEach(child => {
      const childDepth = getMaxDepth(child, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    });
  }
  return maxDepth;
};

/**
 * Count nodes by status (success, fail, pending)
 * @param {object|null} node - Tree node
 * @param {string} status - Status to count ('success', 'fail', 'pending')
 * @param {number} count - Accumulator
 * @returns {number} Count of nodes with given status
 */
export const countNodesByStatus = (node, status, count = 0) => {
  if (!node) return count;
  if (node.status === status) {
    count++;
  }
  if (node.children) {
    node.children.forEach(child => {
      count = countNodesByStatus(child, status, count);
    });
  }
  return count;
};

/**
 * Get tree statistics summary
 * @param {object|null} tree - Root tree node
 * @returns {object} Statistics object
 */
export const getTreeStats = (tree) => {
  if (!tree) return { total: 0, depth: 0, success: 0, fail: 0, pending: 0 };
  return {
    total: countNodes(tree),
    depth: getMaxDepth(tree),
    success: countNodesByStatus(tree, 'success'),
    fail: countNodesByStatus(tree, 'fail'),
    pending: countNodesByStatus(tree, 'pending'),
  };
};
