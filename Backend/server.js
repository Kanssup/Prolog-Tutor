/**
 * Prolog-Tutor Server Entry Point
 * 
 * This file bootstraps the application, initializing all services,
 * middleware, and routes, then starts the HTTP server.
 */

const express = require('express');
const path = require('path');

// Load environment first
require('fs').existsSync(path.join(__dirname, '.env')) && require('./.env');

// Import configuration
const {
  DEFAULT_PORT,
  DEFAULT_POOL_SIZE,
  DEFAULT_CACHE_MAX_SIZE,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_ERROR,
  HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE
} = require('./src/constants');
const logger = require('./src/config/logger');

// Import service classes (not instances)
const { QueryService, HealthCheckService, StatsService } = require('./src/services');

// Import route creators
const {
  createHealthRoutes,
  createExecuteRoutes,
  createStatsRoutes,
  createKnowledgeBaseRoutes
} = require('./src/routes');

// Import middleware
const { 
  applySecurityMiddleware, 
  defaultLimiter, 
  requestLogger 
} = require('./src/middleware');

// Import core services (instances)
const TempFileManager = require('./fileManager');
const PrologProcessPool = require('./prologPool');
const QueryCache = require('./queryCache');

/**
 * Create and configure the Express application
 * @param {Object} options - Configuration options
 * @returns {Object} App instance with app, server, and services
 */
function createApp(options = {}) {
  const {
    port = process.env.PORT || DEFAULT_PORT,
    poolSize = parseInt(process.env.POOL_SIZE) || DEFAULT_POOL_SIZE,
    cacheMaxSize = parseInt(process.env.CACHE_MAX_SIZE) || DEFAULT_CACHE_MAX_SIZE
  } = options;

  // Initialize core services (singletons)
  const fileManager = new TempFileManager();
  const processPool = new PrologProcessPool({ poolSize });
  const queryCache = new QueryCache({ maxSize: cacheMaxSize });

  // Initialize application services with dependency injection
  const queryService = new QueryService({
    processPool,
    fileManager,
    queryCache
  });

  const healthCheckService = new HealthCheckService({
    fileManager,
    processPool,
    queryCache
  });

  const statsService = new StatsService({
    fileManager,
    processPool,
    queryCache
  });

  // Create Express app
  const app = express();

  // Apply security middleware
  applySecurityMiddleware(app);

  // Apply request logging
  app.use(requestLogger);

  // Apply default rate limiter to /api routes
  app.use('/api/', defaultLimiter);

  // Mount routes
  app.use('/api/health', createHealthRoutes(healthCheckService));
  app.use('/api/execute', createExecuteRoutes(queryService));
  app.use('/api/stats', createStatsRoutes(statsService));
  app.use('/api/knowledge-bases', createKnowledgeBaseRoutes());

  // Not found handler
  app.use((req, res) => {
    res.status(HTTP_STATUS_NOT_FOUND).json({
      success: false,
      error: 'Endpoint not found'
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path
    });
    
    res.status(HTTP_STATUS_INTERNAL_ERROR).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start server
  const server = app.listen(port, () => {
    logger.info(`Prolog Tutor backend running on http://localhost:${port}`);
    logger.info(`Process pool initialized with ${processPool.getStats().processesByStatus.total} processes`);
    logger.info(`File manager ready in ${fileManager.getStats().tempDir}`);
    logger.info(`Query cache ready (max ${queryCache.getStats().maxSize} entries)`);
  });

  // Graceful shutdown
  function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    const shutdownPromises = [
      fileManager.shutdown(),
      processPool.drain(),
      queryCache.shutdown()
    ];

    Promise.allSettled(shutdownPromises)
      .then(() => {
        logger.info('All services stopped');
        process.exit(0);
      })
      .catch(error => {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle server errors
  server.on('error', (error) => {
    logger.error('Server error', { error: error.message, code: error.code });
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
    }
  });

  return {
    app,
    server,
    services: {
      fileManager,
      processPool,
      queryCache,
      queryService,
      healthCheckService,
      statsService
    }
  };
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!require('fs').existsSync(logsDir)) {
  require('fs').mkdirSync(logsDir, { recursive: true });
}

// Start server if run directly
if (require.main === module) {
  createApp();
}

// Export for testing
module.exports = { createApp };
