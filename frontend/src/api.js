const API = '/api/v1';
async function request(path, init) {
    const response = await fetch(`${API}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(data.detail ?? '请求失败');
    return data;
}
export const api = {
    health: () => request('/health'),
    syncSchema: () => request('/schema/sync', { method: 'POST' }),
    query: (question, history) => request('/query', {
        method: 'POST',
        body: JSON.stringify({ question, history }),
    }),
    dashboards: () => request('/dashboards'),
    saveDashboard: (name, definition) => request('/dashboards', {
        method: 'POST',
        body: JSON.stringify({ name, description: '通过自然语言分析生成', definition }),
    }),
    deleteDashboard: (id) => request(`/dashboards/${id}`, { method: 'DELETE' }),
    history: () => request('/history'),
    deleteHistory: (id) => request(`/history/${id}`, { method: 'DELETE' }),
};
