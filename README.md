# 桶装水配送管理系统 v2.0

## 📋 项目介绍

桶装水配送管理系统是一个为水站提供完整配送管理解决方案的系统，包含后台管理端和配送APP端。

**全新重构版本**：基于模块化设计，代码清晰，易于维护和扩展。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或者分别安装
npm install          # 安装根依赖
cd backend && npm install   # 安装后端依赖
cd ../frontend && npm install  # 安装前端依赖
```

### 配置环境变量

```bash
# 复制后端环境变量配置
cp backend/.env.example backend/.env

# 复制前端环境变量配置
cp frontend/.env.development.example frontend/.env.development
```

修改 `backend/.env` 文件：

```env
API_PORT=3001
API_HOST=localhost
API_KEY=your-secret-api-key-change-in-production
DATABASE_PATH=../database/water-delivery.db
LOG_LEVEL=info
```

### 启动项目

#### 开发模式（同时启动前后端）

```bash
npm run dev
```

#### 分别启动

```bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

### 访问系统

- 前端地址：http://localhost:5173
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/health

---

## 📁 项目结构

```
water-delivery-new/
├── backend/                 # 后端代码
│   ├── config/            # 配置文件
│   │   ├── database.js    # 数据库配置
│   │   ├── logger.js      # 日志配置
│   │   └── index.js       # 配置入口
│   ├── database/          # 数据库相关
│   │   └── schema.js      # 数据库Schema
│   ├── middlewares/       # 中间件
│   │   ├── errorHandler.js    # 错误处理
│   │   ├── apiKeyAuth.js      # API密钥验证
│   │   └── requestLogger.js   # 请求日志
│   ├── routes/            # 路由
│   │   ├── index.js       # 路由入口
│   │   ├── products.js    # 产品路由
│   │   ├── customers.js   # 客户路由
│   │   ├── deliverymen.js # 送水工路由
│   │   ├── orders.js      # 订单路由
│   │   ├── payments.js    # 收款路由
│   │   ├── statistics.js  # 统计路由
│   │   └── settings.js    # 设置路由
│   ├── utils/             # 工具函数
│   │   ├── response.js    # 统一响应
│   │   ├── errors.js      # 自定义错误
│   │   └── validator.js   # 验证工具
│   ├── logs/              # 日志文件
│   ├── server.js          # 服务器入口
│   └── package.json
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── api/          # API调用
│   │   │   └── index.js  # API接口定义
│   │   ├── components/   # 公共组件
│   │   │   └── Layout.vue  # 布局组件
│   │   ├── views/        # 页面组件
│   │   │   ├── Dashboard.vue
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── deliverymen/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── statistics/
│   │   │   └── Settings.vue
│   │   ├── router/       # 路由
│   │   │   └── index.js
│   │   ├── utils/        # 工具函数
│   │   │   └── request.js  # axios配置
│   │   ├── App.vue       # 根组件
│   │   └── main.js       # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/              # 数据库文件
│   └── water-delivery.db  # SQLite数据库
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔧 功能模块

### ✅ 已完成

- [x] 项目基础架构
- [x] 数据库Schema设计
- [x] 后端API框架
- [x] 前端基础框架
- [x] 产品管理API
- [x] 客户管理API
- [x] 送水工管理API
- [x] 订单管理API
- [x] 收款管理API
- [x] 统计分析API
- [x] 系统设置API
- [x] 仪表盘页面

### 🚧 开发中

- [ ] 产品管理完整页面
- [ ] 客户管理完整页面
- [ ] 送水工管理完整页面
- [ ] 订单管理完整页面
- [ ] 收款管理完整页面
- [ ] 统计分析完整页面
- [ ] 系统设置完整页面
- [ ] 配送APP端
- [ ] 消息接口功能

---

## 🔌 API接口文档

### 基础信息

- Base URL: `http://localhost:3001/api`
- 认证方式: API Key (Header: `X-API-Key`)

### 产品接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /products | 获取产品列表 |
| GET | /products/:id | 获取产品详情 |
| POST | /products | 创建产品 |
| PUT | /products/:id | 更新产品 |
| DELETE | /products/:id | 删除产品 |
| PATCH | /products/:id/stock | 更新库存 |

### 客户接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /customers | 获取客户列表 |
| GET | /customers/:id | 获取客户详情 |
| POST | /customers | 创建客户 |
| PUT | /customers/:id | 更新客户 |
| DELETE | /customers/:id | 删除客户 |

### 送水工接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /deliverymen | 获取送水工列表 |
| GET | /deliverymen/:id | 获取送水工详情 |
| POST | /deliverymen | 创建送水工 |
| PUT | /deliverymen/:id | 更新送水工 |
| DELETE | /deliverymen/:id | 删除送水工 |

### 订单接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /orders | 获取订单列表 |
| GET | /orders/:id | 获取订单详情 |
| POST | /orders | 创建订单 |
| POST | /orders/:id/assign | 分配送水工 |
| POST | /orders/:id/start-delivery | 开始配送 |
| POST | /orders/:id/complete | 完成订单 |
| POST | /orders/:id/cancel | 取消订单 |

### 收款接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /payments | 获取收款列表 |
| GET | /payments/:id | 获取收款详情 |
| POST | /payments | 创建收款 |
| DELETE | /payments/:id | 删除收款 |

### 统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /statistics/orders | 订单统计 |
| GET | /statistics/products | 产品销售统计 |
| GET | /statistics/deliverymen | 送水工业绩统计 |
| GET | /statistics/payments | 收款统计 |
| GET | /statistics/customers | 客户统计 |

### 设置接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /settings | 获取所有设置 |
| GET | /settings/:key | 获取单个设置 |
| PUT | /settings/:key | 更新设置 |
| POST | /settings | 批量更新设置 |

---

## 🛠️ 开发指南

### 添加新功能

1. **后端**
   - 在 `backend/routes/` 创建新的路由文件
   - 在 `backend/routes/index.js` 注册路由
   - 在 `backend/database/schema.js` 添加数据表（如需要）

2. **前端**
   - 在 `frontend/src/views/` 创建页面组件
   - 在 `frontend/src/router/index.js` 注册路由
   - 在 `frontend/src/api/index.js` 添加API接口

### 代码规范

- 后端使用 `better-sqlite3` 同步API
- 前端使用 Vue 3 Composition API
- 所有API返回统一格式：`{ success, data, message, code }`
- 使用事务处理数据库操作

---

## 📊 技术栈

### 后端
- Node.js + Express
- SQLite + better-sqlite3
- Winston (日志)
- dotenv (环境变量)

### 前端
- Vue 3 + Vite
- Pinia (状态管理)
- Vue Router (路由)
- Element Plus (UI组件)
- Axios (HTTP客户端)

---

## 🐛 常见问题

### 数据库连接失败

检查 `backend/.env` 中的 `DATABASE_PATH` 配置是否正确。

### API请求失败

检查 `backend/.env` 中的 `API_KEY` 是否与 `frontend/src/utils/request.js` 中的API密钥一致。

### 前端无法启动

确保已安装前端依赖：`cd frontend && npm install`

---

## 📝 更新日志

### v2.0.0 (2026-03-23)

- ✅ 全新架构设计
- ✅ 完整的后端API框架
- ✅ 前端基础框架
- ✅ 数据库Schema设计
- ✅ 统一的错误处理和日志
- ✅ API密钥验证

---

## 📄 许可证

MIT

---

**开发者**: CodeBuddy AI Assistant
**版本**: 2.0.0
**状态**: 开发中
