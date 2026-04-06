/**
 * Execute Controller for Prolog-Tutor
 * Handles request/response for the execute endpoint
 */

const logger = require('../config/logger');
const { validateRuntimeFiles } = require('../middleware/validation');
const executionConstants = require('../constants/execution');
const serverConstants = require('../constants/server');

/**
 * Create an execute controller with injected service
 * @param {QueryService} queryService - Query service instance
 * @returns {Function} Express request handler
 */
function createExecuteController(queryService) {
  return async (req, res) => {
    const { code, query, input = '', runtimeFiles = [] } = req.body;

    // Additional validation beyond Joi schema
    if (code.length > executionConstants.MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Code exceeds maximum length of ${executionConstants.MAX_CODE_LENGTH} characters`
      });
    }

    if (query.length > executionConstants.MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Query exceeds maximum length of ${executionConstants.MAX_QUERY_LENGTH} characters`
      });
    }

    if (input.length > executionConstants.MAX_INPUT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Input exceeds maximum length of ${executionConstants.MAX_INPUT_LENGTH} characters`
      });
    }

    // Validate runtime files
    const runtimeValidation = validateRuntimeFiles(runtimeFiles);
    if (!runtimeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid runtime files',
        details: runtimeValidation.errors
      });
    }

    try {
      const result = await queryService.executeQuery({ code, query, input, runtimeFiles });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Query execution failed', {
        error: error.message,
        code: code.substring(0, serverConstants.MAX_ERROR_SNIPPET_LENGTH),
        query: query.substring(0, serverConstants.MAX_ERROR_SNIPPET_LENGTH)
      });

      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (error.message.includes('timeout')) {
        statusCode = 408;
        errorMessage = 'Query execution timeout';
      } else if (error.message.includes('File size exceeds')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('Prolog execution failed') || error.message.includes('Prolog runtime error')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

module.exports = { createExecuteController };
