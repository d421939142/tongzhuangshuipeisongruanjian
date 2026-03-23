<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>桶装水配送</h1>
        <p>送水工端</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>请联系管理员获取账号密码</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ========== 数据 ==========
const loading = ref(false)
const formRef = ref(null)
const formData = reactive({
  phone: '',
  password: ''
})

const formRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// ========== 方法 ==========
const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // 调用登录接口
    // TODO: 实现登录API
    // const response = await loginApi.login(formData)
    
    // 模拟登录成功
    setTimeout(() => {
      localStorage.setItem('delivery_token', 'mock_token_' + Date.now())
      localStorage.setItem('delivery_user', JSON.stringify({
        id: 1,
        name: '张三',
        phone: formData.phone
      }))
      
      ElMessage.success('登录成功')
      router.push('/tasks')
    }, 500)
  } catch (error) {
    ElMessage.error('登录失败：' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}

.login-footer p {
  font-size: 12px;
  color: #909399;
}

.el-form :deep(.el-form-item) {
  margin-bottom: 24px;
}
</style>
