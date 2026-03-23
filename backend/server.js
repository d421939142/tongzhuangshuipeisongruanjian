const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./config/logger');
const { initDatabase } = require('./database/schema');
const errorHandler = require('./middlewares/errorHandler');
const apiKeyAuth = require('./middlewares/apiKeyAuth');
const requestLogger = require('./middlewares/requestLogger');

const app = express();

// 初始化数据库
try {
  initDatabase();
} catch (error) {
  logger.error('Failed to initialize database, exiting...');
  process.exit(1);
}

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);

// 健康检查接口（不需要API密钥）
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API路由（需要API密钥）
app.use('/api', apiKeyAuth, require('./routes/index'));

// 错误处理中间件
app.use(errorHandler);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在',
    code: 404,
    data: null
  });
});

// 启动服务器
app.listen(config.port, config.host, () => {
  logger.info(`Server is running on http://${config.host}:${config.port}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
