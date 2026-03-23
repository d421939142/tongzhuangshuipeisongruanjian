const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const Validator = require('../utils/validator');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// 获取订单列表
router.get('/', (req, res) => {
  try {
    const { status, customerId, deliverymanId } = req.query;
    const db = require('../config/database');

    let query = `
      SELECT
        o.*,
        c.name as customerName,
        c.phone as customerPhone,
        p.brand as productBrand,
        p.model as productModel,
        d.name as deliverymanName
      FROM orders o
      LEFT JOIN customers c ON o.customerId = c.id
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN deliverymen d ON o.deliverymanId = d.id
      WHERE 1=1
    `;

    const params = [];
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (customerId) {
      query += ' AND o.customerId = ?';
      params.push(customerId);
    }
    if (deliverymanId) {
      query += ' AND o.deliverymanId = ?';
      params.push(deliverymanId);
    }

    query += ' ORDER BY o.createTime DESC';

    const orders = db.prepare(query).all(...params);

    Response.success(res, orders, '获取订单列表成功');
  } catch (error) {
    logger.error('Failed to get orders:', error);
    Response.serverError(res, '获取订单列表失败');
  }
});

// 获取订单详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const order = db.prepare(`
      SELECT
        o.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.wechat as customerWechat,
        p.brand as productBrand,
        p.model as productModel,
        p.packaging as productPackaging,
        d.name as deliverymanName,
        d.phone as deliverymanPhone
      FROM orders o
      LEFT JOIN customers c ON o.customerId = c.id
      LEFT JOIN products p ON o.productId = p.id
      LEFT JOIN deliverymen d ON o.deliverymanId = d.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    // 获取空桶回收信息
    const bucketReturn = db.prepare(`
      SELECT * FROM order_bucket_returns WHERE orderId = ?
    `).get(id);

    Response.success(res, { ...order, bucketReturn }, '获取订单详情成功');
  } catch (error) {
    logger.error('Failed to get order:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '获取订单详情失败');
    }
  }
});

// 创建订单
router.post('/', (req, res) => {
  try {
    const { customerId, productId, quantity, deliverymanId, addressId, address, receiverName, receiverPhone, scheduledTime, notes } = req.body;

    // 验证
    Validator.required(customerId, '客户ID');
    Validator.required(productId, '产品ID');
    Validator.number(quantity, '数量', 1);

    const db = require('../config/database');
    const transaction = db.transaction(() => {
      // 获取产品信息
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!product) {
        throw new NotFoundError('产品不存在');
      }

      // 检查库存
      if (product.stock < quantity) {
        throw new Error('库存不足');
      }

      // 获取客户信息
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      // 计算价格（优先使用客户定制价格）
      let unitPrice = product.price;
      const customPrice = db.prepare(`
        SELECT price FROM customer_prices WHERE customerId = ? AND productId = ?
      `).get(customerId, productId);
      if (customPrice) {
        unitPrice = customPrice.price;
      }

      const totalAmount = unitPrice * quantity;

      // 生成订单号
      const orderNumber = 'ORD' + Date.now();

      // 扣减库存
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);

      // 插入订单
      const insert = db.prepare(`
        INSERT INTO orders (
          orderNumber, customerId, productId, quantity, unitPrice, totalAmount,
          deliverymanId, addressId, address, receiverName, receiverPhone,
          scheduledTime, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        orderNumber, customerId, productId, quantity, unitPrice, totalAmount,
        deliverymanId, addressId, address, receiverName, receiverPhone,
        scheduledTime, notes
      );

      // 如果分配了送水工，更新订单状态
      if (deliverymanId) {
        db.prepare(`
          UPDATE orders
          SET status = 'assigned', assignedTime = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(result.lastInsertRowid);

        db.prepare(`
          UPDATE deliverymen
          SET assignedOrders = assignedOrders + 1
          WHERE id = ?
        `).run(deliverymanId);
      }

      return db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    });

    const order = transaction();

    logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber });
    Response.created(res, order, '创建订单成功');
  } catch (error) {
    logger.error('Failed to create order:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('库存不足')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '创建订单失败');
    }
  }
});

// 分配送水工
router.post('/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { deliverymanId } = req.body;

    Validator.required(deliverymanId, '送水工ID');

    const db = require('../config/database');
    const transaction = db.transaction(() => {
      // 检查订单是否存在
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        throw new NotFoundError('订单不存在');
      }

      // 检查订单状态
      if (order.status !== 'pending') {
        throw new Error('只能分配待分配的订单');
      }

      // 检查送水工是否存在且活跃
      const deliveryman = db.prepare('SELECT * FROM deliverymen WHERE id = ?').get(deliverymanId);
      if (!deliveryman) {
        throw new NotFoundError('送水工不存在');
      }
      if (deliveryman.status !== 'active') {
        throw new Error('送水工状态不活跃');
      }

      // 更新订单
      db.prepare(`
        UPDATE orders
        SET deliverymanId = ?, status = 'assigned', assignedTime = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(deliverymanId, id);

      // 更新送水工统计
      db.prepare(`
        UPDATE deliverymen
        SET assignedOrders = assignedOrders + 1
        WHERE id = ?
      `).run(deliverymanId);

      return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    });

    const order = transaction();

    logger.info('Order assigned', { orderId: id, deliverymanId });
    Response.success(res, order, '分配送水工成功');
  } catch (error) {
    logger.error('Failed to assign order:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('只能分配')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '分配送水工失败');
    }
  }
});

// 开始配送
router.post('/:id/start-delivery', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.status !== 'assigned') {
      throw new Error('订单状态不正确');
    }

    db.prepare(`
      UPDATE orders
      SET status = 'delivering', deliveringTime = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    logger.info('Order delivery started', { orderId: id });
    Response.success(res, null, '开始配送成功');
  } catch (error) {
    logger.error('Failed to start delivery:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.error(res, error.message, 400);
    }
  }
});

// 完成订单
router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAmount, bucketReturnCount, notes } = req.body;

    Validator.number(receivedAmount, '实收金额', 0);
    Validator.number(bucketReturnCount, '回收空桶数量', 0);

    const db = require('../config/database');
    const transaction = db.transaction(() => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        throw new NotFoundError('订单不存在');
      }

      if (order.status !== 'delivering') {
        throw new Error('订单状态不正确');
      }

      // 更新订单状态
      db.prepare(`
        UPDATE orders
        SET status = 'completed', completedTime = CURRENT_TIMESTAMP, notes = ?
        WHERE id = ?
      `).run(notes || order.notes, id);

      // 更新送水工统计
      db.prepare(`
        UPDATE deliverymen
        SET assignedOrders = assignedOrders - 1, completedOrders = completedOrders + 1
        WHERE id = ?
      `).run(order.deliverymanId);

      // 记录空桶回收
      if (bucketReturnCount > 0) {
        db.prepare(`
          INSERT INTO order_bucket_returns (orderId, bucketCount)
          VALUES (?, ?)
        `).run(id, bucketReturnCount);
      }

      // 更新客户欠桶（配送数量 - 回收数量）
      const oweDelta = order.quantity - bucketReturnCount;
      if (oweDelta > 0) {
        db.prepare(`
          UPDATE customers
          SET oweBucketCount = oweBucketCount + ?
          WHERE id = ?
        `).run(oweDelta, order.customerId);
      }

      // 创建收款记录
      if (receivedAmount > 0) {
        db.prepare(`
          INSERT INTO payments (customerId, orderId, amount, paymentMethod, notes)
          VALUES (?, ?, ?, '现金', ?)
        `).run(order.customerId, id, receivedAmount, notes);
      }

      return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    });

    const order = transaction();

    logger.info('Order completed', { orderId: id });
    Response.success(res, order, '完成订单成功');
  } catch (error) {
    logger.error('Failed to complete order:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.error(res, error.message, 400);
    }
  }
});

// 取消订单
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');
    const transaction = db.transaction(() => {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        throw new NotFoundError('订单不存在');
      }

      if (order.status !== 'pending') {
        throw new Error('只能取消待分配的订单');
      }

      // 回滚库存
      db.prepare(`
        UPDATE products
        SET stock = stock + ?
        WHERE id = ?
      `).run(order.quantity, order.productId);

      // 更新订单状态
      db.prepare(`
        UPDATE orders
        SET status = 'cancelled', cancelledTime = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      return { success: true };
    });

    transaction();

    logger.info('Order cancelled', { orderId: id });
    Response.success(res, null, '取消订单成功');
  } catch (error) {
    logger.error('Failed to cancel order:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.error(res, error.message, 400);
    }
  }
});

module.exports = router;
