const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const logger = require('../config/logger');

// 获取所有设置
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const settings = db.prepare('SELECT * FROM settings').all();

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    Response.success(res, settingsObj, '获取设置成功');
  } catch (error) {
    logger.error('Failed to get settings:', error);
    Response.serverError(res, '获取设置失败');
  }
});

// 获取单个设置
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const db = require('../config/database');

    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (!setting) {
      return Response.notFound(res, '设置不存在');
    }

    Response.success(res, setting.value, '获取设置成功');
  } catch (error) {
    logger.error('Failed to get setting:', error);
    Response.serverError(res, '获取设置失败');
  }
});

// 更新设置
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const db = require('../config/database');

    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (existing) {
      db.prepare(`
        UPDATE settings
        SET value = ?, updateTime = CURRENT_TIMESTAMP
        WHERE key = ?
      `).run(value, key);
    } else {
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
      `).run(key, value);
    }

    logger.info('Setting updated', { key, value });
    Response.success(res, value, '更新设置成功');
  } catch (error) {
    logger.error('Failed to update setting:', error);
    Response.serverError(res, '更新设置失败');
  }
});

// 批量更新设置
router.post('/', (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return Response.error(res, '设置数据格式错误', 400);
    }

    const db = require('../config/database');

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
        if (existing) {
          db.prepare('UPDATE settings SET value = ?, updateTime = CURRENT_TIMESTAMP WHERE key = ?')
            .run(String(value), key);
        } else {
          db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
            .run(key, String(value));
        }
      }
    });

    transaction();

    logger.info('Settings batch updated', Object.keys(settings));
    Response.success(res, settings, '批量更新设置成功');
  } catch (error) {
    logger.error('Failed to batch update settings:', error);
    Response.serverError(res, '批量更新设置失败');
  }
});

module.exports = router;
