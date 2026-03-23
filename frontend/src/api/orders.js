import request from '@/utils/request'

// 获取订单列表
export const getOrders = (params) => {
  return request({
    url: '/api/orders',
    method: 'get',
    params
  })
}

// 获取订单详情
export const getOrder = (id) => {
  return request({
    url: `/api/orders/${id}`,
    method: 'get'
  })
}

// 创建订单
export const createOrder = (data) => {
  return request({
    url: '/api/orders',
    method: 'post',
    data
  })
}

// 更新订单
export const updateOrder = (id, data) => {
  return request({
    url: `/api/orders/${id}`,
    method: 'put',
    data
  })
}

// 删除订单
export const deleteOrder = (id) => {
  return request({
    url: `/api/orders/${id}`,
    method: 'delete'
  })
}

// 分配送水工
export const assignOrder = (id, deliverymanId) => {
  return request({
    url: `/api/orders/${id}/assign`,
    method: 'post',
    data: { deliveryman_id: deliverymanId }
  })
}

// 撤回订单
export const withdrawOrder = (id) => {
  return request({
    url: `/api/orders/${id}/withdraw`,
    method: 'post'
  })
}

// 完成订单
export const completeOrder = (id) => {
  return request({
    url: `/api/orders/${id}/complete`,
    method: 'post'
  })
}

// 取消订单
export const cancelOrder = (id) => {
  return request({
    url: `/api/orders/${id}/cancel`,
    method: 'post'
  })
}

// 批量分配订单
export const batchAssignOrders = (orderIds, deliverymanId) => {
  return request({
    url: '/api/orders/batch-assign',
    method: 'post',
    data: { order_ids: orderIds, deliveryman_id: deliverymanId }
  })
}

// 批量撤回订单
export const batchWithdrawOrders = (orderIds) => {
  return request({
    url: '/api/orders/batch-withdraw',
    method: 'post',
    data: { order_ids: orderIds }
  })
}

// 批量删除订单
export const batchDeleteOrders = (orderIds) => {
  return request({
    url: '/api/orders/batch-delete',
    method: 'post',
    data: { order_ids: orderIds }
  })
}

// 获取订单空桶回收记录
export const getOrderBucketReturns = (orderId) => {
  return request({
    url: `/api/orders/${orderId}/bucket-returns`,
    method: 'get'
  })
}

// 获取订单操作日志
export const getOrderLogs = (orderId) => {
  return request({
    url: `/api/orders/${orderId}/logs`,
    method: 'get'
  })
}
