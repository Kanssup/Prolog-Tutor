/**
 * Index file for route modules
 */
const createHealthRoutes = require('./healthRoutes');
const createExecuteRoutes = require('./executeRoutes');
const createStatsRoutes = require('./statsRoutes');
const createKnowledgeBaseRoutes = require('./knowledgeBaseRoutes');

module.exports = {
  createHealthRoutes,
  createExecuteRoutes,
  createStatsRoutes,
  createKnowledgeBaseRoutes
};
