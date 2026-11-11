/**
 * 后端接口封装。所有请求经 vite 代理转发到 FastAPI。
 *
 * 登录态（扩展）：
 * - 请求拦截器自动带上 Authorization: Bearer <token>；
 * - 响应拦截器遇到 401 时清除本地令牌，并派发 auth:expired 事件由页面处理。
 */
import axios from 'axios'

const TOKEN_KEY = 'text2sqlbi_token'

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 180000
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    // 登录接口本身的 401 是"密码错误"，不触发登出逻辑
    const isLoginCall = (error?.config?.url || '').includes('/auth/login')
    if (status === 401 && !isLoginCall) {
      clearToken()
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

/** 登录 */
export function login(data) {
  return http.post('/auth/login', data).then((r) => r.data)
}

/** 当前登录用户（用于刷新页面后恢复登录态） */
export function fetchMe() {
  return http.get('/auth/me').then((r) => r.data)
}

/** 健康检查 */
export function fetchHealth() {
  return http.get('/health').then((r) => r.data)
}

/** 同步数据源 Schema 到向量库（仅 admin） */
export function syncSchema() {
  return http.post('/schema/sync').then((r) => r.data)
}

/** 自然语言查询 */
export function runQuery(data) {
  return http.post('/query', data).then((r) => r.data)
}

/** 查询历史列表 */
export function fetchHistory(limit = 50) {
  return http.get('/history', { params: { limit } }).then((r) => r.data)
}

/** 删除查询历史 */
export function deleteHistory(id) {
  return http.delete(`/history/${id}`).then((r) => r.data)
}

/** 看板列表 */
export function fetchDashboards() {
  return http.get('/dashboards').then((r) => r.data)
}

/** 保存看板 */
export function saveDashboard(data) {
  return http.post('/dashboards', data).then((r) => r.data)
}

/** 删除看板 */
export function deleteDashboard(id) {
  return http.delete(`/dashboards/${id}`).then((r) => r.data)
}

export default http
