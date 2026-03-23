const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const Validator = require('../utils/validator');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// 获取客户列表
router.get('/', (req, res) => {
  try {
    const { hidden } = req.query;
    const db = require('../config/database');

    let query = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM customer_addresses WHERE customerId = c.id) as addressCount,
        (SELECT COUNT(*) FROM customer_water_tickets WHERE customerId = c.id) as ticketCount
      FROM customers c
    `;

    const params = [];
    if (hidden !== undefined) {
      query += ' WHERE c.hidden = ?';
      params.push(hidden === 'true' ? 1 : 0);
    }

    query += ' ORDER BY c.createTime DESC';

    const customers = db.prepare(query).all(...params);

    Response.success(res, customers, '获取客户列表成功');
  } catch (error) {
    logger.error('Failed to get customers:', error);
    Response.serverError(res, '获取客户列表失败');
  }
});

// 获取客户详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      throw new NotFoundError('客户不存在');
    }

    // 获取地址
    const addresses = db.prepare(`
      SELECT * FROM customer_addresses
      WHERE customerId = ?
      ORDER BY isDefault DESC, createTime DESC
    `).all(id);

    // 获取水票
    const waterTickets = db.prepare(`
      SELECT * FROM customer_water_tickets
      WHERE customerId = ?
    `).all(id);

    // 获取定制价格
    const prices = db.prepare(`
      SELECT cp.*, p.brand, p.model
      FROM customer_prices cp
      LEFT JOIN products p ON cp.productId = p.id
      WHERE cp.customerId = ?
    `).all(id);

    Response.success(res, {
      ...customer,
      addresses,
      waterTickets,
      prices
    }, '获取客户详情成功');
  } catch (error) {
    logger.error('Failed to get customer:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '获取客户详情失败');
    }
  }
});

// 创建客户
router.post('/', (req, res) => {
  try {
    const { name, phone, wechat, type, notes, addresses, waterTickets, prices } = req.body;

    // 验证
    Validator.required(name, '客户姓名');
    if (phone) Validator.phone(phone);

    const db = require('../config/database');
    const transaction = db.transaction(() => {
      // 生成客户编号
      const maxCode = db.prepare('SELECT code FROM customers ORDER BY id DESC LIMIT 1').get();
      let code = '0001';
      if (maxCode) {
        const num = parseInt(maxCode.code) + 1;
        code = num.toString().padStart(4, '0');
      }

      // 插入客户
      const insert = db.prepare(`
        INSERT INTO customers (code, name, phone, wechat, type, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = insert.run(code, name, phone, wechat, type || '个人', notes);

      const customerId = result.lastInsertRowid;

      // 插入地址
      if (addresses && addresses.length > 0) {
        const insertAddress = db.prepare(`
          INSERT INTO customer_addresses (customerId, province, city, district, detailAddress, receiverName, receiverPhone, isDefault)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        addresses.forEach(addr => {
          insertAddress.run(
            customerId,
            addr.province || '',
            addr.city || '',
            addr.district || '',
            addr.detailAddress,
            addr.receiverName,
            addr.receiverPhone,
            addr.isDefault ? 1 : 0
          );
        });
      }

      // 插入水票
      if (waterTickets && waterTickets.length > 0) {
        const insertTicket = db.prepare(`
          INSERT INTO customer_water_tickets (customerId, productId, productName, quantity)
          VALUES (?, ?, ?, ?)
        `);
        waterTickets.forEach(ticket => {
          insertTicket.run(customerId, ticket.productId, ticket.productName, ticket.quantity);
        });
      }

      // 插入定制价格
      if (prices && prices.length > 0) {
        const insertPrice = db.prepare(`
          INSERT INTO customer_prices (customerId, productId, price)
          VALUES (?, ?, ?)
        `);
        prices.forEach(price => {
          insertPrice.run(customerId, price.productId, price.price);
        });
      }

      return db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    });

    const customer = transaction();

    logger.info('Customer created', { customerId: customer.id, name });
    Response.created(res, customer, '创建客户成功');
  } catch (error) {
    logger.error('Failed to create customer:', error);
    if (error.message.includes('不能为空') || error.message.includes('格式不正确')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '创建客户失败');
    }
  }
});

// 更新客户
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, wechat, type, notes } = req.body;

    if (name !== undefined) Validator.required(name, '客户姓名');
    if (phone !== undefined) Validator.phone(phone);

    const db = require('../config/database');

    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!customer) {
      throw new NotFoundError('客户不存在');
    }

    const update = db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          wechat = COALESCE(?, wechat),
          type = COALESCE(?, type),
          notes = COALESCE(?, notes),
          updateTime = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(name, phone, wechat, type, notes, id);

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    logger.info('Customer updated', { customerId: id });
    Response.success(res, updatedCustomer, '更新客户成功');
  } catch (error) {
    logger.error('Failed to update customer:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('格式不正确')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '更新客户失败');
    }
  }
});

// 删除客户（隐藏）
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(id);
    if (!customer) {
      throw new NotFoundError('客户不存在');
    }

    // 检查是否有未完成的订单
    const orderCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE customerId = ? AND status IN ('pending', 'assigned', 'delivering')
    `).get(id);

    if (orderCount.count > 0) {
      return Response.error(res, '该客户有未完成的订单，无法删除', 400);
    }

    // 标记为隐藏
    const update = db.prepare('UPDATE customers SET hidden = 1, updateTime = CURRENT_TIMESTAMP WHERE id = ?');
    update.run(id);

    logger.info('Customer hidden', { customerId: id });
    Response.success(res, null, '删除客户成功');
  } catch (error) {
    logger.error('Failed to delete customer:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '删除客户失败');
    }
  }
});

module.exports = router;
