<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff">
              <el-icon><DocumentCopy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.todayRevenue }}</div>
              <div class="stat-label">今日营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeCustomers }}</div>
              <div class="stat-label">活跃客户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f56c6c">
              <el-icon><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeDeliverymen }}</div>
              <div class="stat-label">活跃送水工</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近期订单</span>
              <el-button text @click="router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="orderNumber" label="订单号" width="120" />
            <el-table-column prop="customerName" label="客户" width="100" />
            <el-table-column prop="productBrand" label="产品" width="120" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.totalAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" icon="Plus" @click="router.push('/orders')">
              新建订单
            </el-button>
            <el-button type="success" icon="User" @click="router.push('/customers')">
              新建客户
            </el-button>
            <el-button type="warning" icon="Van" @click="router.push('/deliverymen')">
              新建送水工
            </el-button>
            <el-button type="info" icon="DataAnalysis" @click="router.push('/statistics')">
              查看统计
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi, statisticsApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const stats = ref({
  totalOrders: 0,
  todayRevenue: 0,
  activeCustomers: 0,
  activeDeliverymen: 0
})

const recentOrders = ref([])

const loadStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [ordersData, paymentsData, customersData, deliverymenData] = await Promise.all([
      orderApi.getList({ status: 'completed' }),
      statisticsApi.getPayments({ startDate: today, endDate: today }),
      statisticsApi.getCustomers(),
      orderApi.getList({ status: 'delivering' })
    ])

    // 今日订单
    stats.value.totalOrders = ordersData.filter(order => {
      return order.createTime.startsWith(today)
    }).length

    // 今日营收
    stats.value.todayRevenue = paymentsData.totalAmount || 0

    // 活跃客户
    stats.value.activeCustomers = customersData.activeCustomers

    // 活跃送水工
    const deliverymanIds = [...new Set(deliverymenData.map(o => o.deliverymanId))]
    stats.value.activeDeliverymen = deliverymanIds.length

    // 最近订单
    recentOrders.value = ordersData.slice(0, 10)
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const getStatusType = (status) => {
  const types = {
    pending: '',
    assigned: 'warning',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    pending: '待分配',
    assigned: '已分配',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.content-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-actions .el-button {
  justify-content: flex-start;
}
</style>
