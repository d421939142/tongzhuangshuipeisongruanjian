const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const logger = require('../config/logger');

// 订单统计
router.get('/orders', (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const db = require('../config/database');

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND date(createTime) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(createTime) <= ?';
      params.push(endDate);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalOrders,
        SUM(quantity) as totalQuantity,
        SUM(totalAmount) as totalAmount,
        AVG(totalAmount) as avgAmount,
        COUNT(DISTINCT customerId) as uniqueCustomers
      FROM orders
      ${whereClause}
    `).get(...params);

    // 按状态统计
    const statusStats = db.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(totalAmount) as amount
      FROM orders
      ${whereClause}
      GROUP BY status
    `).all(...params);

    // 按日期统计
    const dateStats = db.prepare(`
      SELECT
        date(createTime) as date,
        COUNT(*) as orderCount,
        SUM(quantity) as quantity,
        SUM(totalAmount) as amount
      FROM orders
      ${whereClause}
      GROUP BY date(createTime)
      ORDER BY date DESC
      LIMIT 30
    `).all(...params);

    Response.success(res, {
      ...stats,
      statusStats,
      dateStats
    }, '获取订单统计成功');
  } catch (error) {
    logger.error('Failed to get order statistics:', error);
    Response.serverError(res, '获取订单统计失败');
  }
});

// 产品销售统计
router.get('/products', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = require('../config/database');

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND date(o.createTime) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(o.createTime) <= ?';
      params.push(endDate);
    }

    const productStats = db.prepare(`
      SELECT
        p.id,
        p.brand,
        p.model,
        COUNT(*) as orderCount,
        SUM(o.quantity) as totalQuantity,
        SUM(o.totalAmount) as totalAmount,
        AVG(o.unitPrice) as avgPrice
      FROM orders o
      LEFT JOIN products p ON o.productId = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY totalAmount DESC
    `).all(...params);

    Response.success(res, productStats, '获取产品销售统计成功');
  } catch (error) {
    logger.error('Failed to get product statistics:', error);
    Response.serverError(res, '获取产品销售统计失败');
  }
});

// 送水工业绩统计
router.get('/deliverymen', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = require('../config/database');

    let whereClause = 'WHERE o.deliverymanId IS NOT NULL';
    const params = [];

    if (startDate) {
      whereClause += ' AND date(o.createTime) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(o.createTime) <= ?';
      params.push(endDate);
    }

    const deliverymanStats = db.prepare(`
      SELECT
        d.id,
        d.name,
        d.phone,
        d.assignedOrders,
        d.completedOrders,
        COUNT(o.id) as completedThisPeriod,
        SUM(o.quantity) as totalQuantity,
        SUM(o.totalAmount) as totalAmount
      FROM deliverymen d
      LEFT JOIN orders o ON d.id = o.deliverymanId
        AND o.status = 'completed'
        ${whereClause.replace('o.deliverymanId IS NOT NULL AND', '')}
      GROUP BY d.id
      ORDER BY totalAmount DESC
    `).all(...params);

    Response.success(res, deliverymanStats, '获取送水工业绩统计成功');
  } catch (error) {
    logger.error('Failed to get deliveryman statistics:', error);
    Response.serverError(res, '获取送水工业绩统计成功');
  }
});

// 收款统计
router.get('/payments', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = require('../config/database');

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND date(createTime) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date(createTime) <= ?';
      params.push(endDate);
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalPayments,
        SUM(amount) as totalAmount,
        AVG(amount) as avgAmount,
        COUNT(DISTINCT customerId) as uniqueCustomers
      FROM payments
      ${whereClause}
    `).get(...params);

    // 按日期统计
    const dateStats = db.prepare(`
      SELECT
        date(createTime) as date,
        COUNT(*) as paymentCount,
        SUM(amount) as amount
      FROM payments
      ${whereClause}
      GROUP BY date(createTime)
      ORDER BY date DESC
      LIMIT 30
    `).all(...params);

    Response.success(res, {
      ...stats,
      dateStats
    }, '获取收款统计成功');
  } catch (error) {
    logger.error('Failed to get payment statistics:', error);
    Response.serverError(res, '获取收款统计失败');
  }
});

// 客户统计
router.get('/customers', (req, res) => {
  try {
    const db = require('../config/database');

    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalCustomers,
        SUM(CASE WHEN hidden = 0 THEN 1 ELSE 0 END) as activeCustomers,
        SUM(CASE WHEN hidden = 1 THEN 1 ELSE 0 END) as hiddenCustomers,
        SUM(CASE WHEN oweBucketCount > 0 THEN 1 ELSE 0 END) as oweBucketCustomers,
        SUM(oweBucketCount) as totalOweBuckets
      FROM customers
    `).get();

    // 新增客户统计（最近30天）
    const newCustomers = db.prepare(`
      SELECT
        date(createTime) as date,
        COUNT(*) as count
      FROM customers
      WHERE createTime >= datetime('now', '-30 days')
      GROUP BY date(createTime)
      ORDER BY date DESC
    `).all();

    Response.success(res, {
      ...stats,
      newCustomers
    }, '获取客户统计成功');
  } catch (error) {
    logger.error('Failed to get customer statistics:', error);
    Response.serverError(res, '获取客户统计失败');
  }
});

module.exports = router;
