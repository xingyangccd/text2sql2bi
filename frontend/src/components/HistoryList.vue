<script setup>
/**
 * 查询历史列表：回顾过去成功执行过的查询。
 */
import { ref } from 'vue'
import { format } from 'sql-formatter'

defineProps({
  history: { type: Array, default: () => [] }
})

const emit = defineEmits(['rerun', 'remove'])

const expandedId = ref(null)

function formatSql(sql) {
  if (!sql) return ''
  try {
    return format(sql, { language: 'postgresql', keywordCase: 'upper', tabWidth: 2 })
  } catch {
    return sql
  }
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

<template>
  <div v-if="history.length" class="history-list">
    <article v-for="item in history" :key="item.id" class="history-item">
      <div class="history-icon">
        {{ item.chart_type === 'line' ? '⌁' : item.chart_type === 'pie' ? '◔' : item.chart_type === 'kpi' ? '#' : '▦' }}
      </div>
      <div class="history-main">
        <h3>{{ item.question }}</h3>
        <div class="history-meta">
          <span>{{ (item.chart_type || 'unknown').toUpperCase() }}</span>
          <span>{{ item.duration_ms }} ms</span>
          <span>{{ formatDate(item.created_at) }}</span>
        </div>
        <div v-if="expandedId === item.id" class="history-sql">
          <pre><code>{{ formatSql(item.sql) }}</code></pre>
        </div>
      </div>
      <div class="history-actions">
        <el-button size="small" @click="expandedId = expandedId === item.id ? null : item.id">
          {{ expandedId === item.id ? '收起 SQL' : '查看 SQL' }}
        </el-button>
        <el-button size="small" type="primary" plain @click="emit('rerun', item)">
          再次查询
        </el-button>
        <el-button class="icon-action danger" text circle @click="emit('remove', item)">
          ×
        </el-button>
      </div>
    </article>
  </div>

  <section v-else class="empty-state compact-empty">
    <div class="empty-icon">◫</div>
    <h2>暂无查询历史</h2>
    <p>成功执行的自然语言查询会自动保存在这里。</p>
  </section>
</template>
