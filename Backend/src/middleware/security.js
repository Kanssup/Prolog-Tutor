/**
 * Security Middleware for Prolog-Tutor
 * Helmet, CORS, Compression, JSON Parser
 */

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const express = require('express');
const serverConstants = require('../constants/server');

/**
 * Apply security middleware to Express app
 * @param {Express.Application} app - Express application
 */
function applySecurityMiddleware(app) {
  // Security headers
  app.use(helmet());
  
  // CORS
  app.use(cors({
    origin: serverConstants.CORS_ORIGIN,
    credentials: true
  }));
  
  // Response compression
  app.use(compression());
  
  // JSON body parser with size limit
  app.use(express.json({ 
    limit: serverConstants.JSON_BODY_LIMIT 
  }));
}

module.exports = {
  applySecurityMiddleware
};
