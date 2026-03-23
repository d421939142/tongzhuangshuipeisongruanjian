<template>
  <div class="task-list">
    <!-- 顶部统计 -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-value">{{ stats.pending || 0 }}</div>
        <div class="stat-label">待配送</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.delivering || 0 }}</div>
        <div class="stat-label">配送中</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.completed || 0 }}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>

    <!-- 筛选标签 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="task-tabs">
      <el-tab-pane label="待配送" name="assigned">
        <template #label>
          <span class="tab-label">
            待配送
            <el-badge v-if="stats.pending > 0" :value="stats.pending" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="配送中" name="delivering">
        <template #label>
          <span class="tab-label">
            配送中
            <el-badge v-if="stats.delivering > 0" :value="stats.delivering" class="tab-badge" />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <!-- 任务列表 -->
    <div class="task-container" v-loading="loading">
      <div v-if="tasks.length === 0" class="empty-state">
        <el-icon><DocumentCopy /></el-icon>
        <p>暂无配送任务</p>
      </div>

      <div v-else class="task-list-scroll">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-card"
          @click="showTaskDetail(task)"
        >
          <div class="task-header">
            <span class="task-id">#{{ task.id }}</span>
            <span class="task-time">{{ formatTime(task.created_at) }}</span>
          </div>

          <div class="task-content">
            <div class="customer-info">
              <el-icon class="icon"><User /></el-icon>
              <span class="name">{{ task.customer_name }}</span>
              <el-tag size="small" type="info">{{ task.customer_phone }}</el-tag>
            </div>

            <div class="product-info">
              <el-icon class="icon"><Box /></el-icon>
              <span>{{ task.product_name }} x {{ task.quantity }}桶</span>
            </div>

            <div class="address-info">
              <el-icon class="icon"><Location /></el-icon>
              <span class="address-text">{{ task.address }}</span>
            </div>

            <div v-if="task.scheduled_delivery_time" class="schedule-info">
              <el-icon class="icon"><Clock /></el-icon>
              <span>预约时间：{{ formatTime(task.scheduled_delivery_time) }}</span>
            </div>

            <div v-if="task.notes" class="notes-info">
              <el-icon class="icon"><ChatLineRound /></el-icon>
              <span>{{ task.notes }}</span>
            </div>
          </div>

          <div class="task-footer">
            <div class="price-info">
              <span class="label">金额：</span>
              <span class="amount">¥{{ task.total_price?.toFixed(2) }}</span>
            </div>
            <el-button
              v-if="task.status === 'assigned'"
              type="primary"
              size="small"
              @click.stop="startDelivery(task)"
            >
              开始配送
            </el-button>
            <el-button
              v-if="task.status === 'delivering'"
              type="success"
              size="small"
              @click.stop="completeDelivery(task)"
            >
              完成配送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div
        class="nav-item"
        :class="{ active: activeNav === 'tasks' }"
        @click="switchNav('tasks')"
      >
        <el-icon><List /></el-icon>
        <span>任务</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: activeNav === 'history' }"
        @click="switchNav('history')"
      >
        <el-icon><Clock /></el-icon>
        <span>记录</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: activeNav === 'profile' }"
        @click="switchNav('profile')"
      >
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </div>

    <!-- 任务详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="任务详情"
      direction="btt"
      size="80%"
    >
      <TaskDetail v-if="detailDrawerVisible" :task-id="selectedTaskId" @refresh="loadData" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy,
  User,
  Box,
  Location,
  Clock,
  ChatLineRound,
  List
} from '@element-plus/icons-vue'
import * as taskApi from '@/api/tasks'
import TaskDetail from './TaskDetail.vue'

// ========== 数据 ==========
const loading = ref(false)
const activeTab = ref('assigned')
const activeNav = ref('tasks')
const tasks = ref([])
const stats = ref({
  pending: 0,
  delivering: 0,
  completed: 0
})

const detailDrawerVisible = ref(false)
const selectedTaskId = ref(null)

let refreshTimer = null

// ========== 方法 ==========
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return date.toLocaleDateString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    const [tasksRes, statsRes] = await Promise.all([
      taskApi.getMyTasks({ status: activeTab.value }),
      taskApi.getMyStatistics()
    ])
    tasks.value = tasksRes
    stats.value = statsRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  loadData()
}

const startDelivery = async (task) => {
  try {
    await taskApi.startDelivery(task.id)
    ElMessage.success('已开始配送')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  }
}

const completeDelivery = async (task) => {
  try {
    await taskApi.completeDelivery(task.id)
    ElMessage.success('配送已完成')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  }
}

const showTaskDetail = (task) => {
  selectedTaskId.value = task.id
  detailDrawerVisible.value = true
}

const switchNav = (nav) => {
  activeNav.value = nav
  // TODO: 实现页面切换
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
  // 每30秒自动刷新数据
  refreshTimer = setInterval(loadData, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.stats-bar {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.task-tabs {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.task-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.tab-label {
  position: relative;
  display: inline-block;
  padding-right: 15px;
}

.tab-badge :deep(.el-badge__content) {
  position: absolute;
  top: -5px;
  right: 0;
}

.task-container {
  flex: 1;
  overflow: hidden;
  padding: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 16px;
}

.task-list-scroll {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 70px;
}

.task-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
}

.task-card:active {
  transform: scale(0.98);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EBEEF5;
}

.task-id {
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
}

.task-time {
  font-size: 12px;
  color: #909399;
}

.task-content {
  margin-bottom: 12px;
}

.customer-info,
.product-info,
.address-info,
.schedule-info,
.notes-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.customer-info .icon,
.product-info .icon,
.address-info .icon,
.schedule-info .icon,
.notes-info .icon {
  margin-right: 8px;
  margin-top: 2px;
  color: #909399;
}

.customer-info .name {
  margin-right: 8px;
  font-weight: 500;
}

.address-text {
  flex: 1;
  line-height: 1.6;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #EBEEF5;
}

.price-info {
  font-size: 14px;
}

.price-info .label {
  color: #909399;
}

.price-info .amount {
  color: #F56C6C;
  font-weight: bold;
  font-size: 16px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-item.active {
  color: #409EFF;
}

.nav-item .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-item span {
  font-size: 12px;
}
</style>
