<template>
  <div class="deliveryman-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>送水工管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon><Plus /></el-icon>
        新增送水工
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索送水工名称/电话"
        clearable
        style="width: 220px"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width="120px">
        <el-option label="全部" value="" />
        <el-option label="在职" value="active" />
        <el-option label="离职" value="inactive" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 送水工列表 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" min-width="100" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column label="今日任务" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="primary">{{ row.today_orders || 0 }}单</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总完成订单" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="success">{{ row.total_orders || 0 }}单</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
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
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="身份证号">
          <el-input v-model="formData.id_card" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="入职日期">
          <el-date-picker
            v-model="formData.join_date"
            type="date"
            placeholder="选择入职日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="配送区域">
          <el-input
            v-model="formData.delivery_area"
            placeholder="请输入配送区域，如：城关区、七里河区"
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

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 送水工详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="送水工详情"
      size="60%"
    >
      <DeliverymanDetail v-if="detailDrawerVisible" :deliveryman-id="selectedDeliverymanId" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import * as deliverymanApi from '@/api/deliverymen'
import DeliverymanDetail from './DeliverymanDetail.vue'

// ========== 数据 ==========
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
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
  id_card: '',
  join_date: '',
  delivery_area: '',
  notes: '',
  status: 'active'
})

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  id_card: [
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

const detailDrawerVisible = ref(false)
const selectedDeliverymanId = ref(null)

// ========== 计算属性 ==========
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新增送水工' : '编辑送水工'
})

// ========== 方法 ==========
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    }
    const response = await deliverymanApi.getDeliverymen(params)
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
    Object.assign(formData, {
      ...row,
      join_date: row.join_date ? new Date(row.join_date) : ''
    })
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '',
    phone: '',
    id_card: '',
    join_date: '',
    delivery_area: '',
    notes: '',
    status: 'active'
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      ...formData,
      join_date: formData.join_date ? formData.join_date.toISOString().split('T')[0] : null
    }

    if (dialogMode.value === 'create') {
      await deliverymanApi.createDeliveryman(data)
      ElMessage.success('创建成功')
    } else {
      await deliverymanApi.updateDeliveryman(formData.id, data)
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
  selectedDeliverymanId.value = row.id
  detailDrawerVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除送水工【${row.name}】吗？此操作不可恢复！`,
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    await deliverymanApi.deleteDeliveryman(row.id)
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
.deliveryman-list {
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
