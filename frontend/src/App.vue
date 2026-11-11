<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format } from 'sql-formatter'
import { api } from './api'
import ChartView from './components/ChartView.vue'
import type { Dashboard, QueryHistoryRecord, QueryResponse } from './types'

const question = ref('')
const loading = ref(false)
const syncing = ref(false)
const online = ref(false)
const activePage = ref<'analysis' | 'dashboards' | 'history'>('analysis')
const result = ref<QueryResponse | null>(null)
const dashboards = ref<Dashboard[]>([])
const queryHistory = ref<QueryHistoryRecord[]>([])
const historySearch = ref('')
const expandedHistoryId = ref<number | null>(null)
const error = ref('')
const activeView = ref<'chart' | 'table'>('chart')
const sqlOpen = ref(false)
const sqlCopied = ref(false)
const history = ref<Array<{ role: string; content: string }>>([])

const suggestions = [
  '按月份统计2026年已支付订单的销售额趋势',
  '各区域客户贡献的销售额分别是多少？',
  '销售额最高的5个产品是什么？',
  '不同渠道的订单数量和平均客单价',
]

const chartTypeName = computed(() => ({ kpi: '指标卡', bar: '柱状图', line: '趋势图', pie: '占比图', table: '数据表' }[result.value?.chart?.type ?? 'table']))
const pageHeading = computed(() => ({
  analysis: ['数据工作台 / 对话分析', '让数据直接回答问题'],
  dashboards: ['数据工作台 / 数据看板', '沉淀你的关键业务洞察'],
  history: ['数据工作台 / 查询历史', '回顾每一次数据探索'],
}[activePage.value]))
const filteredHistory = computed(() => {
  const keyword = historySearch.value.trim().toLowerCase()
  return keyword ? queryHistory.value.filter((item) => item.question.toLowerCase().includes(keyword)) : queryHistory.value
})

const formattedSql = computed(() => {
  const sql = result.value?.sql
  if (!sql) return ''
  try {
    return format(sql, {
      language: 'postgresql',
      keywordCase: 'upper',
      tabWidth: 2,
      linesBetweenQueries: 1,
    })
  } catch {
    return sql
  }
})

function formatSql(sql: string) {
  try {
    return format(sql, { language: 'postgresql', keywordCase: 'upper', tabWidth: 2 })
  } catch {
    return sql
  }
}

function dashboardResponse(item: Dashboard): QueryResponse | null {
  const response = item.definition?.response
  return response && typeof response === 'object' && 'question' in response
    ? response as unknown as QueryResponse
    : null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

async function showPage(page: 'analysis' | 'dashboards' | 'history') {
  activePage.value = page
  error.value = ''
  if (page === 'dashboards') dashboards.value = await api.dashboards().catch(() => [])
  if (page === 'history') queryHistory.value = await api.history().catch(() => [])
}

async function runQuery(text = question.value) {
  const clean = text.trim()
  if (!clean || loading.value) return
  question.value = clean
  loading.value = true
  error.value = ''
  try {
    const response = await api.query(clean, history.value)
    result.value = response
    history.value.push({ role: 'user', content: clean }, { role: 'assistant', content: response.answer })
    queryHistory.value = await api.history().catch(() => queryHistory.value)
    activeView.value = response.chart?.type === 'table' ? 'table' : 'chart'
    question.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查询失败'
  } finally {
    loading.value = false
  }
}

async function syncSchema() {
  syncing.value = true
  error.value = ''
  try {
    const data = await api.syncSchema()
    error.value = `已同步 ${data.tables} 张业务表到 Qdrant`
  } catch (e) {
    error.value = e instanceof Error ? e.message : '同步失败'
  } finally {
    syncing.value = false
  }
}

async function saveCurrent() {
  if (!result.value) return
  const name = window.prompt('仪表盘名称', result.value.chart?.title ?? result.value.question)
  if (!name) return
  await api.saveDashboard(name, { query: result.value.question, response: result.value })
  dashboards.value = await api.dashboards()
}

function openDashboard(item: Dashboard) {
  const saved = dashboardResponse(item)
  if (!saved) return
  result.value = saved
  activePage.value = 'analysis'
  sqlOpen.value = false
}

async function removeDashboard(item: Dashboard) {
  if (!window.confirm(`确定删除看板“${item.name}”吗？`)) return
  await api.deleteDashboard(item.id)
  dashboards.value = dashboards.value.filter((dashboard) => dashboard.id !== item.id)
}

async function rerunHistory(item: QueryHistoryRecord) {
  activePage.value = 'analysis'
  history.value = []
  await runQuery(item.question)
}

async function removeHistory(item: QueryHistoryRecord) {
  if (!window.confirm('确定删除这条查询记录吗？')) return
  await api.deleteHistory(item.id)
  queryHistory.value = queryHistory.value.filter((record) => record.id !== item.id)
}

function newAnalysis() {
  activePage.value = 'analysis'
  result.value = null
  history.value = []
  question.value = ''
  error.value = ''
}

async function copySql() {
  if (!result.value?.sql) return
  await window.navigator.clipboard.writeText(result.value.sql)
  sqlCopied.value = true
  window.setTimeout(() => { sqlCopied.value = false }, 1600)
}

onMounted(async () => {
  online.value = (await api.health().catch(() => ({ database: false }))).database
  dashboards.value = await api.dashboards().catch(() => [])
  queryHistory.value = await api.history().catch(() => [])
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">Q</span><div><strong>QueryLens</strong><small>TEXT2SQL · BI</small></div></div>
      <button class="new-analysis" @click="newAnalysis"><span>＋</span> 新建分析</button>
      <nav>
        <p class="nav-label">工作区</p>
        <button :class="['nav-item', { active: activePage === 'analysis' }]" @click="showPage('analysis')"><span>⌁</span> 对话分析</button>
        <button :class="['nav-item', { active: activePage === 'dashboards' }]" @click="showPage('dashboards')"><span>▦</span> 数据看板</button>
        <button :class="['nav-item', { active: activePage === 'history' }]" @click="showPage('history')"><span>◫</span> 查询历史</button>
        <p class="nav-label dashboards-label">已保存看板</p>
        <button v-for="item in dashboards" :key="item.id" class="saved-item" @click="openDashboard(item)">{{ item.name }}</button>
        <p v-if="!dashboards.length" class="empty-saved">暂无已保存看板</p>
      </nav>
      <div class="sidebar-footer">
        <div class="avatar">DA</div><div><strong>Data Analyst</strong><small>分析工作区</small></div><span>•••</span>
      </div>
    </aside>

    <main>
      <header class="topbar">
        <div><p class="eyebrow">{{ pageHeading[0] }}</p><h1>{{ pageHeading[1] }}</h1></div>
        <div class="top-actions">
          <span :class="['status', online ? 'online' : 'offline']"><i />{{ online ? '服务正常' : '服务离线' }}</span>
          <button v-if="activePage === 'analysis'" class="source-button" :disabled="syncing" @click="syncSchema">{{ syncing ? '同步中…' : '↻ 同步数据源' }}</button>
        </div>
      </header>

      <section class="workspace">
        <template v-if="activePage === 'analysis'">
        <div class="query-card">
          <div class="query-heading"><span class="spark">✦</span><div><strong>你想了解什么？</strong><small>用自然语言描述指标、维度和筛选条件</small></div></div>
          <form @submit.prevent="runQuery()">
            <textarea v-model="question" rows="3" placeholder="例如：按月份统计今年各区域的销售额趋势，并找出增长最快的区域" @keydown.ctrl.enter.prevent="runQuery()" />
            <div class="query-actions"><span>Ctrl + Enter 发送</span><button :disabled="loading || !question.trim()">{{ loading ? '分析中…' : '开始分析 →' }}</button></div>
          </form>
          <div class="suggestions"><span>试试：</span><button v-for="item in suggestions" :key="item" @click="runQuery(item)">{{ item }}</button></div>
        </div>

        <p v-if="error" :class="['notice', error.startsWith('已同步') ? 'success' : '']">{{ error }}</p>

        <div v-if="loading" class="loading-panel"><span class="loader" /><div><strong>正在理解问题并生成查询</strong><small>检索 Schema · 生成 SQL · 安全校验 · 构建图表</small></div></div>

        <template v-else-if="result">
          <div class="result-head">
            <div><p class="eyebrow">分析结果</p><h2>{{ result.chart?.title || result.question }}</h2></div>
            <div class="result-meta"><span>{{ result.row_count }} 条记录</span><span>{{ result.duration_ms }} ms</span><span v-if="result.from_cache">缓存命中</span></div>
          </div>

          <div class="insight-strip"><span>✦</span><div><strong>智能洞察</strong><p>{{ result.answer }}</p></div></div>

          <section class="visual-card">
            <div class="card-toolbar">
              <div class="tabs"><button :class="{ active: activeView === 'chart' }" @click="activeView = 'chart'">图表</button><button :class="{ active: activeView === 'table' }" @click="activeView = 'table'">数据</button></div>
              <div class="toolbar-actions"><span>{{ chartTypeName }}</span><button @click="sqlOpen = !sqlOpen">&lt;/&gt; SQL</button><button class="save" @click="saveCurrent">保存到看板</button></div>
            </div>

            <div v-if="activeView === 'chart' && result.chart?.type === 'kpi'" class="kpi-view"><small>{{ result.chart.title }}</small><strong>{{ result.chart.option.value }}</strong><span>实时查询指标</span></div>
            <ChartView v-else-if="activeView === 'chart' && result.chart && result.chart.type !== 'table'" :option="result.chart.option" />
            <div v-else class="table-wrap"><table><thead><tr><th v-for="column in result.columns" :key="column">{{ column }}</th></tr></thead><tbody><tr v-for="(row, i) in result.rows" :key="i"><td v-for="(cell, j) in row" :key="j">{{ cell }}</td></tr></tbody></table><p v-if="!result.rows.length">暂无数据</p></div>

            <div v-if="sqlOpen" class="sql-panel">
              <div class="sql-panel-head">
                <span><i /> PostgreSQL · FORMATTED SQL</span>
                <button @click="copySql">{{ sqlCopied ? '已复制' : '复制 SQL' }}</button>
              </div>
              <pre><code>{{ formattedSql }}</code></pre>
            </div>
          </section>
        </template>

        <section v-else class="empty-state">
          <div class="empty-icon">⌁</div><h2>从一个业务问题开始</h2><p>系统会自动检索数据结构、生成安全 SQL，并把结果转换成最合适的图表。</p>
          <div class="capabilities"><span>✓ 只读 SQL 安全校验</span><span>✓ Qdrant Schema 检索</span><span>✓ 自动图表推荐</span></div>
        </section>
        </template>

        <template v-else-if="activePage === 'dashboards'">
          <div class="page-title-row">
            <div><p class="eyebrow">已保存内容</p><h2>数据看板</h2><p>集中查看通过对话分析保存的指标与图表。</p></div>
            <button class="primary-action" @click="newAnalysis">＋ 创建分析</button>
          </div>

          <div v-if="dashboards.length" class="dashboard-grid">
            <article v-for="item in dashboards" :key="item.id" class="dashboard-card">
              <div class="dashboard-card-head">
                <div><span class="chart-badge">{{ dashboardResponse(item)?.chart?.type ?? 'table' }}</span><small>{{ formatDate(item.updated_at) }}</small></div>
                <button class="icon-action danger" title="删除看板" @click="removeDashboard(item)">×</button>
              </div>
              <h3>{{ item.name }}</h3>
              <p>{{ dashboardResponse(item)?.question || item.description }}</p>
              <div class="dashboard-preview">
                <div v-if="dashboardResponse(item)?.chart?.type === 'kpi'" class="mini-kpi">
                  <strong>{{ dashboardResponse(item)?.chart?.option.value }}</strong><span>关键指标</span>
                </div>
                <ChartView v-else-if="dashboardResponse(item)?.chart && dashboardResponse(item)?.chart?.type !== 'table'" :option="dashboardResponse(item)!.chart!.option" />
                <div v-else class="mini-table"><span v-for="column in dashboardResponse(item)?.columns.slice(0, 4)" :key="column">{{ column }}</span></div>
              </div>
              <div class="dashboard-card-foot"><span>{{ dashboardResponse(item)?.row_count ?? 0 }} 条数据</span><button @click="openDashboard(item)">打开分析 →</button></div>
            </article>
          </div>
          <section v-else class="empty-state compact-empty">
            <div class="empty-icon">▦</div><h2>还没有保存的看板</h2><p>完成一次分析后，点击“保存到看板”即可在这里长期查看。</p><button class="primary-action" @click="newAnalysis">开始第一次分析</button>
          </section>
        </template>

        <template v-else>
          <div class="page-title-row history-title-row">
            <div><p class="eyebrow">最近查询</p><h2>查询历史</h2><p>查看生成过的 SQL，或从历史问题重新发起分析。</p></div>
            <label class="history-search"><span>⌕</span><input v-model="historySearch" placeholder="搜索历史问题" /></label>
          </div>

          <div v-if="filteredHistory.length" class="history-list">
            <article v-for="item in filteredHistory" :key="item.id" class="history-item">
              <div class="history-icon">{{ item.chart_type === 'line' ? '⌁' : item.chart_type === 'pie' ? '◔' : item.chart_type === 'kpi' ? '#' : '▦' }}</div>
              <div class="history-main">
                <h3>{{ item.question }}</h3>
                <div class="history-meta"><span>{{ item.chart_type?.toUpperCase() || 'UNKNOWN' }}</span><span>{{ item.duration_ms }} ms</span><span>{{ formatDate(item.created_at) }}</span></div>
                <div v-if="expandedHistoryId === item.id" class="history-sql"><pre><code>{{ formatSql(item.sql) }}</code></pre></div>
              </div>
              <div class="history-actions">
                <button @click="expandedHistoryId = expandedHistoryId === item.id ? null : item.id">{{ expandedHistoryId === item.id ? '收起 SQL' : '查看 SQL' }}</button>
                <button class="rerun" @click="rerunHistory(item)">再次查询</button>
                <button class="icon-action danger" title="删除记录" @click="removeHistory(item)">×</button>
              </div>
            </article>
          </div>
          <section v-else class="empty-state compact-empty">
            <div class="empty-icon">◫</div><h2>{{ historySearch ? '没有匹配的查询' : '暂无查询历史' }}</h2><p>{{ historySearch ? '换一个关键词试试。' : '成功执行的自然语言查询会自动保存在这里。' }}</p>
          </section>
        </template>
      </section>
    </main>
  </div>
</template>
