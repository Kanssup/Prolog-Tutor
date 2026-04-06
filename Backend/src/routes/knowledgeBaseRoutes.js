/**
 * Knowledge Base Routes for Prolog-Tutor
 */

const express = require('express');
const { createKnowledgeBaseController } = require('../controllers/knowledgeBaseController');

/**
 * Create knowledge base routes
 * @returns {express.Router} Express router
 */
function createKnowledgeBaseRoutes() {
  const router = express.Router();
  const kbController = createKnowledgeBaseController();

  // POST /api/knowledge-bases
  router.post('/', kbController.create);

  // GET /api/knowledge-bases
  router.get('/', kbController.list);

  // GET /api/knowledge-bases/:id
  router.get('/:id', kbController.get);

  // PUT /api/knowledge-bases/:id
  router.put('/:id', kbController.update);

  // DELETE /api/knowledge-bases/:id
  router.delete('/:id', kbController.delete);

  return router;
}

module.exports = createKnowledgeBaseRoutes;
