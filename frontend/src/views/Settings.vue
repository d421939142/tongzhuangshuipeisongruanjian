<template>
  <div class="settings">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 基本设置 -->
            <el-tab-pane label="基本设置" name="basic">
              <el-form
                ref="basicFormRef"
                :model="basicSettings"
                :rules="basicRules"
                label-width="150px"
                style="max-width: 600px"
              >
                <el-form-item label="系统名称" prop="system_name">
                  <el-input v-model="basicSettings.system_name" placeholder="请输入系统名称" />
                </el-form-item>

                <el-form-item label="联系电话" prop="contact_phone">
                  <el-input v-model="basicSettings.contact_phone" placeholder="请输入联系电话" />
                </el-form-item>

                <el-form-item label="服务时间" prop="service_hours">
                  <el-input
                    v-model="basicSettings.service_hours"
                    placeholder="例如：8:00-20:00"
                  />
                </el-form-item>

                <el-form-item label="默认配送费">
                  <el-input-number
                    v-model="basicSettings.default_delivery_fee"
                    :min="0"
                    :precision="2"
                    :step="1"
                  />
                  <span style="margin-left: 10px; color: #909399;">元</span>
                </el-form-item>

                <el-form-item label="最低起送量">
                  <el-input-number
                    v-model="basicSettings.min_order_quantity"
                    :min="1"
                  />
                  <span style="margin-left: 10px; color: #909399;">桶</span>
                </el-form-item>

                <el-form-item label="系统公告">
                  <el-input
                    v-model="basicSettings.announcement"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入系统公告"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveBasicSettings" :loading="saving">
                    保存设置
                  </el-button>
                  <el-button @click="resetBasicSettings">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 界面设置 -->
            <el-tab-pane label="界面设置" name="ui">
              <el-form
                ref="uiFormRef"
                :model="uiSettings"
                label-width="150px"
                style="max-width: 600px"
              >
                <el-form-item label="主题色">
                  <el-color-picker v-model="uiSettings.theme_color" />
                  <span style="margin-left: 10px; color: #909399;">{{ uiSettings.theme_color }}</span>
                </el-form-item>

                <el-form-item label="字体大小">
                  <el-radio-group v-model="uiSettings.font_size">
                    <el-radio label="small">小</el-radio>
                    <el-radio label="medium">中</el-radio>
                    <el-radio label="large">大</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="侧边栏收起">
                  <el-switch v-model="uiSettings.sidebar_collapsed" />
                  <span style="margin-left: 10px; color: #909399;">
                    {{ uiSettings.sidebar_collapsed ? '已收起' : '已展开' }}
                  </span>
                </el-form-item>

                <el-form-item label="显示Logo">
                  <el-switch v-model="uiSettings.show_logo" />
                </el-form-item>

                <el-form-item label="每页显示数量">
                  <el-select v-model="uiSettings.page_size">
                    <el-option label="10条" :value="10" />
                    <el-option label="20条" :value="20" />
                    <el-option label="50条" :value="50" />
                    <el-option label="100条" :value="100" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveUISettings" :loading="saving">
                    保存设置
                  </el-button>
                  <el-button @click="resetUISettings">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 通知设置 -->
            <el-tab-pane label="通知设置" name="notification">
              <el-form
                ref="notificationFormRef"
                :model="notificationSettings"
                label-width="150px"
                style="max-width: 600px"
              >
                <el-form-item label="新订单通知">
                  <el-switch v-model="notificationSettings.new_order_notify" />
                </el-form-item>

                <el-form-item label="订单完成通知">
                  <el-switch v-model="notificationSettings.order_complete_notify" />
                </el-form-item>

                <el-form-item label="低库存预警">
                  <el-switch v-model="notificationSettings.low_stock_notify" />
                </el-form-item>

                <el-form-item label="库存预警阈值">
                  <el-input-number
                    v-model="notificationSettings.low_stock_threshold"
                    :min="1"
                  />
                  <span style="margin-left: 10px; color: #909399;">桶</span>
                </el-form-item>

                <el-form-item label="欠桶提醒">
                  <el-switch v-model="notificationSettings.owed_bucket_notify" />
                </el-form-item>

                <el-form-item label="欠桶阈值">
                  <el-input-number
                    v-model="notificationSettings.owed_bucket_threshold"
                    :min="1"
                  />
                  <span style="margin-left: 10px; color: #909399;">桶</span>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveNotificationSettings" :loading="saving">
                    保存设置
                  </el-button>
                  <el-button @click="resetNotificationSettings">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- API设置 -->
            <el-tab-pane label="API设置" name="api">
              <el-alert
                title="安全提示"
                type="warning"
                description="API密钥用于系统接口调用，请妥善保管，不要泄露给他人。"
                :closable="false"
                style="margin-bottom: 20px;"
              />

              <el-form
                ref="apiFormRef"
                :model="apiSettings"
                label-width="150px"
                style="max-width: 600px"
              >
                <el-form-item label="API密钥">
                  <el-input
                    v-model="apiSettings.api_key"
                    type="password"
                    show-password
                    placeholder="请输入API密钥"
                  />
                  <div style="margin-top: 5px; color: #909399; font-size: 12px;">
                    用于外部系统接口调用验证
                  </div>
                </el-form-item>

                <el-form-item label="消息接口">
                  <el-switch v-model="apiSettings.message_api_enabled" />
                  <span style="margin-left: 10px; color: #909399;">
                    {{ apiSettings.message_api_enabled ? '已启用' : '已禁用' }}
                  </span>
                </el-form-item>

                <el-form-item label="接口调用日志">
                  <el-switch v-model="apiSettings.enable_api_logging" />
                </el-form-item>

                <el-form-item label="频率限制">
                  <el-input-number
                    v-model="apiSettings.rate_limit"
                    :min="1"
                  />
                  <span style="margin-left: 10px; color: #909399;">次/分钟</span>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveAPISettings" :loading="saving">
                    保存设置
                  </el-button>
                  <el-button @click="resetAPISettings">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 数据备份 -->
            <el-tab-pane label="数据备份" name="backup">
              <el-alert
                title="数据备份说明"
                type="info"
                description="定期备份数据可以防止数据丢失。建议每天至少备份一次。"
                :closable="false"
                style="margin-bottom: 20px;"
              />

              <div class="backup-actions">
                <el-button type="primary" @click="exportData" :loading="exporting">
                  <el-icon><Download /></el-icon>
                  导出数据
                </el-button>
                <el-button @click="openImportDialog">
                  <el-icon><Upload /></el-icon>
                  导入数据
                </el-button>
              </div>

              <el-divider>备份历史</el-divider>

              <el-table :data="backupHistory" stripe border>
                <el-table-column prop="filename" label="文件名" min-width="200" />
                <el-table-column prop="file_size" label="文件大小" width="120" />
                <el-table-column prop="created_at" label="备份时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" @click="restoreBackup(row)">恢复</el-button>
                    <el-button size="small" type="danger" @click="deleteBackup(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入数据对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入数据" width="500px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".json"
        @change="handleFileChange"
      >
        <el-button type="primary">选择文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            只能上传JSON格式文件，请选择之前导出的数据文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import * as settingsApi from '@/api/settings'

// ========== 数据 ==========
const activeTab = ref('basic')
const saving = ref(false)
const exporting = ref(false)
const importing = ref(false)

// 基本设置
const basicFormRef = ref(null)
const basicSettings = reactive({
  system_name: '',
  contact_phone: '',
  service_hours: '',
  default_delivery_fee: 0,
  min_order_quantity: 1,
  announcement: ''
})
const basicRules = {
  system_name: [{ required: true, message: '请输入系统名称', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 界面设置
const uiFormRef = ref(null)
const uiSettings = reactive({
  theme_color: '#409EFF',
  font_size: 'medium',
  sidebar_collapsed: false,
  show_logo: true,
  page_size: 20
})

// 通知设置
const notificationFormRef = ref(null)
const notificationSettings = reactive({
  new_order_notify: true,
  order_complete_notify: true,
  low_stock_notify: true,
  low_stock_threshold: 10,
  owed_bucket_notify: true,
  owed_bucket_threshold: 5
})

// API设置
const apiFormRef = ref(null)
const apiSettings = reactive({
  api_key: '',
  message_api_enabled: true,
  enable_api_logging: true,
  rate_limit: 60
})

// 数据备份
const importDialogVisible = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)
const backupHistory = ref([])

// ========== 方法 ==========
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const loadSettings = async () => {
  try {
    const [basic, ui, notification, api] = await Promise.all([
      settingsApi.getSettings('basic'),
      settingsApi.getSettings('ui'),
      settingsApi.getSettings('notification'),
      settingsApi.getSettings('api')
    ])

    Object.assign(basicSettings, basic)
    Object.assign(uiSettings, ui)
    Object.assign(notificationSettings, notification)
    Object.assign(apiSettings, api)
  } catch (error) {
    ElMessage.error('加载设置失败：' + error.message)
  }
}

const loadBackupHistory = async () => {
  try {
    const history = await settingsApi.getBackupHistory()
    backupHistory.value = history
  } catch (error) {
    console.error('加载备份历史失败', error)
  }
}

const saveBasicSettings = async () => {
  const valid = await basicFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await settingsApi.saveSettings('basic', basicSettings)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

const resetBasicSettings = async () => {
  basicFormRef.value?.resetFields()
  loadSettings()
}

const saveUISettings = async () => {
  saving.value = true
  try {
    await settingsApi.saveSettings('ui', uiSettings)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

const resetUISettings = () => {
  loadSettings()
}

const saveNotificationSettings = async () => {
  saving.value = true
  try {
    await settingsApi.saveSettings('notification', notificationSettings)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

const resetNotificationSettings = () => {
  loadSettings()
}

const saveAPISettings = async () => {
  saving.value = true
  try {
    await settingsApi.saveSettings('api', apiSettings)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

const resetAPISettings = () => {
  loadSettings()
}

const exportData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要导出所有数据吗？这可能需要一些时间。',
      '提示',
      { type: 'info' }
    )

    exporting.value = true
    const data = await settingsApi.exportData()

    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `water-delivery-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
    loadBackupHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败：' + error.message)
    }
  } finally {
    exporting.value = false
  }
}

const openImportDialog = () => {
  selectedFile.value = null
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const confirmImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要导入数据吗？这将覆盖现有数据！',
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    importing.value = true
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        await settingsApi.importData(data)
        ElMessage.success('导入成功，正在重新加载...')
        setTimeout(() => {
          location.reload()
        }, 1500)
      } catch (error) {
        ElMessage.error('数据格式错误：' + error.message)
        importing.value = false
      }
    }
    reader.readAsText(selectedFile.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导入失败：' + error.message)
    }
    importing.value = false
  }
}

const restoreBackup = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复此备份吗？这将覆盖现有数据！',
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    await settingsApi.restoreBackup(row.id)
    ElMessage.success('恢复成功，正在重新加载...')
    setTimeout(() => {
      location.reload()
    }, 1500)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败：' + error.message)
    }
  }
}

const deleteBackup = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此备份吗？', '警告', { type: 'warning' })
    await settingsApi.deleteBackup(row.id)
    ElMessage.success('删除成功')
    loadBackupHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadSettings()
  loadBackupHistory()
})
</script>

<style scoped>
.settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.backup-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.el-form :deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
