const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const Validator = require('../utils/validator');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// 获取收款列表
router.get('/', (req, res) => {
  try {
    const { customerId } = req.query;
    const db = require('../config/database');

    let query = `
      SELECT
        p.*,
        c.name as customerName,
        c.phone as customerPhone,
        o.orderNumber
      FROM payments p
      LEFT JOIN customers c ON p.customerId = c.id
      LEFT JOIN orders o ON p.orderId = o.id
      WHERE 1=1
    `;

    const params = [];
    if (customerId) {
      query += ' AND p.customerId = ?';
      params.push(customerId);
    }

    query += ' ORDER BY p.createTime DESC';

    const payments = db.prepare(query).all(...params);

    Response.success(res, payments, '获取收款列表成功');
  } catch (error) {
    logger.error('Failed to get payments:', error);
    Response.serverError(res, '获取收款列表失败');
  }
});

// 获取收款详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const payment = db.prepare(`
      SELECT
        p.*,
        c.name as customerName,
        c.phone as customerPhone,
        o.orderNumber
      FROM payments p
      LEFT JOIN customers c ON p.customerId = c.id
      LEFT JOIN orders o ON p.orderId = o.id
      WHERE p.id = ?
    `).get(id);

    if (!payment) {
      throw new NotFoundError('收款记录不存在');
    }

    Response.success(res, payment, '获取收款详情成功');
  } catch (error) {
    logger.error('Failed to get payment:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '获取收款详情失败');
    }
  }
});

// 创建收款
router.post('/', (req, res) => {
  try {
    const { customerId, orderId, amount, paymentMethod, notes } = req.body;

    Validator.required(customerId, '客户ID');
    Validator.number(amount, '金额', 0);

    const db = require('../config/database');

    // 检查客户是否存在
    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      throw new NotFoundError('客户不存在');
    }

    const insert = db.prepare(`
      INSERT INTO payments (customerId, orderId, amount, paymentMethod, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(customerId, orderId, amount, paymentMethod || '现金', notes);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);

    logger.info('Payment created', { paymentId: payment.id, customerId });
    Response.created(res, payment, '创建收款成功');
  } catch (error) {
    logger.error('Failed to create payment:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('必须是')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '创建收款失败');
    }
  }
});

// 删除收款
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const payment = db.prepare('SELECT id FROM payments WHERE id = ?').get(id);
    if (!payment) {
      throw new NotFoundError('收款记录不存在');
    }

    const del = db.prepare('DELETE FROM payments WHERE id = ?');
    del.run(id);

    logger.info('Payment deleted', { paymentId: id });
    Response.success(res, null, '删除收款成功');
  } catch (error) {
    logger.error('Failed to delete payment:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '删除收款失败');
    }
  }
});

module.exports = router;
