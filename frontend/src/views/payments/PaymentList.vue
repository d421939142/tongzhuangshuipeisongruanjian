<template>
  <div class="payment-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>收款管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon><Plus /></el-icon>
        新增收款
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总收款</div>
            <div class="stat-value">¥{{ statistics.total_amount?.toFixed(2) || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">今日收款</div>
            <div class="stat-value">¥{{ statistics.today_amount?.toFixed(2) || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月收款</div>
            <div class="stat-value">¥{{ statistics.month_amount?.toFixed(2) || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">收款笔数</div>
            <div class="stat-value">{{ statistics.total_count || 0 }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索客户名称"
        clearable
        style="width: 200px"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="paymentMethodFilter" placeholder="收款方式" clearable style="width: 130px">
        <el-option label="全部" value="" />
        <el-option label="现金" value="cash" />
        <el-option label="微信" value="wechat" />
        <el-option label="支付宝" value="alipay" />
        <el-option label="银行转账" value="bank" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 收款列表 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="customer_name" label="客户" width="120" />
      <el-table-column prop="order_id" label="关联订单" width="100">
        <template #default="{ row }">
          <el-button v-if="row.order_id" type="primary" link @click="viewOrder(row.order_id)">
            #{{ row.order_id }}
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="120">
        <template #default="{ row }">
          <span style="color: #67C23A; font-weight: bold;">¥{{ row.amount?.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="payment_method" label="收款方式" width="100">
        <template #default="{ row }">
          <el-tag :type="getPaymentMethodType(row.payment_method)">
            {{ getPaymentMethodName(row.payment_method) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="paid_at" label="收款时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.paid_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑收款对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="客户" prop="customer_id">
          <el-select
            v-model="formData.customer_id"
            filterable
            remote
            reserve-keyword
            placeholder="搜索客户"
            :remote-method="searchCustomer"
            :loading="customerSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.id"
              :label="`${item.name} (${item.phone})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="关联订单">
          <el-select
            v-model="formData.order_id"
            filterable
            placeholder="选择订单（可选）"
            clearable
            style="width: 100%"
            @focus="loadCustomerOrders"
          >
            <el-option
              v-for="item in orderOptions"
              :key="item.id"
              :label="`#${item.id} - ${item.product_name} x${item.quantity}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0.01"
            :precision="2"
            :step="10"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">元</span>
        </el-form-item>

        <el-form-item label="收款方式" prop="payment_method">
          <el-select v-model="formData.payment_method" placeholder="选择收款方式" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行转账" value="bank" />
          </el-select>
        </el-form-item>

        <el-form-item label="收款时间" prop="paid_at">
          <el-date-picker
            v-model="formData.paid_at"
            type="datetime"
            placeholder="选择收款时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import * as paymentApi from '@/api/payments'
import * as customerApi from '@/api/customers'
import * as orderApi from '@/api/orders'
import { useRouter } from 'vue-router'

const router = useRouter()

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const paymentMethodFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])
const statistics = ref({})

// 收款表单
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const formData = reactive({
  customer_id: null,
  order_id: null,
  amount: 0,
  payment_method: 'cash',
  paid_at: new Date(),
  notes: ''
})

const formRules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入收款金额', trigger: 'blur' }],
  payment_method: [{ required: true, message: '请选择收款方式', trigger: 'change' }],
  paid_at: [{ required: true, message: '请选择收款时间', trigger: 'change' }]
}

// 客户搜索
const customerSearchLoading = ref(false)
const customerOptions = ref([])
const orderOptions = ref([])

// ========== 计算属性 ==========
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新增收款' : '编辑收款'
})

// ========== 方法 ==========
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getPaymentMethodName = (method) => {
  const map = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝',
    bank: '银行转账'
  }
  return map[method] || method
}

const getPaymentMethodType = (method) => {
  const map = {
    cash: '',
    wechat: 'success',
    alipay: 'primary',
    bank: 'info'
  }
  return map[method] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const [listRes, statsRes] = await Promise.all([
      paymentApi.getPayments({
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value,
        payment_method: paymentMethodFilter.value,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1]
      }),
      paymentApi.getPaymentStatistics({
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1]
      })
    ])
    tableData.value = listRes.data
    total.value = listRes.total
    statistics.value = statsRes
  } catch (error) {
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchKeyword.value = ''
  paymentMethodFilter.value = ''
  dateRange.value = []
  currentPage.value = 1
  loadData()
}

const handleSizeChange = () => {
  loadData()
}

const handleCurrentChange = () => {
  loadData()
}

const searchCustomer = async (query) => {
  if (!query) return
  customerSearchLoading.value = true
  try {
    const response = await customerApi.getCustomers({ keyword: query, pageSize: 20 })
    customerOptions.value = response.data
  } catch (error) {
    console.error('搜索客户失败', error)
  } finally {
    customerSearchLoading.value = false
  }
}

const loadCustomerOrders = async () => {
  if (!formData.customer_id) return
  try {
    const response = await orderApi.getOrders({
      customer_id: formData.customer_id,
      status: 'completed',
      pageSize: 50
    })
    orderOptions.value = response.data
  } catch (error) {
    console.error('加载订单失败', error)
  }
}

const openDialog = (mode, row) => {
  dialogMode.value = mode
  if (mode === 'edit' && row) {
    Object.assign(formData, {
      ...row,
      paid_at: row.paid_at ? new Date(row.paid_at) : new Date()
    })
    loadCustomerOrders()
  } else {
    resetForm()
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    customer_id: null,
    order_id: null,
    amount: 0,
    payment_method: 'cash',
    paid_at: new Date(),
    notes: ''
  })
  orderOptions.value = []
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      ...formData,
      paid_at: formData.paid_at.toISOString()
    }

    if (dialogMode.value === 'create') {
      await paymentApi.createPayment(data)
      ElMessage.success('创建成功')
    } else {
      await paymentApi.updatePayment(formData.id, data)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('操作失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除该收款记录吗？此操作不可恢复！`,
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    await paymentApi.deletePayment(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const viewOrder = (orderId) => {
  router.push({ name: 'OrderDetail', params: { id: orderId } })
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.payment-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
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
  color: #67C23A;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
