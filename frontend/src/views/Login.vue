<script setup>
/**
 * 登录页（扩展：登录功能）。
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const username = ref('')
const password = ref('')

const demoAccounts = [
  { label: '管理员', username: 'admin', password: 'admin123' },
  { label: '分析师', username: 'analyst', password: 'analyst123' },
  { label: '只读', username: 'viewer', password: 'viewer123' }
]

function fill(account) {
  username.value = account.username
  password.value = account.password
}

async function submit() {
  if (!username.value.trim() || !password.value) return
  try {
    await auth.login(username.value.trim(), password.value)
  } catch {
    // 错误信息已在 store.error 中
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-brand">
        <span class="brand-mark">Q</span>
        <div>
          <strong>QueryLens</strong>
          <small>TEXT2SQL · BI</small>
        </div>
      </div>

      <h1>登录数据工作台</h1>
      <p class="login-sub">用自然语言提问，系统自动生成安全 SQL 并出图</p>

      <el-form class="login-form" @submit.prevent="submit">
        <el-form-item>
          <el-input
            v-model="username"
            size="large"
            placeholder="用户名"
            autocomplete="username"
            :disabled="auth.loading"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            size="large"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="current-password"
            :disabled="auth.loading"
            @keyup.enter="submit"
          />
        </el-form-item>

        <el-alert
          v-if="auth.error"
          class="login-error"
          type="error"
          :closable="false"
          :title="auth.error"
          show-icon
        />

        <el-button
          class="login-submit"
          type="primary"
          size="large"
          :loading="auth.loading"
          :disabled="!username.trim() || !password"
          @click="submit"
        >
          {{ auth.loading ? '登录中…' : '登录' }}
        </el-button>
      </el-form>

      <div class="login-demo">
        <span>演示账号：</span>
        <button v-for="item in demoAccounts" :key="item.username" @click="fill(item)">
          {{ item.label }} {{ item.username }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 20% 20%, #2a2d45, transparent 45%),
    radial-gradient(circle at 80% 75%, #2b2a52, transparent 45%),
    #14161f;
  padding: 24px;
}
.login-panel {
  width: min(420px, 100%);
  padding: 34px 32px 26px;
  border: 1px solid #2b2f40;
  border-radius: 16px;
  background: #1b1e2a;
  box-shadow: 0 24px 60px #06070c99;
  color: #e8eaf2;
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}
.login-brand .brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(145deg, #7776e7, #4e4db8);
  display: grid;
  place-items: center;
  font: 700 17px Manrope;
}
.login-brand div {
  display: flex;
  flex-direction: column;
}
.login-brand strong {
  font: 700 16px Manrope;
  letter-spacing: -0.2px;
}
.login-brand small {
  margin-top: 2px;
  color: #7c8298;
  font-size: 9px;
  letter-spacing: 1.7px;
}
.login-panel h1 {
  margin: 0;
  font: 700 21px Manrope;
  letter-spacing: -0.4px;
}
.login-sub {
  margin: 8px 0 24px;
  color: #878da1;
  font-size: 12px;
  line-height: 1.7;
}
.login-form :deep(.el-input__wrapper) {
  background: #232735;
  box-shadow: 0 0 0 1px #333850 inset;
}
.login-form :deep(.el-input__inner) {
  color: #e8eaf2;
}
.login-form :deep(.el-input__inner::placeholder) {
  color: #6d7386;
}
.login-error {
  margin-bottom: 14px;
}
.login-submit {
  width: 100%;
}
.login-demo {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid #2b2f40;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  color: #6d7386;
  font-size: 11px;
}
.login-demo button {
  border: 1px solid #343a4e;
  border-radius: 6px;
  padding: 4px 8px;
  background: transparent;
  color: #9aa0b8;
  font-size: 11px;
}
.login-demo button:hover {
  border-color: #5655c8;
  color: #b3b2f0;
}
</style>
