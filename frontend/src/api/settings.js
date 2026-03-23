import request from '@/utils/request'

// 获取设置
export const getSettings = (type) => {
  return request({
    url: '/api/settings',
    method: 'get',
    params: { type }
  })
}

// 保存设置
export const saveSettings = (type, data) => {
  return request({
    url: '/api/settings',
    method: 'post',
    data: { type, settings: data }
  })
}

// 导出数据
export const exportData = () => {
  return request({
    url: '/api/settings/export',
    method: 'get'
  })
}

// 导入数据
export const importData = (data) => {
  return request({
    url: '/api/settings/import',
    method: 'post',
    data
  })
}

// 获取备份历史
export const getBackupHistory = () => {
  return request({
    url: '/api/settings/backups',
    method: 'get'
  })
}

// 恢复备份
export const restoreBackup = (id) => {
  return request({
    url: `/api/settings/backups/${id}/restore`,
    method: 'post'
  })
}

// 删除备份
export const deleteBackup = (id) => {
  return request({
    url: `/api/settings/backups/${id}`,
    method: 'delete'
  })
}
