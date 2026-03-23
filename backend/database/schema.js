const db = require('../config/database');
const logger = require('../config/logger');

/**
 * 初始化数据库表结构
 */
function initDatabase() {
  logger.info('Initializing database...');

  try {
    // 客户表
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        wechat TEXT,
        type TEXT DEFAULT '个人',
        notes TEXT,
        oweBucketCount INTEGER DEFAULT 0 CHECK(oweBucketCount >= -1000 AND oweBucketCount <= 1000),
        depositBucketCount INTEGER DEFAULT 0 CHECK(depositBucketCount >= 0),
        depositBucketAmount REAL DEFAULT 0,
        hidden INTEGER DEFAULT 0,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 客户地址表
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        province TEXT,
        city TEXT,
        district TEXT,
        detailAddress TEXT NOT NULL,
        receiverName TEXT NOT NULL,
        receiverPhone TEXT,
        isDefault INTEGER DEFAULT 0,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // 客户水票表
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_water_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        productName TEXT,
        quantity INTEGER DEFAULT 0 CHECK(quantity >= 0),
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
        UNIQUE(customerId, productId)
      )
    `);

    // 客户定制价格表
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        price REAL NOT NULL CHECK(price > 0),
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
        UNIQUE(customerId, productId)
      )
    `);

    // 产品表
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT,
        packaging TEXT NOT NULL CHECK(packaging IN ('bucket', 'bottle')),
        price REAL NOT NULL CHECK(price > 0),
        stock INTEGER DEFAULT 0 CHECK(stock >= 0),
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 送水工表
    db.exec(`
      CREATE TABLE IF NOT EXISTS deliverymen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        assignedOrders INTEGER DEFAULT 0,
        completedOrders INTEGER DEFAULT 0,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 订单表
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT UNIQUE NOT NULL,
        customerId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        unitPrice REAL NOT NULL CHECK(unitPrice > 0),
        totalAmount REAL NOT NULL,
        deliverymanId INTEGER,
        addressId INTEGER,
        address TEXT,
        receiverName TEXT,
        receiverPhone TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'delivering', 'completed', 'cancelled')),
        scheduledTime DATETIME,
        assignedTime DATETIME,
        deliveringTime DATETIME,
        completedTime DATETIME,
        cancelledTime DATETIME,
        useWaterTickets INTEGER DEFAULT 0,
        waterTicketQuantity INTEGER DEFAULT 0,
        waterTicketAmount REAL DEFAULT 0,
        notes TEXT,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (deliverymanId) REFERENCES deliverymen(id)
      )
    `);

    // 订单空桶回收表
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_bucket_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        bucketCount INTEGER DEFAULT 0 CHECK(bucketCount >= 0),
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // 收款表
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        orderId INTEGER,
        amount REAL NOT NULL,
        paymentMethod TEXT DEFAULT '现金' CHECK(paymentMethod IN ('现金', '微信', '支付宝', '水票')),
        notes TEXT,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (orderId) REFERENCES orders(id)
      )
    `);

    // 系统设置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 操作日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        ip TEXT,
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_hidden ON customers(hidden);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
      CREATE INDEX IF NOT EXISTS idx_deliverymen_status ON deliverymen(status);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_createTime ON orders(createTime);
      CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customerId);
      CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_operation_logs_createTime ON operation_logs(createTime);
    `);

    // 插入默认设置
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
    if (settingsCount.count === 0) {
      const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      insertSetting.run('companyName', '桶装水配送系统');
      insertSetting.run('companyPhone', '');
      insertSetting.run('companyAddress', '');
      insertSetting.run('defaultDeliveryTime', '09:00-18:00');
      insertSetting.run('notificationEnabled', 'true');
      insertSetting.run('messageInterfaceEnabled', 'true');
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

module.exports = { initDatabase };
