import request from '@/utils/request'

// 获取产品列表
export const getProducts = (params) => {
  return request({
    url: '/api/products',
    method: 'get',
    params
  })
}

// 获取产品详情
export const getProduct = (id) => {
  return request({
    url: `/api/products/${id}`,
    method: 'get'
  })
}

// 创建产品
export const createProduct = (data) => {
  return request({
    url: '/api/products',
    method: 'post',
    data
  })
}

// 更新产品
export const updateProduct = (id, data) => {
  return request({
    url: `/api/products/${id}`,
    method: 'put',
    data
  })
}

// 删除产品
export const deleteProduct = (id) => {
  return request({
    url: `/api/products/${id}`,
    method: 'delete'
  })
}

// 更新产品库存
export const updateProductStock = (id, stock) => {
  return request({
    url: `/api/products/${id}/stock`,
    method: 'put',
    data: { stock }
  })
}

// 批量更新产品排序
export const updateProductSort = (sortList) => {
  return request({
    url: '/api/products/sort',
    method: 'put',
    data: { sortList }
  })
}
