import type { Dashboard, QueryHistoryRecord, QueryResponse } from './types'

const API = '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail ?? '请求失败')
  return data as T
}

export const api = {
  health: () => request<{ status: string; database: boolean }>('/health'),
  syncSchema: () => request<{ tables: number; collection: string }>('/schema/sync', { method: 'POST' }),
  query: (question: string, history: Array<{ role: string; content: string }>) =>
    request<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    }),
  dashboards: () => request<Dashboard[]>('/dashboards'),
  saveDashboard: (name: string, definition: Record<string, unknown>) =>
    request<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify({ name, description: '通过自然语言分析生成', definition }),
    }),
  deleteDashboard: (id: string) => request<void>(`/dashboards/${id}`, { method: 'DELETE' }),
  history: () => request<QueryHistoryRecord[]>('/history'),
  deleteHistory: (id: number) => request<void>(`/history/${id}`, { method: 'DELETE' }),
}
