<template>
  <div class="deliveryman-detail" v-loading="loading">
    <!-- 基本信息 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button size="small" @click="openEditDialog">编辑</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="送水工ID">{{ deliveryman.id }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ deliveryman.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ deliveryman.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ deliveryman.id_card || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ formatDate(deliveryman.join_date) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="deliveryman.status === 'active' ? 'success' : 'info'">
            {{ deliveryman.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="配送区域" :span="2">
          {{ deliveryman.delivery_area || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ deliveryman.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 送水工统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总订单数</div>
            <div class="stat-value">{{ statistics.total_orders }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">今日订单</div>
            <div class="stat-value">{{ statistics.today_orders }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月订单</div>
            <div class="stat-value">{{ statistics.month_orders }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总配送桶数</div>
            <div class="stat-value">{{ statistics.total_buckets }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 配送记录 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>配送记录</span>
          <el-select v-model="statusFilter" placeholder="订单状态" style="width=" 150px">
            <el-option label="全部" value="" />
            <el-option label="待配送" value="assigned" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>
      </template>
      <el-table :data="orders" stripe border>
        <el-table-column prop="id" label="订单号" width="100" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="product_name" label="产品" width="120" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="address" label="配送地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">
              {{ getOrderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑基本信息对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑送水工信息" width="600px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="editForm.id_card" />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-date-picker
            v-model="editForm.join_date"
            type="date"
            placeholder="选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="配送区域">
          <el-input v-model="editForm.delivery_area" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as deliverymanApi from '@/api/deliverymen'

const props = defineProps({
  deliverymanId: {
    type: Number,
    required: true
  }
})

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const deliveryman = ref({})
const statistics = ref({})
const orders = ref([])
const statusFilter = ref('')

// 编辑基本信息
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  name: '',
  phone: '',
  id_card: '',
  join_date: '',
  delivery_area: '',
  status: 'active',
  notes: ''
})
const editRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  id_card: [
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

// ========== 方法 ==========
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const getOrderStatusText = (status) => {
  const map = {
    assigned: '待配送',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getOrderStatusType = (status) => {
  const map = {
    assigned: 'warning',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const loadDeliverymanData = async () => {
  loading.value = true
  try {
    const [dmRes, statsRes, orderRes] = await Promise.all([
      deliverymanApi.getDeliveryman(props.deliverymanId),
      deliverymanApi.getDeliverymanStatistics(props.deliverymanId),
      deliverymanApi.getDeliverymanOrders(props.deliverymanId, { status: statusFilter.value })
    ])
    deliveryman.value = dmRes
    statistics.value = statsRes
    orders.value = orderRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const openEditDialog = () => {
  Object.assign(editForm, {
    name: deliveryman.value.name,
    phone: deliveryman.value.phone,
    id_card: deliveryman.value.id_card || '',
    join_date: deliveryman.value.join_date ? new Date(deliveryman.value.join_date) : '',
    delivery_area: deliveryman.value.delivery_area || '',
    status: deliveryman.value.status,
    notes: deliveryman.value.notes || ''
  })
  editDialogVisible.value = true
}

const saveEdit = async () => {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      ...editForm,
      join_date: editForm.join_date ? editForm.join_date.toISOString().split('T')[0] : null
    }
    await deliverymanApi.updateDeliveryman(props.deliverymanId, data)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadDeliverymanData()
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const viewOrder = (row) => {
  console.log('查看订单', row.id)
  // TODO: 跳转到订单详情页
}

// ========== 监听器 ==========
watch(statusFilter, () => {
  loadDeliverymanData()
})

// ========== 生命周期 ==========
onMounted(() => {
  loadDeliverymanData()
})
</script>

<style scoped>
.deliveryman-detail {
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

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}
</style>
