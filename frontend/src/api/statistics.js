import request from '@/utils/request'

// 获取综合统计数据
export const getStatistics = (params) => {
  return request({
    url: '/api/statistics',
    method: 'get',
    params
  })
}

// 获取订单趋势
export const getOrderTrend = (params) => {
  return request({
    url: '/api/statistics/order-trend',
    method: 'get',
    params
  })
}

// 获取收款趋势
export const getPaymentTrend = (params) => {
  return request({
    url: '/api/statistics/payment-trend',
    method: 'get',
    params
  })
}

// 获取产品销量排行
export const getProductRanking = (params) => {
  return request({
    url: '/api/statistics/product-ranking',
    method: 'get',
    params
  })
}

// 获取送水工业绩排行
export const getDeliverymanRanking = (params) => {
  return request({
    url: '/api/statistics/deliveryman-ranking',
    method: 'get',
    params
  })
}
