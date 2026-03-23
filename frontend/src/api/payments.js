import request from '@/utils/request'

// 获取收款列表
export const getPayments = (params) => {
  return request({
    url: '/api/payments',
    method: 'get',
    params
  })
}

// 获取收款详情
export const getPayment = (id) => {
  return request({
    url: `/api/payments/${id}`,
    method: 'get'
  })
}

// 创建收款
export const createPayment = (data) => {
  return request({
    url: '/api/payments',
    method: 'post',
    data
  })
}

// 更新收款
export const updatePayment = (id, data) => {
  return request({
    url: `/api/payments/${id}`,
    method: 'put',
    data
  })
}

// 删除收款
export const deletePayment = (id) => {
  return request({
    url: `/api/payments/${id}`,
    method: 'delete'
  })
}

// 获取收款统计
export const getPaymentStatistics = (params) => {
  return request({
    url: '/api/payments/statistics',
    method: 'get',
    params
  })
}
