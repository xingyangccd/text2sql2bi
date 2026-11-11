<script setup>
/**
 * Text2SQL2BI 数据分析工作台。
 *
 * 三个页面：
 * - 对话分析：自然语言提问 -> 图表 / 数据表
 * - 数据看板：保存的分析结果快照
 * - 查询历史：过去成功执行过的查询
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useQueryStore } from '@/stores/query'
import { useAuthStore } from '@/stores/auth'
import Login from '@/views/Login.vue'
import ChartView from '@/components/ChartView.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import DashboardList from '@/components/DashboardList.vue'
import HistoryList from '@/components/HistoryList.vue'

const store = useQueryStore()
const auth = useAuthStore()

const activePage = ref('analysis')
const question = ref('')
const historySearch = ref('')

const suggestions = [
  '按月份统计2026年已支付订单的销售额趋势',
  '各区域客户贡献的销售额分别是多少？',
  '销售额最高的5个产品是什么？',
  '不同渠道的订单数量和平均客单价'
]

const pageHeading = computed(
  () =>
    ({
      analysis: ['数据工作台 / 对话分析', '让数据直接回答问题'],
      dashboards: ['数据工作台 / 数据看板', '沉淀你的关键业务洞察'],
      history: ['数据工作台 / 查询历史', '回顾每一次数据探索']
    })[activePage.value]
)

const filteredHistory = computed(() => {
  const keyword = historySearch.value.trim().toLowerCase()
  if (!keyword) return store.historyList
  return store.historyList.filter((item) =>
    item.question.toLowerCase().includes(keyword)
  )
})

const result = computed(() => store.result)

async function showPage(page) {
  activePage.value = page
  if (page === 'dashboards') await store.refreshDashboards()
  if (page === 'history') await store.refreshHistory()
}

async function handleAsk(text = question.value, refresh = false) {
  const clean = text.trim()
  if (!clean) return
  try {
    await store.ask(clean, refresh)
    question.value = ''
  } catch {
    // 错误已写入 store.error，由页面统一展示
  }
}

async function handleSync() {
  try {
    const data = await store.sync()
    ElMessage.success(`已同步 ${data.tables} 张业务表到向量库`)
  } catch {
    ElMessage.error(store.error || '同步失败')
  }
}

async function handleSave() {
  if (!result.value) return
  try {
    const { value } = await ElMessageBox.prompt(
      '为这次分析结果取一个看板名称',
      '保存到看板',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: result.value.chart?.title || result.value.question
      }
    )
    if (!value) return
    await store.addDashboard(value, { query: result.value.question, response: result.value })
    ElMessage.success('已保存到数据看板')
  } catch {
    // 用户取消
  }
}

function openDashboard(item) {
  const definition = item?.definition
  const snapshot = definition?.response || definition
  if (!snapshot) return
  store.result = snapshot
  activePage.value = 'analysis'
}

async function removeDashboard(item) {
  try {
    await ElMessageBox.confirm(`确定删除看板“${item.name}”吗？`, '删除看板', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await store.removeDashboard(item.id)
  ElMessage.success('看板已删除')
}

async function rerunHistory(item) {
  activePage.value = 'analysis'
  store.resetSession()
  await handleAsk(item.question, true)
}

async function removeHistory(item) {
  await store.removeHistory(item.id)
  ElMessage.success('记录已删除')
}

function newAnalysis() {
  activePage.value = 'analysis'
  store.resetSession()
}

async function loadWorkspace() {
  await store.checkHealth()
  await store.refreshHistory()
  await store.refreshDashboards()
}

function handleLogout() {
  auth.logout()
  store.resetSession()
  activePage.value = 'analysis'
}

// 令牌过期时由 axios 拦截器派发，这里统一回到登录页
function handleAuthExpired() {
  store.resetSession()
  ElMessage.warning('登录已过期，请重新登录')
}

onMounted(async () => {
  window.addEventListener('auth:expired', handleAuthExpired)
  await auth.restore()
  if (auth.isLoggedIn) {
    await loadWorkspace()
  }
})

// 登录成功后加载工作区数据（刷新页面走 onMounted 分支）
watch(
  () => auth.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await loadWorkspace()
    }
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('auth:expired', handleAuthExpired)
})
</script>

<template>
  <Login v-if="!auth.isLoggedIn" />

  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">Q</span>
        <div><strong>QueryLens</strong><small>TEXT2SQL · BI</small></div>
      </div>
      <el-button class="new-analysis" @click="newAnalysis">＋ 新建分析</el-button>
      <nav>
        <p class="nav-label">工作区</p>
        <button
          :class="['nav-item', { active: activePage === 'analysis' }]"
          @click="showPage('analysis')"
        >
          <span>⌁</span> 对话分析
        </button>
        <button
          :class="['nav-item', { active: activePage === 'dashboards' }]"
          @click="showPage('dashboards')"
        >
          <span>▦</span> 数据看板
        </button>
        <button
          :class="['nav-item', { active: activePage === 'history' }]"
          @click="showPage('history')"
        >
          <span>◫</span> 查询历史
        </button>
        <p class="nav-label dashboards-label">已保存看板</p>
        <button
          v-for="item in store.dashboardList"
          :key="item.id"
          class="saved-item"
          @click="openDashboard(item)"
        >
          {{ item.name }}
        </button>
        <p v-if="!store.dashboardList.length" class="empty-saved">暂无已保存看板</p>
      </nav>
      <div class="sidebar-footer">
        <div class="avatar">{{ (auth.displayName || 'U').slice(0, 2).toUpperCase() }}</div>
        <div>
          <strong>{{ auth.displayName || '未登录' }}</strong>
          <small>{{ { admin: '管理员', analyst: '分析师', viewer: '只读用户' }[auth.role] || '分析工作区' }}</small>
        </div>
        <button class="logout-button" title="退出登录" @click="handleLogout">⏻</button>
      </div>
    </aside>

    <main>
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ pageHeading[0] }}</p>
          <h1>{{ pageHeading[1] }}</h1>
        </div>
        <div class="top-actions">
          <span :class="['status', store.online ? 'online' : 'offline']">
            <i />{{ store.online ? '服务正常' : '服务离线' }}
          </span>
          <el-button
            v-if="activePage === 'analysis' && auth.isAdmin"
            size="small"
            :loading="store.syncing"
            @click="handleSync"
          >
            ↻ 同步数据源
          </el-button>
        </div>
      </header>

      <section class="workspace">
        <!-- 对话分析 -->
        <template v-if="activePage === 'analysis'">
          <div class="query-card">
            <div class="query-heading">
              <span class="spark">✦</span>
              <div>
                <strong>你想了解什么？</strong>
                <small>用自然语言描述指标、维度和筛选条件</small>
              </div>
            </div>
            <form @submit.prevent="handleAsk()">
              <el-input
                v-model="question"
                type="textarea"
                :rows="3"
                resize="none"
                placeholder="例如：按月份统计今年各区域的销售额趋势，并找出增长最快的区域"
                @keydown.ctrl.enter.prevent="handleAsk()"
              />
              <div class="query-actions">
                <span>Ctrl + Enter 发送</span>
                <div>
                  <el-button size="small" text @click="handleAsk(question, true)">
                    忽略缓存重查
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    :loading="store.loading"
                    :disabled="!question.trim()"
                    native-type="submit"
                  >
                    {{ store.loading ? '分析中…' : '开始分析 →' }}
                  </el-button>
                </div>
              </div>
            </form>
            <div class="suggestions">
              <span>试试：</span>
              <button v-for="item in suggestions" :key="item" @click="handleAsk(item)">
                {{ item }}
              </button>
            </div>
          </div>

          <el-alert
            v-if="store.error"
            class="notice"
            type="error"
            :closable="false"
            :title="store.error"
            show-icon
          />

          <div v-if="store.loading" class="loading-panel">
            <span class="loader" />
            <div>
              <strong>正在理解问题并生成查询</strong>
              <small>检索 Schema · 生成 SQL · 安全校验 · 执行查询 · 构建图表</small>
            </div>
          </div>

          <template v-else-if="result">
            <div class="result-head">
              <div>
                <p class="eyebrow">分析结果</p>
                <h2>{{ result.chart?.title || result.question }}</h2>
              </div>
              <div class="result-meta">
                <span>{{ result.row_count }} 条记录</span>
                <span>{{ result.duration_ms }} ms</span>
                <span v-if="result.from_cache">缓存命中</span>
              </div>
            </div>

            <div class="insight-strip">
              <span>✦</span>
              <div>
                <strong>智能洞察</strong>
                <p>{{ result.answer }}</p>
              </div>
            </div>

            <ResultPanel :result="result" @save="handleSave" />
          </template>

          <section v-else class="empty-state">
            <div class="empty-icon">⌁</div>
            <h2>从一个业务问题开始</h2>
            <p>系统会自动检索数据结构、生成安全 SQL，并把结果转换成最合适的图表。</p>
            <div class="capabilities">
              <span>✓ 只读 SQL 安全校验</span>
              <span>✓ Qdrant Schema 检索</span>
              <span>✓ 自动图表推荐</span>
            </div>
          </section>
        </template>

        <!-- 数据看板 -->
        <template v-else-if="activePage === 'dashboards'">
          <div class="page-title-row">
            <div>
              <p class="eyebrow">已保存内容</p>
              <h2>数据看板</h2>
              <p>集中查看通过对话分析保存的指标与图表。</p>
            </div>
            <el-button type="primary" @click="newAnalysis">＋ 创建分析</el-button>
          </div>
          <DashboardList
            :dashboards="store.dashboardList"
            @open="openDashboard"
            @remove="removeDashboard"
          />
        </template>

        <!-- 查询历史 -->
        <template v-else>
          <div class="page-title-row history-title-row">
            <div>
              <p class="eyebrow">最近查询</p>
              <h2>查询历史</h2>
              <p>查看生成过的 SQL，或从历史问题重新发起分析。</p>
            </div>
            <el-input
              v-model="historySearch"
              class="history-search"
              placeholder="搜索历史问题"
              clearable
            >
              <template #prefix><span>⌕</span></template>
            </el-input>
          </div>
          <HistoryList
            :history="filteredHistory"
            @rerun="rerunHistory"
            @remove="removeHistory"
          />
        </template>
      </section>
    </main>
  </div>
</template>
