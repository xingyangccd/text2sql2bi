/**
 * 查询状态管理。
 *
 * 关键概念（第五章）：
 * - 对话历史：保存在当前页面内存，随请求传给后端，帮助模型理解追问；
 * - 查询历史：后端存 PostgreSQL，用于回顾与审计，不会自动作为上下文；
 * - 查询缓存：后端存 Redis，命中后直接返回结果。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteDashboard,
  deleteHistory,
  fetchDashboards,
  fetchHealth,
  fetchHistory,
  runQuery,
  saveDashboard,
  syncSchema
} from '@/api'

export const useQueryStore = defineStore('query', () => {
  /** 服务在线状态 */
  const online = ref(false)
  /** Schema 是否已同步 */
  const schemaSynced = ref(false)
  /** 当前会话的对话历史（仅存在于前端内存） */
  const messages = ref([])
  /** 当前查询结果 */
  const result = ref(null)
  /** 查询历史（后端 PostgreSQL） */
  const historyList = ref([])
  /** 数据看板（后端 PostgreSQL） */
  const dashboardList = ref([])
  /** 加载状态 */
  const loading = ref(false)
  const syncing = ref(false)
  /** 错误信息 */
  const error = ref('')

  async function checkHealth() {
    try {
      const data = await fetchHealth()
      online.value = data.status === 'ok' && data.db_meta === true
    } catch (e) {
      online.value = false
    }
  }

  async function sync() {
    syncing.value = true
    error.value = ''
    try {
      const data = await syncSchema()
      schemaSynced.value = true
      return data
    } catch (e) {
      error.value = e?.response?.data?.detail || 'Schema 同步失败'
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function ask(question, refresh = false) {
    const clean = question.trim()
    if (!clean || loading.value) return null
    loading.value = true
    error.value = ''
    try {
      const payload = {
        question: clean,
        history: messages.value.map((item) => ({ role: item.role, content: item.content })),
        refresh
      }
      const data = await runQuery(payload)
      result.value = data
      messages.value.push({ role: 'user', content: clean })
      messages.value.push({
        role: 'assistant',
        content: data.answer || (data.error ?? '查询失败')
      })
      if (data.success) {
        await refreshHistory()
      }
      return data
    } catch (e) {
      error.value = e?.response?.data?.detail || '查询失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refreshHistory() {
    try {
      historyList.value = await fetchHistory()
    } catch (e) {
      historyList.value = []
    }
  }

  async function refreshDashboards() {
    try {
      dashboardList.value = await fetchDashboards()
    } catch (e) {
      dashboardList.value = []
    }
  }

  async function removeHistory(id) {
    await deleteHistory(id)
    historyList.value = historyList.value.filter((item) => item.id !== id)
  }

  async function addDashboard(name, definition, description = '通过自然语言分析生成') {
    const data = await saveDashboard({ name, description, definition })
    await refreshDashboards()
    return data
  }

  async function removeDashboard(id) {
    await deleteDashboard(id)
    dashboardList.value = dashboardList.value.filter((item) => item.id !== id)
  }

  /** 新建分析：清空当前会话上下文 */
  function resetSession() {
    messages.value = []
    result.value = null
    error.value = ''
  }

  return {
    online,
    schemaSynced,
    messages,
    result,
    historyList,
    dashboardList,
    loading,
    syncing,
    error,
    checkHealth,
    sync,
    ask,
    refreshHistory,
    refreshDashboards,
    removeHistory,
    addDashboard,
    removeDashboard,
    resetSession
  }
})
