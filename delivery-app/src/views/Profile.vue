<template>
  <div class="profile-page">
    <!-- 用户信息 -->
    <div class="user-header">
      <div class="avatar">
        <el-icon><User /></el-icon>
      </div>
      <div class="user-info">
        <h3>{{ user.name }}</h3>
        <p>{{ user.phone }}</p>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-value">{{ statistics.total_orders || 0 }}</div>
        <div class="stat-label">总订单</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ statistics.total_buckets || 0 }}</div>
        <div class="stat-label">总桶数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">¥{{ statistics.total_amount?.toFixed(2) || '0.00' }}</div>
        <div class="stat-label">总金额</div>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="menu-section">
      <div class="menu-item">
        <el-icon><Document /></el-icon>
        <span>配送记录</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      <p>版本 1.0.0</p>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  User,
  Document,
  SwitchButton,
  ArrowRight,
  List,
  Clock
} from '@element-plus/icons-vue'
import * as taskApi from '@/api/tasks'

const router = useRouter()

// ========== 数据 ==========
const activeNav = ref('profile')
const user = reactive({
  name: '',
  phone: ''
})
const statistics = reactive({
  total_orders: 0,
  total_buckets: 0,
  total_amount: 0
})

// ========== 方法 ==========
const loadUserData = () => {
  const userInfo = localStorage.getItem('delivery_user')
  if (userInfo) {
    Object.assign(user, JSON.parse(userInfo))
  }
}

const loadStatistics = async () => {
  try {
    const stats = await taskApi.getMyStatistics()
    Object.assign(statistics, stats)
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      { type: 'warning' }
    )

    localStorage.removeItem('delivery_token')
    localStorage.removeItem('delivery_user')
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}

const switchNav = (nav) => {
  router.push(`/${nav}`)
}

// ========== 生命周期 ==========
onMounted(() => {
  loadUserData()
  loadStatistics()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.avatar {
  width: 64px;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.avatar .el-icon {
  font-size: 32px;
  color: white;
}

.user-info h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
}

.user-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.stats-section {
  display: flex;
  background-color: white;
  margin: 15px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.menu-section {
  background-color: white;
  margin: 0 15px 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #EBEEF5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  margin-right: 12px;
  color: #409EFF;
  font-size: 20px;
}

.menu-item .arrow {
  margin-left: auto;
  color: #C0C4CC;
}

.version-info {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 12px;
}

.version-info p {
  margin: 0;
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
