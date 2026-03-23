<template>
  <div class="product-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2>产品管理</h2>
      <el-button type="primary" @click="openDialog('create')">
        <el-icon><Plus /></el-icon>
        新增产品
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索产品名称"
        clearable
        style="width: 200px"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="产品状态" clearable style="width: 150px">
        <el-option label="全部" value="" />
        <el-option label="上架" value="active" />
        <el-option label="下架" value="inactive" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 产品列表 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="产品名称" min-width="150" />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag :type="getCategoryTagType(row.category)">
            {{ getCategoryName(row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格（元/桶）" width="120">
        <template #default="{ row }">
          ¥{{ row.price.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="deposit" label="押金（元）" width="120">
        <template #default="{ row }">
          ¥{{ row.deposit ? row.deposit.toFixed(2) : '0.00' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button
            size="small"
            :type="row.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'active' ? '下架' : '上架' }}
          </el-button>
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
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入产品名称" />
        </el-form-item>

        <el-form-item label="产品分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类">
            <el-option label="纯净水" value="pure" />
            <el-option label="矿泉水" value="mineral" />
            <el-option label="山泉水" value="spring" />
            <el-option label="蒸馏水" value="distilled" />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :step="0.5"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">元/桶</span>
        </el-form-item>

        <el-form-item label="押金">
          <el-input-number
            v-model="formData.deposit"
            :min="0"
            :precision="2"
            :step="0.5"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">元</span>
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number
            v-model="formData.stock"
            :min="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">桶</span>
        </el-form-item>

        <el-form-item label="最低库存预警">
          <el-input-number
            v-model="formData.min_stock_warning"
            :min="0"
            style="width: 200px"
          />
          <span style="margin-left: 10px; color: #909399;">桶</span>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入产品描述"
          />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number
            v-model="formData.sort_order"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">上架</el-radio>
            <el-radio label="inactive">下架</el-radio>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import * as productApi from '@/api/products'

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
  category: '',
  price: 0,
  deposit: 0,
  stock: 0,
  min_stock_warning: 10,
  description: '',
  sort_order: 0,
  status: 'active'
})

const formRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择产品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

// ========== 计算属性 ==========
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新增产品' : '编辑产品'
})

// ========== 方法 ==========
const getCategoryName = (category) => {
  const map = {
    pure: '纯净水',
    mineral: '矿泉水',
    spring: '山泉水',
    distilled: '蒸馏水'
  }
  return map[category] || category
}

const getCategoryTagType = (category) => {
  const map = {
    pure: '',
    mineral: 'success',
    spring: 'warning',
    distilled: 'info'
  }
  return map[category] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    }
    const response = await productApi.getProducts(params)
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
    Object.assign(formData, row)
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '',
    category: '',
    price: 0,
    deposit: 0,
    stock: 0,
    min_stock_warning: 10,
    description: '',
    sort_order: 0,
    status: 'active'
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = { ...formData }
    if (dialogMode.value === 'create') {
      await productApi.createProduct(data)
      ElMessage.success('创建成功')
    } else {
      await productApi.updateProduct(formData.id, data)
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

const toggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(
      `确定要${action}该产品吗？`,
      '提示',
      { type: 'warning' }
    )

    await productApi.updateProduct(row.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该产品吗？此操作不可恢复！',
      '警告',
      { type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    await productApi.deleteProduct(row.id)
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
.product-list {
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

.el-form-item :deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
