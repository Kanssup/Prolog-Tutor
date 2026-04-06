/**
 * Index file for middleware modules
 */
const security = require('./security');
const rateLimit = require('./rateLimit');
const requestLogger = require('./requestLogger');
const validation = require('./validation');

module.exports = {
  ...security,
  ...rateLimit,
  ...requestLogger,
  ...validation
};
