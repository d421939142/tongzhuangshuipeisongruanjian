<template>
  <div class="order-detail" v-loading="loading">
    <!-- 基本信息 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>订单信息</span>
          <el-tag :type="getOrderStatusType(order.status)" size="large">
            {{ getOrderStatusText(order.status) }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.id }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ order.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ order.customer_phone }}</el-descriptions-item>
        <el-descriptions-item label="产品">{{ order.product_name }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ order.quantity }}桶</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ order.unit_price?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">
          <span style="color: #F56C6C; font-weight: bold; font-size: 18px;">
            ¥{{ order.total_price?.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="配送地址" :span="2">
          {{ order.address }}
        </el-descriptions-item>
        <el-descriptions-item label="预约配送时间">
          {{ formatDate(order.scheduled_delivery_time) || '未预约' }}
        </el-descriptions-item>
        <el-descriptions-item label="送水工">
          {{ order.deliveryman_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实际配送时间" :span="2">
          {{ formatDate(order.completed_at) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ order.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="section-card" v-if="canEdit">
      <div class="action-buttons">
        <el-button
          v-if="order.status === 'pending'"
          type="primary"
          @click="openAssignDialog"
        >
          分配送水工
        </el-button>
        <el-button
          v-if="['assigned', 'delivering'].includes(order.status)"
          type="warning"
          @click="handleWithdraw"
        >
          撤回订单
        </el-button>
        <el-button
          v-if="order.status === 'delivering'"
          type="success"
          @click="handleComplete"
        >
          完成配送
        </el-button>
        <el-button
          v-if="['pending', 'assigned'].includes(order.status)"
          type="danger"
          @click="handleCancel"
        >
          取消订单
        </el-button>
        <el-button
          v-if="order.status === 'completed'"
          type="danger"
          @click="handleDelete"
        >
          删除订单
        </el-button>
      </div>
    </el-card>

    <!-- 空桶回收记录 -->
    <el-card class="section-card">
      <template #header>
        <span>空桶回收</span>
      </template>
      <el-table :data="bucketReturns" stripe border>
        <el-table-column prop="quantity" label="回收数量" width="120" align="center">
          <template #default="{ row }">
            {{ row.quantity }}桶
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'returned' ? 'success' : 'warning'">
              {{ row.status === 'returned' ? '已回收' : '未回收' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="200" />
        <el-table-column prop="created_at" label="记录时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作日志 -->
    <el-card class="section-card">
      <template #header>
        <span>操作日志</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="log in operationLogs"
          :key="log.id"
          :timestamp="formatDate(log.created_at)"
          placement="top"
        >
          <el-tag size="small">{{ log.operation }}</el-tag>
          <span style="margin-left: 10px;">{{ log.details || '' }}</span>
          <div style="margin-top: 5px; color: #909399; font-size: 12px;">
            操作人：{{ log.operator_name }}
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 分配送水工对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配送水工" width="500px">
      <el-form label-width="100px">
        <el-form-item label="送水工">
          <el-select v-model="assignDeliverymanId" placeholder="选择送水工" style="width: 100%">
            <el-option
              v-for="item in deliverymanOptions"
              :key="item.id"
              :label="`${item.name} (${item.phone})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign" :loading="submitting">确定分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as orderApi from '@/api/orders'
import * as deliverymanApi from '@/api/deliverymen'

const props = defineProps({
  orderId: {
    type: Number,
    required: true
  }
})

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const order = ref({})
const bucketReturns = ref([])
const operationLogs = ref([])

const assignDialogVisible = ref(false)
const assignDeliverymanId = ref(null)
const deliverymanOptions = ref([])

// ========== 计算属性 ==========
const canEdit = computed(() => {
  return ['pending', 'assigned', 'delivering', 'completed'].includes(order.value.status)
})

// ========== 方法 ==========
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getOrderStatusText = (status) => {
  const map = {
    pending: '待分配',
    assigned: '待配送',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getOrderStatusType = (status) => {
  const map = {
    pending: 'info',
    assigned: 'warning',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const loadOrderData = async () => {
  loading.value = true
  try {
    const [orderRes, returnsRes, logsRes] = await Promise.all([
      orderApi.getOrder(props.orderId),
      orderApi.getOrderBucketReturns(props.orderId),
      orderApi.getOrderLogs(props.orderId)
    ])
    order.value = orderRes
    bucketReturns.value = returnsRes
    operationLogs.value = logsRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const openAssignDialog = async () => {
  try {
    const deliverymen = await deliverymanApi.getDeliverymen({ status: 'active', pageSize: 100 })
    deliverymanOptions.value = deliverymen.data
    assignDeliverymanId.value = null
    assignDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载送水工失败：' + error.message)
  }
}

const confirmAssign = async () => {
  if (!assignDeliverymanId.value) {
    ElMessage.warning('请选择送水工')
    return
  }

  submitting.value = true
  try {
    await orderApi.assignOrder(props.orderId, assignDeliverymanId.value)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    loadOrderData()
  } catch (error) {
    ElMessage.error('分配失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const handleWithdraw = async () => {
  try {
    await ElMessageBox.confirm('确定要撤回该订单吗？将恢复客户数据。', '提示', { type: 'warning' })
    await orderApi.withdrawOrder(props.orderId)
    ElMessage.success('撤回成功')
    loadOrderData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤回失败：' + error.message)
    }
  }
}

const handleComplete = async () => {
  try {
    await ElMessageBox.confirm('确定该订单已完成配送吗？', '提示', { type: 'success' })
    await orderApi.completeOrder(props.orderId)
    ElMessage.success('订单已完成')
    loadOrderData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '警告', { type: 'warning' })
    await orderApi.cancelOrder(props.orderId)
    ElMessage.success('订单已取消')
    loadOrderData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败：' + error.message)
    }
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该订单吗？此操作不可恢复！',
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await orderApi.deleteOrder(props.orderId)
    ElMessage.success('删除成功')
    // 关闭抽屉
    window.location.hash = '#/orders'
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadOrderData()
})
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
