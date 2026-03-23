import request from '@/utils/request'

// 产品API
export const productApi = {
  // 获取产品列表
  getList: () => request.get('/api/products'),

  // 获取产品详情
  getDetail: (id) => request.get(`/api/products/${id}`),

  // 创建产品
  create: (data) => request.post('/api/products', data),

  // 更新产品
  update: (id, data) => request.put(`/api/products/${id}`, data),

  // 删除产品
  delete: (id) => request.delete(`/api/products/${id}`),

  // 更新库存
  updateStock: (id, stock) => request.patch(`/api/products/${id}/stock`, { stock })
}

// 客户API
export const customerApi = {
  // 获取客户列表
  getList: (params) => request.get('/api/customers', { params }),

  // 获取客户详情
  getDetail: (id) => request.get(`/api/customers/${id}`),

  // 创建客户
  create: (data) => request.post('/api/customers', data),

  // 更新客户
  update: (id, data) => request.put(`/api/customers/${id}`, data),

  // 删除客户
  delete: (id) => request.delete(`/api/customers/${id}`)
}

// 送水工API
export const deliverymanApi = {
  // 获取送水工列表
  getList: () => request.get('/api/deliverymen'),

  // 获取送水工详情
  getDetail: (id) => request.get(`/api/deliverymen/${id}`),

  // 创建送水工
  create: (data) => request.post('/api/deliverymen', data),

  // 更新送水工
  update: (id, data) => request.put(`/api/deliverymen/${id}`, data),

  // 删除送水工
  delete: (id) => request.delete(`/api/deliverymen/${id}`)
}

// 订单API
export const orderApi = {
  // 获取订单列表
  getList: (params) => request.get('/api/orders', { params }),

  // 获取订单详情
  getDetail: (id) => request.get(`/api/orders/${id}`),

  // 创建订单
  create: (data) => request.post('/api/orders', data),

  // 分配送水工
  assign: (id, deliverymanId) => request.post(`/api/orders/${id}/assign`, { deliverymanId }),

  // 开始配送
  startDelivery: (id) => request.post(`/api/orders/${id}/start-delivery`),

  // 完成订单
  complete: (id, data) => request.post(`/api/orders/${id}/complete`, data),

  // 取消订单
  cancel: (id) => request.post(`/api/orders/${id}/cancel`)
}

// 收款API
export const paymentApi = {
  // 获取收款列表
  getList: (params) => request.get('/api/payments', { params }),

  // 获取收款详情
  getDetail: (id) => request.get(`/api/payments/${id}`),

  // 创建收款
  create: (data) => request.post('/api/payments', data),

  // 删除收款
  delete: (id) => request.delete(`/api/payments/${id}`)
}

// 统计API
export const statisticsApi = {
  // 订单统计
  getOrders: (params) => request.get('/api/statistics/orders', { params }),

  // 产品销售统计
  getProducts: (params) => request.get('/api/statistics/products', { params }),

  // 送水工业绩统计
  getDeliverymen: (params) => request.get('/api/statistics/deliverymen', { params }),

  // 收款统计
  getPayments: (params) => request.get('/api/statistics/payments', { params }),

  // 客户统计
  getCustomers: () => request.get('/api/statistics/customers')
}

// 设置API
export const settingsApi = {
  // 获取所有设置
  getAll: () => request.get('/api/settings'),

  // 更新设置
  update: (key, value) => request.put(`/api/settings/${key}`, { value }),

  // 批量更新设置
  batchUpdate: (settings) => request.post('/api/settings', { settings })
}
