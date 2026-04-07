/**
 * Tree utilities - Re-export all tree utility modules
 * Organized for easy importing and testing
 */

// Tree traversal utilities
export {
  countNodes,
  getMaxDepth,
  countNodesByStatus,
  getTreeStats,
} from './treeTraversal.js';

// Recursion detection utilities
export {
  extractFunctor,
  countFunctorOccurrences,
  detectRecursionFunctor,
  isRecursionBaseCase,
  pickMainRootChild,
  buildRecursiveFocusedTree,
} from './recursionDetection.js';

// Tree search utilities
export {
  searchInTree,
  findNodeById,
  getLeafNodes,
  getNodesAtDepth,
} from './treeSearch.js';

// Default export for convenience
export * from './treeTraversal.js';
export * from './recursionDetection.js';
export * from './treeSearch.js';