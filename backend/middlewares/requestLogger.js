const logger = require('../config/logger');

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // 记录请求
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

module.exports = requestLogger;
