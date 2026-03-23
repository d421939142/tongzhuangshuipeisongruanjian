<template>
  <div class="order-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>订单管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon><Plus /></el-icon>
        新增订单
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索订单号/客户名称/手机号"
        clearable
        style="width: 220px"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 130px">
        <el-option label="全部" value="" />
        <el-option label="待分配" value="pending" />
        <el-option label="待配送" value="assigned" />
        <el-option label="配送中" value="delivering" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
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

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selectedOrders.length > 0">
      <span>已选择 {{ selectedOrders.length }} 条订单</span>
      <el-button type="primary" size="small" @click="openAssignDialog">批量分配</el-button>
      <el-button type="warning" size="small" @click="batchWithdraw">批量撤回</el-button>
      <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
    </div>

    <!-- 订单列表 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      stripe
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="订单号" width="100" />
      <el-table-column prop="customer_name" label="客户" width="120" />
      <el-table-column prop="product_name" label="产品" width="120" />
      <el-table-column prop="quantity" label="数量" width="80" align="center">
        <template #default="{ row }">
          {{ row.quantity }}桶
        </template>
      </el-table-column>
      <el-table-column prop="total_price" label="金额" width="100">
        <template #default="{ row }">
          ¥{{ row.total_price?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="配送地址" min-width="200" />
      <el-table-column prop="deliveryman_name" label="送水工" width="100">
        <template #default="{ row }">
          {{ row.deliveryman_name || '-' }}
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
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button size="small" @click="showDetail(row)">详情</el-button>
          <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
            <el-button size="small">
              更多 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="assign" v-if="row.status === 'pending'">
                  分配送水工
                </el-dropdown-item>
                <el-dropdown-item command="withdraw" v-if="['assigned', 'delivering'].includes(row.status)">
                  撤回订单
                </el-dropdown-item>
                <el-dropdown-item command="complete" v-if="row.status === 'delivering'">
                  完成配送
                </el-dropdown-item>
                <el-dropdown-item command="cancel" v-if="['pending', 'assigned'].includes(row.status)">
                  取消订单
                </el-dropdown-item>
                <el-dropdown-item command="delete" v-if="row.status === 'completed'">
                  删除订单
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

    <!-- 新增/编辑订单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
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
            @change="handleCustomerChange"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.id"
              :label="`${item.name} (${item.phone})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="产品" prop="product_id">
          <el-select
            v-model="formData.product_id"
            placeholder="选择产品"
            style="width: 100%"
            @change="handleProductChange"
          >
            <el-option
              v-for="item in productOptions"
              :key="item.id"
              :label="`${item.name} - ¥${item.price}/桶 (库存: ${item.stock})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            :max="selectedProduct?.stock || 999"
            style="width: 200px"
            @change="calculateTotal"
          />
          <span style="margin-left: 10px; color: #909399;">桶</span>
        </el-form-item>

        <el-form-item label="单价">
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :step="0.5"
            style="width: 200px"
            @change="calculateTotal"
          />
          <span style="margin-left: 10px; color: #909399;">元/桶</span>
        </el-form-item>

        <el-form-item label="总金额">
          <el-tag type="danger" size="large">¥{{ (formData.price * formData.quantity).toFixed(2) }}</el-tag>
        </el-form-item>

        <el-form-item label="配送地址">
          <el-select v-model="formData.address_id" placeholder="选择地址" style="width: 100%">
            <el-option
              v-for="item in addressOptions"
              :key="item.id"
              :label="item.address"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预约配送时间">
          <el-date-picker
            v-model="formData.scheduled_delivery_time"
            type="datetime"
            placeholder="选择配送时间"
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

    <!-- 批量分配对话框 -->
    <el-dialog v-model="assignDialogVisible" title="批量分配送水工" width="500px">
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

    <!-- 订单详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="订单详情"
      size="60%"
    >
      <OrderDetail v-if="detailDrawerVisible" :order-id="selectedOrderId" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, ArrowDown } from '@element-plus/icons-vue'
import * as orderApi from '@/api/orders'
import * as customerApi from '@/api/customers'
import * as productApi from '@/api/products'
import * as deliverymanApi from '@/api/deliverymen'
import OrderDetail from './OrderDetail.vue'

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])
const selectedOrders = ref([])

// 订单表单
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const formData = reactive({
  customer_id: null,
  product_id: null,
  quantity: 1,
  price: 0,
  address_id: null,
  scheduled_delivery_time: '',
  notes: ''
})

const formRules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  product_id: [{ required: true, message: '请选择产品', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

// 客户搜索
const customerSearchLoading = ref(false)
const customerOptions = ref([])
const addressOptions = ref([])

// 产品选项
const productOptions = ref([])
const selectedProduct = ref(null)

// 批量分配
const assignDialogVisible = ref(false)
const assignDeliverymanId = ref(null)
const deliverymanOptions = ref([])

// 订单详情
const detailDrawerVisible = ref(false)
const selectedOrderId = ref(null)

// ========== 计算属性 ==========
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新增订单' : '编辑订单'
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

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    const response = await orderApi.getOrders(params)
    tableData.value = response.data
    total.value = response.total
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
  statusFilter.value = ''
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

const handleSelectionChange = (selection) => {
  selectedOrders.value = selection
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

const handleCustomerChange = async (customerId) => {
  try {
    const addresses = await customerApi.getCustomerAddresses(customerId)
    addressOptions.value = addresses
  } catch (error) {
    console.error('加载地址失败', error)
  }
}

const handleProductChange = (productId) => {
  const product = productOptions.value.find(p => p.id === productId)
  selectedProduct.value = product
  formData.price = product?.price || 0
  calculateTotal()
}

const calculateTotal = () => {
  return (formData.price * formData.quantity).toFixed(2)
}

const openDialog = async (mode, row) => {
  dialogMode.value = mode
  
  // 加载产品选项
  const products = await productApi.getProducts({ status: 'active', pageSize: 100 })
  productOptions.value = products.data

  if (mode === 'edit' && row) {
    Object.assign(formData, {
      ...row,
      scheduled_delivery_time: row.scheduled_delivery_time ? new Date(row.scheduled_delivery_time) : ''
    })
    handleCustomerChange(row.customer_id)
  } else {
    resetForm()
  }
  
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    customer_id: null,
    product_id: null,
    quantity: 1,
    price: 0,
    address_id: null,
    scheduled_delivery_time: '',
    notes: ''
  })
  addressOptions.value = []
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      ...formData,
      scheduled_delivery_time: formData.scheduled_delivery_time
        ? formData.scheduled_delivery_time.toISOString()
        : null
    }

    if (dialogMode.value === 'create') {
      await orderApi.createOrder(data)
      ElMessage.success('创建成功')
    } else {
      await orderApi.updateOrder(formData.id, data)
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

const showDetail = (row) => {
  selectedOrderId.value = row.id
  detailDrawerVisible.value = true
}

const handleMoreAction = async (command, row) => {
  switch (command) {
    case 'assign':
      await assignOrder(row)
      break
    case 'withdraw':
      await withdrawOrder(row)
      break
    case 'complete':
      await completeOrder(row)
      break
    case 'cancel':
      await cancelOrder(row)
      break
    case 'delete':
      await deleteOrder(row)
      break
  }
}

const assignOrder = async (row) => {
  try {
    const deliverymen = await deliverymanApi.getDeliverymen({ status: 'active', pageSize: 100 })
    deliverymanOptions.value = deliverymen.data
    
    const { value } = await ElMessageBox.prompt('选择送水工', '分配订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'select',
      inputOptions: deliverymanOptions.value.map(d => ({
        label: `${d.name} (${d.phone})`,
        value: d.id
      }))
    })
    
    await orderApi.assignOrder(row.id, value)
    ElMessage.success('分配成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('分配失败：' + error.message)
    }
  }
}

const withdrawOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤回该订单吗？将恢复客户数据。', '提示', { type: 'warning' })
    await orderApi.withdrawOrder(row.id)
    ElMessage.success('撤回成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤回失败：' + error.message)
    }
  }
}

const completeOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确定该订单已完成配送吗？', '提示', { type: 'success' })
    await orderApi.completeOrder(row.id)
    ElMessage.success('订单已完成')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const cancelOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '警告', { type: 'warning' })
    await orderApi.cancelOrder(row.id)
    ElMessage.success('订单已取消')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败：' + error.message)
    }
  }
}

const deleteOrder = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该订单吗？此操作不可恢复！',
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await orderApi.deleteOrder(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
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
    const orderIds = selectedOrders.value.map(o => o.id)
    await orderApi.batchAssignOrders(orderIds, assignDeliverymanId.value)
    ElMessage.success('批量分配成功')
    assignDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('分配失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const batchWithdraw = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要撤回选中的 ${selectedOrders.value.length} 条订单吗？将恢复客户数据。`,
      '提示',
      { type: 'warning' }
    )
    const orderIds = selectedOrders.value.map(o => o.id)
    await orderApi.batchWithdrawOrders(orderIds)
    ElMessage.success('批量撤回成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤回失败：' + error.message)
    }
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedOrders.value.length} 条订单吗？此操作不可恢复！`,
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    const orderIds = selectedOrders.value.map(o => o.id)
    await orderApi.batchDeleteOrders(orderIds)
    ElMessage.success('批量删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.order-list {
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

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.batch-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.batch-bar span {
  color: #606266;
  font-weight: 500;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
