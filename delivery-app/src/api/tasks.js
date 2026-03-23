import request from '@/utils/request'

// 获取我的任务列表
export const getMyTasks = (params) => {
  return request({
    url: '/api/delivery/my-tasks',
    method: 'get',
    params
  })
}

// 获取任务详情
export const getTaskDetail = (id) => {
  return request({
    url: `/api/delivery/tasks/${id}`,
    method: 'get'
  })
}

// 开始配送
export const startDelivery = (id) => {
  return request({
    url: `/api/delivery/tasks/${id}/start`,
    method: 'post'
  })
}

// 完成配送
export const completeDelivery = (id) => {
  return request({
    url: `/api/delivery/tasks/${id}/complete`,
    method: 'post'
  })
}

// 获取空桶回收记录
export const getTaskBucketReturns = (taskId) => {
  return request({
    url: `/api/delivery/tasks/${taskId}/bucket-returns`,
    method: 'get'
  })
}

// 保存空桶回收记录
export const saveBucketReturn = (data) => {
  return request({
    url: '/api/bucket-returns',
    method: 'post',
    data
  })
}

// 获取我的统计
export const getMyStatistics = () => {
  return request({
    url: '/api/delivery/my-statistics',
    method: 'get'
  })
}

// 获取配送历史
export const getDeliveryHistory = (params) => {
  return request({
    url: '/api/delivery/history',
    method: 'get',
    params
  })
}
