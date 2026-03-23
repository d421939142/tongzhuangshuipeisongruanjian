<template>
  <div class="history-page">
    <div class="page-header">
      <h2>配送记录</h2>
    </div>

    <div class="history-list" v-loading="loading">
      <div v-if="orders.length === 0" class="empty-state">
        <el-icon><DocumentCopy /></el-icon>
        <p>暂无配送记录</p>
      </div>

      <div v-else>
        <div
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          @click="showOrderDetail(order)"
        >
          <div class="order-header">
            <span class="order-id">#{{ order.id }}</span>
            <span class="order-time">{{ formatTime(order.completed_at) }}</span>
          </div>

          <div class="order-content">
            <div class="customer-info">
              <el-icon><User /></el-icon>
              <span>{{ order.customer_name }}</span>
            </div>

            <div class="product-info">
              <el-icon><Box /></el-icon>
              <span>{{ order.product_name }} x {{ order.quantity }}桶</span>
            </div>

            <div class="address-info">
              <el-icon><Location /></el-icon>
              <span class="address-text">{{ order.address }}</span>
            </div>
          </div>

          <div class="order-footer">
            <span class="price">¥{{ order.total_price?.toFixed(2) }}</span>
            <el-tag type="success">已完成</el-tag>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentCopy, User, Box, Location, List, Clock } from '@element-plus/icons-vue'
import * as taskApi from '@/api/tasks'

const router = useRouter()

// ========== 数据 ==========
const loading = ref(false)
const activeNav = ref('history')
const orders = ref([])

// ========== 方法 ==========
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await taskApi.getDeliveryHistory({ status: 'completed' })
    orders.value = response
  } catch (error) {
    console.error('加载记录失败', error)
  } finally {
    loading.value = false
  }
}

const showOrderDetail = (order) => {
  // TODO: 显示订单详情
  console.log('订单详情', order.id)
}

const switchNav = (nav) => {
  router.push(`/${nav}`)
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  padding: 20px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  padding-bottom: 80px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.order-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #EBEEF5;
}

.order-id {
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
}

.order-time {
  font-size: 12px;
  color: #909399;
}

.order-content {
  margin-bottom: 12px;
}

.customer-info,
.product-info,
.address-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.customer-info .icon,
.product-info .icon,
.address-info .icon {
  margin-right: 8px;
  color: #909399;
}

.address-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #EBEEF5;
}

.order-footer .price {
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
