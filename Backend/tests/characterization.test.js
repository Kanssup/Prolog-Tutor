/**
 * Characterization Tests for Prolog-Tutor Backend
 * 
 * These tests validate the EXACT current behavior of endpoints to ensure
 * the refactor doesn't introduce regressions.
 */

const request = require('supertest');

// Import the raw app setup without starting server
const express = require('express');
const rateLimit = require('express-rate-limit');

// Import services
const TempFileManager = require('../fileManager');
const PrologProcessPool = require('../prologPool');
const QueryCache = require('../queryCache');

// Import service classes
const { QueryService, HealthCheckService, StatsService } = require('../src/services');

// Import middleware
const { applySecurityMiddleware, requestLogger } = require('../src/middleware');

// Import route creators
const { createHealthRoutes, createExecuteRoutes, createStatsRoutes, createKnowledgeBaseRoutes } = require('../src/routes');

describe('Prolog-Tutor Backend Characterization Tests', () => {
  let app;
  let server;
  let fileManager, processPool, queryCache;
  let queryService, healthCheckService, statsService;

  beforeAll((done) => {
    // Initialize services
    fileManager = new TempFileManager();
    processPool = new PrologProcessPool({ poolSize: 2 });
    queryCache = new QueryCache({ maxSize: 50 });

    // Initialize app services
    queryService = new QueryService({ processPool, fileManager, queryCache });
    healthCheckService = new HealthCheckService({ fileManager, processPool, queryCache });
    statsService = new StatsService({ fileManager, processPool, queryCache });

    // Create Express app
    app = express();
    applySecurityMiddleware(app);
    app.use(requestLogger);

    // Apply rate limiter to API routes
    app.use('/api/', rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, error: 'Too many requests' }
    }));

    // Mount routes
    app.use('/api/health', createHealthRoutes(healthCheckService));
    app.use('/api/execute', createExecuteRoutes(queryService));
    app.use('/api/stats', createStatsRoutes(statsService));
    app.use('/api/knowledge-bases', createKnowledgeBaseRoutes());

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ success: false, error: 'Endpoint not found' });
    });

    server = app.listen(0, done); // Port 0 = random available port
  });

  afterAll(async () => {
    await fileManager.shutdown();
    await processPool.drain();
    await queryCache.shutdown();
    await new Promise(resolve => server.close(resolve));
  });

  describe('GET /api/health', () => {
    it('should return 200 with status healthy', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(response.body.services.fileManager).toBeDefined();
      expect(response.body.services.processPool).toBeDefined();
      expect(response.body.services.queryCache).toBeDefined();
    });

    it('should return service statistics', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.services.fileManager.totalFiles).toBeDefined();
      expect(response.body.services.fileManager.tempDir).toBeDefined();
      expect(response.body.services.processPool.processesByStatus).toBeDefined();
      expect(response.body.services.queryCache.entries).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('should return comprehensive statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);
      
      expect(response.body.fileManager).toBeDefined();
      expect(response.body.processPool).toBeDefined();
      expect(response.body.queryCache).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('POST /api/execute', () => {
    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({ query: 'member(a, [a,b,c]).' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({ code: 'member(X, [a,b,c]).' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.details).toBeDefined();
    });

    it('should execute a simple Prolog query successfully', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          code: 'member(X, [a, b, c]).',
          query: 'member(X, [a, b, c]).'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tree).toBeDefined();
      expect(Array.isArray(response.body.tree)).toBe(true);
      expect(response.body.executionTime).toBeDefined();
    }, 30000);

    it('should execute a true query successfully', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          code: 'parent(tom, bob).',
          query: 'parent(tom, bob).'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tree).toBeDefined();
    }, 30000);
  });

  describe('POST /api/knowledge-bases', () => {
    it('should return 501 not implemented', async () => {
      const response = await request(app)
        .post('/api/knowledge-bases')
        .send({})
        .expect(501);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not implemented yet');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });
  });
});
