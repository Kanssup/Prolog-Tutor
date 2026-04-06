/**
 * Index file for controller modules
 */
const { createExecuteController } = require('./executeController');
const { createHealthController } = require('./healthController');
const { createStatsController } = require('./statsController');
const { createKnowledgeBaseController } = require('./knowledgeBaseController');

module.exports = {
  createExecuteController,
  createHealthController,
  createStatsController,
  createKnowledgeBaseController
};
