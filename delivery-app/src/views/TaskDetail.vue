<template>
  <div class="task-detail" v-loading="loading">
    <div v-if="task">
      <!-- 订单信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-tag :type="getStatusType(task.status)" size="large">
              {{ getStatusText(task.status) }}
            </el-tag>
          </div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">#{{ task.id }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(task.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ task.customer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            <a :href="'tel:' + task.customer_phone" class="phone-link">
              {{ task.customer_phone }}
            </a>
          </el-descriptions-item>
          <el-descriptions-item label="产品">
            {{ task.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="数量">
            {{ task.quantity }}桶
          </el-descriptions-item>
          <el-descriptions-item label="单价">
            ¥{{ task.unit_price?.toFixed(2) }}
          </el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="total-price">¥{{ task.total_price?.toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 配送信息 -->
      <el-card class="detail-card">
        <template #header>
          <span>配送信息</span>
        </template>
        <div class="delivery-info">
          <div class="info-row">
            <el-icon class="icon"><Location /></el-icon>
            <div class="info-content">
              <div class="label">配送地址</div>
              <div class="value">{{ task.address }}</div>
            </div>
          </div>

          <div v-if="task.scheduled_delivery_time" class="info-row">
            <el-icon class="icon"><Clock /></el-icon>
            <div class="info-content">
              <div class="label">预约时间</div>
              <div class="value">{{ formatDateTime(task.scheduled_delivery_time) }}</div>
            </div>
          </div>

          <div v-if="task.started_at" class="info-row">
            <el-icon class="icon"><Timer /></el-icon>
            <div class="info-content">
              <div class="label">开始时间</div>
              <div class="value">{{ formatDateTime(task.started_at) }}</div>
            </div>
          </div>

          <div v-if="task.completed_at" class="info-row">
            <el-icon class="icon"><CircleCheck /></el-icon>
            <div class="info-content">
              <div class="label">完成时间</div>
              <div class="value">{{ formatDateTime(task.completed_at) }}</div>
            </div>
          </div>

          <div v-if="task.notes" class="info-row">
            <el-icon class="icon"><ChatLineRound /></el-icon>
            <div class="info-content">
              <div class="label">备注信息</div>
              <div class="value">{{ task.notes }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 空桶回收 -->
      <el-card class="detail-card" v-if="task.status !== 'completed'">
        <template #header>
          <span>空桶回收</span>
        </template>
        <el-form label-width="100px">
          <el-form-item label="回收数量">
            <el-input-number
              v-model="bucketReturn.quantity"
              :min="0"
              :max="task.quantity"
              style="width: 150px"
            />
            <span style="margin-left: 10px; color: #909399;">桶</span>
          </el-form-item>
          <el-form-item label="回收状态">
            <el-radio-group v-model="bucketReturn.status">
              <el-radio label="pending">未回收</el-radio>
              <el-radio label="returned">已回收</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="bucketReturn.notes"
              placeholder="请输入备注信息"
              type="textarea"
              :rows="2"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 空桶回收记录 -->
      <el-card class="detail-card" v-if="bucketReturns.length > 0">
        <template #header>
          <span>回收记录</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in bucketReturns"
            :key="index"
            :timestamp="formatDateTime(item.created_at)"
            placement="top"
          >
            <div>
              <el-tag :type="item.status === 'returned' ? 'success' : 'warning'" size="small">
                {{ item.status === 'returned' ? '已回收' : '未回收' }}
              </el-tag>
              <span style="margin-left: 10px;">{{ item.quantity }}桶</span>
            </div>
            <div v-if="item.notes" style="margin-top: 5px; color: #909399; font-size: 12px;">
              {{ item.notes }}
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          v-if="task.status === 'assigned'"
          type="primary"
          size="large"
          style="width: 100%"
          @click="handleStartDelivery"
          :loading="submitting"
        >
          <el-icon><Van /></el-icon>
          开始配送
        </el-button>

        <el-button
          v-if="task.status === 'delivering'"
          type="success"
          size="large"
          style="width: 100%"
          @click="handleCompleteDelivery"
          :loading="submitting"
        >
          <el-icon><CircleCheck /></el-icon>
          完成配送
        </el-button>
      </div>
    </div>

    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Location,
  Clock,
  Timer,
  CircleCheck,
  ChatLineRound,
  Van
} from '@element-plus/icons-vue'
import * as taskApi from '@/api/tasks'

const props = defineProps({
  taskId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['refresh'])

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const task = ref(null)
const bucketReturns = ref([])

const bucketReturn = reactive({
  quantity: 0,
  status: 'pending',
  notes: ''
})

// ========== 方法 ==========
const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusText = (status) => {
  const map = {
    assigned: '待配送',
    delivering: '配送中',
    completed: '已完成'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    assigned: 'warning',
    delivering: 'primary',
    completed: 'success'
  }
  return map[status] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const [taskRes, returnsRes] = await Promise.all([
      taskApi.getTaskDetail(props.taskId),
      taskApi.getTaskBucketReturns(props.taskId)
    ])
    task.value = taskRes
    bucketReturns.value = returnsRes
    
    // 设置默认回收数量
    bucketReturn.quantity = taskRes.owed_buckets || 0
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const handleStartDelivery = async () => {
  submitting.value = true
  try {
    await taskApi.startDelivery(props.taskId)
    ElMessage.success('已开始配送')
    emit('refresh')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const handleCompleteDelivery = async () => {
  submitting.value = true
  try {
    // 如果有回收空桶，先保存回收记录
    if (bucketReturn.quantity > 0) {
      await taskApi.saveBucketReturn({
        order_id: props.taskId,
        ...bucketReturn
      })
    }

    await taskApi.completeDelivery(props.taskId)
    ElMessage.success('配送已完成')
    emit('refresh')
    // 返回列表
    window.history.back()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.task-detail {
  padding: 15px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.detail-card {
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price {
  color: #F56C6C;
  font-weight: bold;
  font-size: 18px;
}

.delivery-info {
  padding: 10px 0;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .icon {
  font-size: 20px;
  color: #409EFF;
  margin-right: 12px;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-content .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.info-content .value {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.phone-link {
  color: #409EFF;
  text-decoration: none;
}

.phone-link:active {
  color: #66b1ff;
}

.action-buttons {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background-color: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>
