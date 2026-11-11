/**
 * 登录状态管理（扩展：登录功能）。
 *
 * 令牌保存在 localStorage，刷新页面后通过 /auth/me 恢复用户信息，
 * 因此令牌过期或用户被停用时，刷新即可回到登录页。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearToken, fetchMe, getToken, login as loginApi, setToken } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => Boolean(token.value))
  const role = computed(() => user.value?.role ?? '')
  const isAdmin = computed(() => role.value === 'admin')
  const displayName = computed(() => user.value?.username ?? '')

  async function restore() {
    if (!token.value) return
    try {
      user.value = await fetchMe()
    } catch {
      // 令牌失效：清空本地状态，回到登录页
      logout()
    }
  }

  async function login(username, password) {
    loading.value = true
    error.value = ''
    try {
      const data = await loginApi({ username, password })
      setToken(data.access_token)
      token.value = data.access_token
      user.value = data.user
      return data
    } catch (e) {
      error.value = e?.response?.data?.detail || '登录失败，请稍后重试'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearToken()
    token.value = ''
    user.value = null
  }

  return {
    token,
    user,
    loading,
    error,
    isLoggedIn,
    role,
    isAdmin,
    displayName,
    restore,
    login,
    logout
  }
})
