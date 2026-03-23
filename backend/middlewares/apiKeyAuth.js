const config = require('../config');
const logger = require('../config/logger');

/**
 * API密钥验证中间件
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.body.key || req.query.key;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: '缺少API密钥',
      code: 401,
      data: null
    });
  }

  if (apiKey !== config.apiKey) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      success: false,
      message: 'API密钥无效',
      code: 401,
      data: null
    });
  }

  next();
}

module.exports = apiKeyAuth;
