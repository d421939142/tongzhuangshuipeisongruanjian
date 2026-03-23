const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const Validator = require('../utils/validator');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// 获取送水工列表
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const deliverymen = db.prepare(`
      SELECT * FROM deliverymen
      ORDER BY createTime DESC
    `).all();

    Response.success(res, deliverymen, '获取送水工列表成功');
  } catch (error) {
    logger.error('Failed to get deliverymen:', error);
    Response.serverError(res, '获取送水工列表失败');
  }
});

// 获取送水工详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const deliveryman = db.prepare('SELECT * FROM deliverymen WHERE id = ?').get(id);
    if (!deliveryman) {
      throw new NotFoundError('送水工不存在');
    }

    Response.success(res, deliveryman, '获取送水工详情成功');
  } catch (error) {
    logger.error('Failed to get deliveryman:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '获取送水工详情失败');
    }
  }
});

// 创建送水工
router.post('/', (req, res) => {
  try {
    const { name, phone, status = 'active' } = req.body;

    Validator.required(name, '送水工姓名');
    Validator.required(phone, '电话');
    Validator.phone(phone);
    Validator.enum(status, '状态', ['active', 'inactive']);

    const db = require('../config/database');

    // 检查电话是否已存在
    const existing = db.prepare('SELECT id FROM deliverymen WHERE phone = ?').get(phone);
    if (existing) {
      return Response.error(res, '该电话号码已存在', 400);
    }

    const insert = db.prepare(`
      INSERT INTO deliverymen (name, phone, status)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(name, phone, status);

    const deliveryman = db.prepare('SELECT * FROM deliverymen WHERE id = ?').get(result.lastInsertRowid);

    logger.info('Deliveryman created', { deliverymanId: deliveryman.id, name });
    Response.created(res, deliveryman, '创建送水工成功');
  } catch (error) {
    logger.error('Failed to create deliveryman:', error);
    if (error.message.includes('不能为空') || error.message.includes('格式不正确')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '创建送水工失败');
    }
  }
});

// 更新送水工
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, status } = req.body;

    if (name !== undefined) Validator.required(name, '送水工姓名');
    if (phone !== undefined) {
      Validator.phone(phone);
      // 检查电话是否被其他送水工使用
      const db = require('../config/database');
      const existing = db.prepare('SELECT id FROM deliverymen WHERE phone = ? AND id != ?').get(phone, id);
      if (existing) {
        return Response.error(res, '该电话号码已存在', 400);
      }
    }
    if (status !== undefined) {
      Validator.enum(status, '状态', ['active', 'inactive']);
    }

    const db = require('../config/database');

    const deliveryman = db.prepare('SELECT id FROM deliverymen WHERE id = ?').get(id);
    if (!deliveryman) {
      throw new NotFoundError('送水工不存在');
    }

    const update = db.prepare(`
      UPDATE deliverymen
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status),
          updateTime = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(name, phone, status, id);

    const updatedDeliveryman = db.prepare('SELECT * FROM deliverymen WHERE id = ?').get(id);

    logger.info('Deliveryman updated', { deliverymanId: id });
    Response.success(res, updatedDeliveryman, '更新送水工成功');
  } catch (error) {
    logger.error('Failed to update deliveryman:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('格式不正确')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '更新送水工失败');
    }
  }
});

// 删除送水工
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const deliveryman = db.prepare('SELECT id FROM deliverymen WHERE id = ?').get(id);
    if (!deliveryman) {
      throw new NotFoundError('送水工不存在');
    }

    // 检查是否有未完成的订单
    const orderCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE deliverymanId = ? AND status IN ('assigned', 'delivering')
    `).get(id);

    if (orderCount.count > 0) {
      return Response.error(res, '该送水工有未完成的订单，无法删除', 400);
    }

    // 删除送水工
    const del = db.prepare('DELETE FROM deliverymen WHERE id = ?');
    del.run(id);

    logger.info('Deliveryman deleted', { deliverymanId: id });
    Response.success(res, null, '删除送水工成功');
  } catch (error) {
    logger.error('Failed to delete deliveryman:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '删除送水工失败');
    }
  }
});

module.exports = router;
