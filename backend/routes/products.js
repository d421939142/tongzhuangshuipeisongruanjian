const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const Validator = require('../utils/validator');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

// 获取产品列表
router.get('/', (req, res) => {
  try {
    const db = require('../config/database');
    const products = db.prepare(`
      SELECT id, brand, model, packaging, price, stock, createTime, updateTime
      FROM products
      ORDER BY createTime DESC
    `).all();

    Response.success(res, products, '获取产品列表成功');
  } catch (error) {
    logger.error('Failed to get products:', error);
    Response.serverError(res, '获取产品列表失败');
  }
});

// 获取单个产品
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    const product = db.prepare(`
      SELECT id, brand, model, packaging, price, stock, createTime, updateTime
      FROM products
      WHERE id = ?
    `).get(id);

    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    Response.success(res, product, '获取产品详情成功');
  } catch (error) {
    logger.error('Failed to get product:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '获取产品详情失败');
    }
  }
});

// 创建产品
router.post('/', (req, res) => {
  try {
    const { brand, model, packaging, price, stock = 0 } = req.body;

    // 验证
    Validator.required(brand, '产品品牌');
    Validator.required(packaging, '包装类型');
    Validator.enum(packaging, '包装类型', ['bucket', 'bottle']);
    Validator.number(price, '价格', 0);
    Validator.number(stock, '库存', 0);

    const db = require('../config/database');

    const insert = db.prepare(`
      INSERT INTO products (brand, model, packaging, price, stock)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(brand, model, packaging, price, stock);

    const product = db.prepare(`
      SELECT id, brand, model, packaging, price, stock, createTime, updateTime
      FROM products
      WHERE id = ?
    `).get(result.lastInsertRowid);

    logger.info('Product created', { productId: product.id, brand });
    Response.created(res, product, '创建产品成功');
  } catch (error) {
    logger.error('Failed to create product:', error);
    if (error.message.includes('不能为空') || error.message.includes('必须是')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '创建产品失败');
    }
  }
});

// 更新产品
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { brand, model, packaging, price, stock } = req.body;

    // 验证
    if (brand !== undefined) Validator.required(brand, '产品品牌');
    if (packaging !== undefined) {
      Validator.enum(packaging, '包装类型', ['bucket', 'bottle']);
    }
    if (price !== undefined) Validator.number(price, '价格', 0);
    if (stock !== undefined) Validator.number(stock, '库存', 0);

    const db = require('../config/database');

    // 检查产品是否存在
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    // 更新产品
    const update = db.prepare(`
      UPDATE products
      SET brand = COALESCE(?, brand),
          model = COALESCE(?, model),
          packaging = COALESCE(?, packaging),
          price = COALESCE(?, price),
          stock = COALESCE(?, stock),
          updateTime = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(brand, model, packaging, price, stock, id);

    const updatedProduct = db.prepare(`
      SELECT id, brand, model, packaging, price, stock, createTime, updateTime
      FROM products
      WHERE id = ?
    `).get(id);

    logger.info('Product updated', { productId: id });
    Response.success(res, updatedProduct, '更新产品成功');
  } catch (error) {
    logger.error('Failed to update product:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('不能为空') || error.message.includes('必须是')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '更新产品失败');
    }
  }
});

// 删除产品
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/database');

    // 检查产品是否存在
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    // 检查是否有订单使用该产品
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE productId = ?').get(id);
    if (orderCount.count > 0) {
      return Response.error(res, '该产品已有订单关联，无法删除', 400);
    }

    // 删除产品
    const del = db.prepare('DELETE FROM products WHERE id = ?');
    del.run(id);

    logger.info('Product deleted', { productId: id });
    Response.success(res, null, '删除产品成功');
  } catch (error) {
    logger.error('Failed to delete product:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else {
      Response.serverError(res, '删除产品失败');
    }
  }
});

// 更新库存
router.patch('/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    Validator.number(stock, '库存', 0);

    const db = require('../config/database');

    // 检查产品是否存在
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) {
      throw new NotFoundError('产品不存在');
    }

    // 更新库存
    const update = db.prepare(`
      UPDATE products
      SET stock = ?, updateTime = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    update.run(stock, id);

    logger.info('Product stock updated', { productId: id, stock });
    Response.success(res, { id, stock }, '更新库存成功');
  } catch (error) {
    logger.error('Failed to update product stock:', error);
    if (error.name === 'NotFoundError') {
      Response.notFound(res, error.message);
    } else if (error.message.includes('必须是')) {
      Response.error(res, error.message, 400);
    } else {
      Response.serverError(res, '更新库存失败');
    }
  }
});

module.exports = router;
