<template>
  <div class="customer-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索客户名称/电话"
        clearable
        style="width: 220px"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="addressFilter" placeholder="区域" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="城关区" value="城关区" />
        <el-option label="七里河区" value="七里河区" />
        <el-option label="西固区" value="西固区" />
        <el-option label="安宁区" value="安宁区" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 客户列表 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="客户名称" min-width="120" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column label="默认地址" min-width="200">
        <template #default="{ row }">
          {{ getDisplayAddress(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="water_tickets" label="水票" width="80" align="center">
        <template #default="{ row }">
          <el-tag type="success">{{ row.water_tickets }}桶</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="owed_buckets" label="欠桶" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.owed_buckets > 0 ? 'warning' : 'info'">
            {{ row.owed_buckets }}桶
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_orders" label="订单数" width="80" align="center" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button size="small" @click="showDetail(row)">详情</el-button>
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

    <!-- 新增/编辑对话框 -->
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
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入客户名称" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-divider content-position="left">默认地址</el-divider>

        <el-form-item label="省/市/区" prop="address">
          <el-cascader
            v-model="addressPath"
            :options="addressOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择省/市/区"
            style="width: 100%"
            @change="handleAddressChange"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detail_address">
          <el-input
            v-model="formData.detail_address"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址"
          />
        </el-form-item>

        <el-divider content-position="left">其他信息</el-divider>

        <el-form-item label="初始水票">
          <el-input-number
            v-model="formData.water_tickets"
            :min="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">桶</span>
        </el-form-item>

        <el-form-item label="初始欠桶">
          <el-input-number
            v-model="formData.owed_buckets"
            :min="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">桶</span>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
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

    <!-- 客户详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="客户详情"
      size="60%"
    >
      <CustomerDetail v-if="detailDrawerVisible" :customer-id="selectedCustomerId" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import * as customerApi from '@/api/customers'
import CustomerDetail from './CustomerDetail.vue'

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const addressFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])

const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const formData = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail_address: '',
  water_tickets: 0,
  owed_buckets: 0,
  notes: ''
})

const addressPath = ref([])

const formRules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
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

const detailDrawerVisible = ref(false)
const selectedCustomerId = ref(null)

// ========== 计算属性 ==========
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新增客户' : '编辑客户'
})

// ========== 方法 ==========
const getDisplayAddress = (row) => {
  const parts = [row.province, row.city, row.district, row.detail_address].filter(Boolean)
  return parts.join('') || '-'
}

const handleAddressChange = (value) => {
  if (value && value.length === 3) {
    formData.province = value[0]
    formData.city = value[1]
    formData.district = value[2]
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      district: addressFilter.value
    }
    const response = await customerApi.getCustomers(params)
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
  addressFilter.value = ''
  currentPage.value = 1
  loadData()
}

const handleSizeChange = () => {
  loadData()
}

const handleCurrentChange = () => {
  loadData()
}

const openDialog = (mode, row) => {
  dialogMode.value = mode
  if (mode === 'edit' && row) {
    Object.assign(formData, row)
    if (row.province && row.city && row.district) {
      addressPath.value = [row.province, row.city, row.district]
    }
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  addressPath.value = []
  Object.assign(formData, {
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    water_tickets: 0,
    owed_buckets: 0,
    notes: ''
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      ...formData,
      address: getDisplayAddress(formData)
    }
    if (dialogMode.value === 'create') {
      await customerApi.createCustomer(data)
      ElMessage.success('创建成功')
    } else {
      await customerApi.updateCustomer(formData.id, data)
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
  selectedCustomerId.value = row.id
  detailDrawerVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除客户【${row.name}】吗？此操作不可恢复！`,
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    await customerApi.deleteCustomer(row.id)
    ElMessage.success('删除成功')
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
.customer-list {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
