const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'water-delivery.db');

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 启用WAL模式提高性能
db.pragma('journal_mode = WAL');

module.exports = db;
