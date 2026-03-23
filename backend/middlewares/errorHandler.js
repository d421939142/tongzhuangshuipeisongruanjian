const logger = require('../config/logger');

/**
 * 统一错误处理中间件
 */
function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // 默认500错误
  let statusCode = 500;
  let message = '服务器内部错误';

  // 根据错误类型设置状态码和消息
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '禁止访问';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    code: statusCode,
    data: null
  });
}

module.exports = errorHandler;
