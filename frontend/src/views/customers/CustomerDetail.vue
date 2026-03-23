<template>
  <div class="customer-detail" v-loading="loading">
    <!-- 基本信息 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button size="small" @click="openEditDialog">编辑</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="客户ID">{{ customer.id }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ customer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ customer.phone }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(customer.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="默认地址" :span="2">
          {{ customer.address }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ customer.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 客户统计 -->
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
            <div class="stat-label">总配送桶数</div>
            <div class="stat-value">{{ statistics.total_buckets }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总金额</div>
            <div class="stat-value">¥{{ statistics.total_amount?.toFixed(2) || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">最近下单</div>
            <div class="stat-value small">{{ formatDate(statistics.last_order_time) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资产信息 -->
    <el-row :gutter="20" class="assets-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>水票</span>
          </template>
          <div class="asset-content">
            <div class="asset-value">{{ customer.water_tickets || 0 }} <span class="unit">桶</span></div>
            <el-button size="small" @click="openWaterTicketDialog">调整</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>欠桶</span>
          </template>
          <div class="asset-content">
            <div class="asset-value" :class="{ warning: customer.owed_buckets > 0 }">
              {{ customer.owed_buckets || 0 }} <span class="unit">桶</span>
            </div>
            <el-button size="small" @click="openOwedBucketDialog">调整</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 地址管理 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>地址列表</span>
          <el-button size="small" type="primary" @click="openAddressDialog('create')">
            新增地址
          </el-button>
        </div>
      </template>
      <el-table :data="addresses" stripe border>
        <el-table-column prop="address" label="地址" min-width="250" />
        <el-table-column label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_default ? 'success' : 'info'">
              {{ row.is_default ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openAddressDialog('edit', row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAddress(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 历史订单 -->
    <el-card class="section-card">
      <template #header>
        <span>历史订单</span>
      </template>
      <el-table :data="orders" stripe border>
        <el-table-column prop="id" label="订单号" width="100" />
        <el-table-column prop="product_name" label="产品" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="total_price" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.total_price?.toFixed(2) }}
          </template>
        </el-table-column>
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
    <el-dialog v-model="editDialogVisible" title="编辑客户信息" width="600px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" />
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

    <!-- 水票调整对话框 -->
    <el-dialog v-model="waterTicketDialogVisible" title="调整水票" width="400px">
      <el-form ref="waterTicketFormRef" :model="waterTicketForm" :rules="waterTicketRules">
        <el-form-item label="当前水票">
          <el-tag type="success">{{ customer.water_tickets }}桶</el-tag>
        </el-form-item>
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="waterTicketForm.type">
            <el-radio label="add">增加</el-radio>
            <el-radio label="reduce">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number v-model="waterTicketForm.quantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="waterTicketDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="adjustWaterTicket" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 欠桶调整对话框 -->
    <el-dialog v-model="owedBucketDialogVisible" title="调整欠桶" width="400px">
      <el-form ref="owedBucketFormRef" :model="owedBucketForm" :rules="owedBucketRules">
        <el-form-item label="当前欠桶">
          <el-tag :type="customer.owed_buckets > 0 ? 'warning' : 'info'">
            {{ customer.owed_buckets }}桶
          </el-tag>
        </el-form-item>
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="owedBucketForm.type">
            <el-radio label="add">增加欠桶</el-radio>
            <el-radio label="reduce">减少欠桶</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number v-model="owedBucketForm.quantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="owedBucketDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="adjustOwedBucket" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 地址编辑对话框 -->
    <el-dialog v-model="addressDialogVisible" :title="addressDialogTitle" width="600px">
      <el-form ref="addressFormRef" :model="addressForm" :rules="addressRules" label-width="100px">
        <el-form-item label="省/市/区" prop="address_path">
          <el-cascader
            v-model="addressForm.address_path"
            :options="addressOptions"
            :props="{ expandTrigger: 'hover' }"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail_address">
          <el-input v-model="addressForm.detail_address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.is_default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as customerApi from '@/api/customers'

const props = defineProps({
  customerId: {
    type: Number,
    required: true
  }
})

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const customer = ref({})
const statistics = ref({})
const addresses = ref([])
const orders = ref([])

// 编辑基本信息
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  name: '',
  phone: '',
  notes: ''
})
const editRules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 水票调整
const waterTicketDialogVisible = ref(false)
const waterTicketFormRef = ref(null)
const waterTicketForm = reactive({
  type: 'add',
  quantity: 1
})
const waterTicketRules = {
  quantity: [{ required: true, message: '请输入调整数量', trigger: 'blur' }]
}

// 欠桶调整
const owedBucketDialogVisible = ref(false)
const owedBucketFormRef = ref(null)
const owedBucketForm = reactive({
  type: 'add',
  quantity: 1
})
const owedBucketRules = {
  quantity: [{ required: true, message: '请输入调整数量', trigger: 'blur' }]
}

// 地址管理
const addressDialogVisible = ref(false)
const addressDialogMode = ref('create')
const addressFormRef = ref(null)
const addressForm = reactive({
  address_path: [],
  detail_address: '',
  is_default: false
})
const addressRules = {
  address_path: [{ required: true, message: '请选择省/市/区', trigger: 'change' }],
  detail_address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const addressOptions = [
  {
    value: '甘肃省',
    label: '甘肃省',
    children: [
      {
        value: '兰州市',
        label: '兰州市',
        children: [
          { value: '城关区', label: '城关区' },
          { value: '七里河区', label: '七里河区' },
          { value: '西固区', label: '西固区' },
          { value: '安宁区', label: '安宁区' },
          { value: '红古区', label: '红古区' },
          { value: '永登县', label: '永登县' },
          { value: '皋兰县', label: '皋兰县' },
          { value: '榆中县', label: '榆中县' }
        ]
      }
    ]
  }
]

// ========== 计算属性 ==========
const addressDialogTitle = computed(() => {
  return addressDialogMode.value === 'create' ? '新增地址' : '编辑地址'
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

const loadCustomerData = async () => {
  loading.value = true
  try {
    const [customerRes, statsRes, addressRes, orderRes] = await Promise.all([
      customerApi.getCustomer(props.customerId),
      customerApi.getCustomerStatistics(props.customerId),
      customerApi.getCustomerAddresses(props.customerId),
      customerApi.getCustomerOrders(props.customerId)
    ])
    customer.value = customerRes
    statistics.value = statsRes
    addresses.value = addressRes
    orders.value = orderRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const openEditDialog = () => {
  Object.assign(editForm, {
    name: customer.value.name,
    phone: customer.value.phone,
    notes: customer.value.notes || ''
  })
  editDialogVisible.value = true
}

const saveEdit = async () => {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await customerApi.updateCustomer(props.customerId, editForm)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadCustomerData()
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const openWaterTicketDialog = () => {
  waterTicketForm.type = 'add'
  waterTicketForm.quantity = 1
  waterTicketDialogVisible.value = true
}

const adjustWaterTicket = async () => {
  const valid = await waterTicketFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await customerApi.adjustWaterTicket(props.customerId, waterTicketForm)
    ElMessage.success('调整成功')
    waterTicketDialogVisible.value = false
    loadCustomerData()
  } catch (error) {
    ElMessage.error('调整失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const openOwedBucketDialog = () => {
  owedBucketForm.type = 'add'
  owedBucketForm.quantity = 1
  owedBucketDialogVisible.value = true
}

const adjustOwedBucket = async () => {
  const valid = await owedBucketFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await customerApi.adjustOwedBucket(props.customerId, owedBucketForm)
    ElMessage.success('调整成功')
    owedBucketDialogVisible.value = false
    loadCustomerData()
  } catch (error) {
    ElMessage.error('调整失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const openAddressDialog = (mode, row) => {
  addressDialogMode.value = mode
  if (mode === 'edit' && row) {
    addressForm.address_path = row.address_path || []
    addressForm.detail_address = row.detail_address || ''
    addressForm.is_default = row.is_default || false
  } else {
    addressForm.address_path = []
    addressForm.detail_address = ''
    addressForm.is_default = false
  }
  addressDialogVisible.value = true
}

const saveAddress = async () => {
  const valid = await addressFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      customer_id: props.customerId,
      province: addressForm.address_path[0],
      city: addressForm.address_path[1],
      district: addressForm.address_path[2],
      detail_address: addressForm.detail_address,
      is_default: addressForm.is_default
    }

    if (addressDialogMode.value === 'create') {
      await customerApi.createAddress(data)
    } else {
      await customerApi.updateAddress(addressForm.id, data)
    }

    ElMessage.success('保存成功')
    addressDialogVisible.value = false
    loadCustomerData()
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const deleteAddress = async (row) => {
  try {
    await customerApi.deleteAddress(row.id)
    ElMessage.success('删除成功')
    loadCustomerData()
  } catch (error) {
    ElMessage.error('删除失败：' + error.message)
  }
}

const viewOrder = (row) => {
  // TODO: 跳转到订单详情页
  console.log('查看订单', row.id)
}

// ========== 生命周期 ==========
onMounted(() => {
  loadCustomerData()
})
</script>

<style scoped>
.customer-detail {
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

.stat-value.small {
  font-size: 16px;
  color: #606266;
}

.asset-row {
  margin-bottom: 20px;
}

.asset-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.asset-value {
  font-size: 32px;
  font-weight: bold;
  color: #67C23A;
}

.asset-value.warning {
  color: #E6A23C;
}

.asset-value .unit {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}
</style>
