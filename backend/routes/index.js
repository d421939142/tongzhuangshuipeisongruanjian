const express = require('express');
const router = express.Router();

// 导入各模块路由
router.use('/products', require('./products'));
router.use('/customers', require('./customers'));
router.use('/deliverymen', require('./deliverymen'));
router.use('/orders', require('./orders'));
router.use('/payments', require('./payments'));
router.use('/statistics', require('./statistics'));
router.use('/settings', require('./settings'));

module.exports = router;
