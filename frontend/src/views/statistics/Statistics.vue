<template>
  <div class="statistics">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>数据统计</h2>
    </div>

    <!-- 日期筛选 -->
    <el-card class="filter-card">
      <div class="date-filter">
        <el-radio-group v-model="dateRangeType" @change="handleDateRangeChange">
          <el-radio-button label="today">今天</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="dateRangeType === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-left: 10px; width: 280px;"
          @change="handleCustomDateChange"
        />
        <el-button type="primary" @click="loadData" style="margin-left: 10px;">
          刷新
        </el-button>
      </div>
    </el-card>

    <!-- 订单统计 -->
    <el-card class="section-card">
      <template #header>
        <span>订单统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.orders?.total_count || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.orders?.completed_count || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.orders?.pending_count || 0 }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.orders?.total_buckets || 0 }}</div>
              <div class="stat-label">配送桶数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 收款统计 -->
    <el-card class="section-card">
      <template #header>
        <span>收款统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card large">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                ¥{{ statistics.payments?.total_amount?.toFixed(2) || '0.00' }}
              </div>
              <div class="stat-label">总收款</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                ¥{{ statistics.payments?.cash_amount?.toFixed(2) || '0.00' }}
              </div>
              <div class="stat-label">现金收款</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                ¥{{ statistics.payments?.online_amount?.toFixed(2) || '0.00' }}
              </div>
              <div class="stat-label">线上收款</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 客户统计 -->
    <el-card class="section-card">
      <template #header>
        <span>客户统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.customers?.total_count || 0 }}</div>
              <div class="stat-label">总客户数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.customers?.active_count || 0 }}</div>
              <div class="stat-label">活跃客户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon><Ticket /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.customers?.total_tickets || 0 }}</div>
              <div class="stat-label">水票总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.customers?.total_owed_buckets || 0 }}</div>
              <div class="stat-label">欠桶总数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>订单趋势</span>
          </template>
          <div class="chart-container" v-loading="chartLoading">
            <div v-if="orderTrendData.length > 0" class="simple-chart">
              <div class="chart-bars">
                <div
                  v-for="(item, index) in orderTrendData"
                  :key="index"
                  class="chart-bar"
                >
                  <div
                    class="bar-fill"
                    :style="{
                      height: getBarHeight(item.count, orderTrendData) + '%'
                    }"
                  >
                    <span class="bar-value">{{ item.count }}</span>
                  </div>
                  <div class="bar-label">{{ item.label }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>收款趋势</span>
          </template>
          <div class="chart-container" v-loading="chartLoading">
            <div v-if="paymentTrendData.length > 0" class="simple-chart">
              <div class="chart-bars">
                <div
                  v-for="(item, index) in paymentTrendData"
                  :key="index"
                  class="chart-bar"
                >
                  <div
                    class="bar-fill payment"
                    :style="{
                      height: getBarHeight(item.amount, paymentTrendData, true) + '%'
                    }"
                  >
                    <span class="bar-value">¥{{ item.amount }}</span>
                  </div>
                  <div class="bar-label">{{ item.label }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 产品销量排行 -->
    <el-card class="section-card">
      <template #header>
        <span>产品销量排行</span>
      </template>
      <el-table :data="productRanking" stripe border v-loading="chartLoading">
        <el-table-column type="index" label="排名" width="80" align="center" />
        <el-table-column prop="product_name" label="产品名称" min-width="150" />
        <el-table-column prop="total_quantity" label="销量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.total_quantity }}桶</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="销售额" width="150">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold;">
              ¥{{ row.total_amount?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="占比" width="100">
          <template #default="{ row, $index }">
            <el-progress
              :percentage="getProductPercentage(row.total_quantity)"
              :color="$index < 3 ? '#67C23A' : '#409EFF'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 送水工业绩排行 -->
    <el-card class="section-card">
      <template #header>
        <span>送水工业绩排行</span>
      </template>
      <el-table :data="deliverymanRanking" stripe border v-loading="chartLoading">
        <el-table-column type="index" label="排名" width="80" align="center" />
        <el-table-column prop="name" label="送水工" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="total_orders" label="完成订单" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.total_orders }}单</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_buckets" label="配送桶数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.total_buckets }}桶</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="150">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold;">
              ¥{{ row.total_amount?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  CircleCheck,
  Warning,
  Box,
  Money,
  Wallet,
  User,
  UserFilled,
  Ticket
} from '@element-plus/icons-vue'
import * as statisticsApi from '@/api/statistics'

// ========== 数据 ==========
const loading = ref(false)
const chartLoading = ref(false)
const dateRangeType = ref('today')
const customDateRange = ref([])
const statistics = reactive({
  orders: {},
  payments: {},
  customers: {}
})
const orderTrendData = ref([])
const paymentTrendData = ref([])
const productRanking = ref([])
const deliverymanRanking = ref([])

// ========== 方法 ==========
const getDateRange = () => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (dateRangeType.value) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'custom':
      if (customDateRange.value && customDateRange.value.length === 2) {
        start.setTime(customDateRange.value[0].getTime())
        end.setTime(customDateRange.value[1].getTime())
      } else {
        return null
      }
      break
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  }
}

const handleDateRangeChange = () => {
  loadData()
}

const handleCustomDateChange = () => {
  if (customDateRange.value && customDateRange.value.length === 2) {
    loadData()
  }
}

const loadData = async () => {
  const dateRange = getDateRange()
  if (!dateRange) return

  loading.value = true
  chartLoading.value = true
  try {
    const [
      statsRes,
      orderTrendRes,
      paymentTrendRes,
      productRes,
      deliverymanRes
    ] = await Promise.all([
      statisticsApi.getStatistics(dateRange),
      statisticsApi.getOrderTrend(dateRange),
      statisticsApi.getPaymentTrend(dateRange),
      statisticsApi.getProductRanking(dateRange),
      statisticsApi.getDeliverymanRanking(dateRange)
    ])

    Object.assign(statistics, statsRes)
    orderTrendData.value = orderTrendRes
    paymentTrendData.value = paymentTrendRes
    productRanking.value = productRes
    deliverymanRanking.value = deliverymanRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
    chartLoading.value = false
  }
}

const getBarHeight = (value, data, isAmount = false) => {
  if (!data || data.length === 0) return 0
  
  const max = Math.max(...data.map(item => isAmount ? item.amount || 0 : item.count || 0))
  if (max === 0) return 0
  
  return (value / max) * 100
}

const getProductPercentage = (quantity) => {
  if (!productRanking.value || productRanking.value.length === 0) return 0
  
  const total = productRanking.value.reduce((sum, item) => sum + (item.total_quantity || 0), 0)
  if (total === 0) return 0
  
  return Math.round((quantity / total) * 100)
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.statistics {
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

.filter-card {
  margin-bottom: 20px;
}

.date-filter {
  display: flex;
  align-items: center;
}

.section-card {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.large {
  background-color: #f0f9ff;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 32px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-chart {
  width: 100%;
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 250px;
  gap: 20px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 60px;
}

.bar-fill {
  width: 100%;
  min-height: 4px;
  background: linear-gradient(180deg, #409EFF 0%, #66B1FF 100%);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  transition: all 0.3s;
  position: relative;
}

.bar-fill.payment {
  background: linear-gradient(180deg, #67C23A 0%, #85CE61 100%);
}

.bar-fill:hover {
  opacity: 0.8;
}

.bar-value {
  font-size: 12px;
  color: white;
  font-weight: bold;
  position: absolute;
  bottom: 5px;
  width: 100%;
  text-align: center;
}

.bar-label {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}
</style>
