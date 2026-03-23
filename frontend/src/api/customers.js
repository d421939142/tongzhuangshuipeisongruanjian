import request from '@/utils/request'

// 获取客户列表
export const getCustomers = (params) => {
  return request({
    url: '/api/customers',
    method: 'get',
    params
  })
}

// 获取客户详情
export const getCustomer = (id) => {
  return request({
    url: `/api/customers/${id}`,
    method: 'get'
  })
}

// 创建客户
export const createCustomer = (data) => {
  return request({
    url: '/api/customers',
    method: 'post',
    data
  })
}

// 更新客户
export const updateCustomer = (id, data) => {
  return request({
    url: `/api/customers/${id}`,
    method: 'put',
    data
  })
}

// 删除客户
export const deleteCustomer = (id) => {
  return request({
    url: `/api/customers/${id}`,
    method: 'delete'
  })
}

// 获取客户统计
export const getCustomerStatistics = (id) => {
  return request({
    url: `/api/customers/${id}/statistics`,
    method: 'get'
  })
}

// 获取客户地址列表
export const getCustomerAddresses = (customerId) => {
  return request({
    url: `/api/customers/${customerId}/addresses`,
    method: 'get'
  })
}

// 创建客户地址
export const createAddress = (data) => {
  return request({
    url: '/api/customer-addresses',
    method: 'post',
    data
  })
}

// 更新客户地址
export const updateAddress = (id, data) => {
  return request({
    url: `/api/customer-addresses/${id}`,
    method: 'put',
    data
  })
}

// 删除客户地址
export const deleteAddress = (id) => {
  return request({
    url: `/api/customer-addresses/${id}`,
    method: 'delete'
  })
}

// 调整水票
export const adjustWaterTicket = (customerId, data) => {
  return request({
    url: `/api/customers/${customerId}/water-tickets/adjust`,
    method: 'post',
    data
  })
}

// 调整欠桶
export const adjustOwedBucket = (customerId, data) => {
  return request({
    url: `/api/customers/${customerId}/owed-buckets/adjust`,
    method: 'post',
    data
  })
}

// 获取客户历史订单
export const getCustomerOrders = (customerId, params) => {
  return request({
    url: `/api/customers/${customerId}/orders`,
    method: 'get',
    params
  })
}
