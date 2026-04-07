/**
 * Tree search utilities for Prolog-Tutor
 * Pure functions for searching nodes in execution trees
 */

/**
 * Search for nodes matching a term in a tree
 * @param {object|null} node - Tree node
 * @param {string} searchTerm - Search term
 * @param {Set<string>} results - Set of matching node IDs
 * @returns {Set<string>} Set of matching node IDs
 */
export const searchInTree = (node, searchTerm, results = new Set()) => {
  if (!node || !searchTerm) return results;

  const term = searchTerm.toLowerCase();
  const nodeId = node.id || node.goal || '';

  if (
    nodeId.toLowerCase().includes(term) ||
    (node.status && node.status.toLowerCase().includes(term))
  ) {
    results.add(nodeId);
  }

  if (node.children) {
    node.children.forEach(child => {
      searchInTree(child, searchTerm, results);
    });
  }

  return results;
};

/**
 * Find a node by ID in a tree
 * @param {object|null} node - Tree node
 * @param {string} id - Node ID to find
 * @returns {object|null} Found node or null
 */
export const findNodeById = (node, id) => {
  if (!node) return null;
  if (node.id === id) return node;

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Get all leaf nodes in a tree
 * @param {object|null} node - Tree node
 * @param {Array<object>} leaves - Accumulator
 * @returns {Array<object>} Array of leaf nodes
 */
export const getLeafNodes = (node, leaves = []) => {
  if (!node) return leaves;

  if (!node.children || node.children.length === 0) {
    leaves.push(node);
  } else {
    node.children.forEach(child => {
      getLeafNodes(child, leaves);
    });
  }

  return leaves;
};

/**
 * Get all nodes at a specific depth
 * @param {object|null} node - Tree node
 * @param {number} targetDepth - Target depth level
 * @param {number} currentDepth - Current depth
 * @param {Array<object>} nodes - Accumulator
 * @returns {Array<object>} Array of nodes at target depth
 */
export const getNodesAtDepth = (node, targetDepth, currentDepth = 0, nodes = []) => {
  if (!node) return nodes;

  if (currentDepth === targetDepth) {
    nodes.push(node);
  } else if (currentDepth < targetDepth && node.children) {
    node.children.forEach(child => {
      getNodesAtDepth(child, targetDepth, currentDepth + 1, nodes);
    });
  }

  return nodes;
};
