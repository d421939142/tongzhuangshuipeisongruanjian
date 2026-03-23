import request from '@/utils/request'

// 获取送水工列表
export const getDeliverymen = (params) => {
  return request({
    url: '/api/deliverymen',
    method: 'get',
    params
  })
}

// 获取送水工详情
export const getDeliveryman = (id) => {
  return request({
    url: `/api/deliverymen/${id}`,
    method: 'get'
  })
}

// 创建送水工
export const createDeliveryman = (data) => {
  return request({
    url: '/api/deliverymen',
    method: 'post',
    data
  })
}

// 更新送水工
export const updateDeliveryman = (id, data) => {
  return request({
    url: `/api/deliverymen/${id}`,
    method: 'put',
    data
  })
}

// 删除送水工
export const deleteDeliveryman = (id) => {
  return request({
    url: `/api/deliverymen/${id}`,
    method: 'delete'
  })
}

// 获取送水工统计
export const getDeliverymanStatistics = (id) => {
  return request({
    url: `/api/deliverymen/${id}/statistics`,
    method: 'get'
  })
}

// 获取送水工配送记录
export const getDeliverymanOrders = (deliverymanId, params) => {
  return request({
    url: `/api/deliverymen/${deliverymanId}/orders`,
    method: 'get',
    params
  })
}

// 分配订单给送水工
export const assignOrder = (orderId, deliverymanId) => {
  return request({
    url: `/api/orders/${orderId}/assign`,
    method: 'post',
    data: { deliveryman_id: deliverymanId }
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
