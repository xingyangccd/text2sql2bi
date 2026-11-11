<script setup>
/**
 * SQL 展示面板：格式化 PostgreSQL 语句并支持复制。
 */
import { computed, ref } from 'vue'
import { format } from 'sql-formatter'

const props = defineProps({
  sql: { type: String, default: '' }
})

const copied = ref(false)

const formattedSql = computed(() => {
  if (!props.sql) return ''
  try {
    return format(props.sql, {
      language: 'postgresql',
      keywordCase: 'upper',
      tabWidth: 2,
      linesBetweenQueries: 1
    })
  } catch {
    return props.sql
  }
})

async function copySql() {
  try {
    await navigator.clipboard.writeText(props.sql)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="sql-panel">
    <div class="sql-panel-head">
      <span><i /> PostgreSQL · FORMATTED SQL</span>
      <el-button size="small" text @click="copySql">
        {{ copied ? '已复制' : '复制 SQL' }}
      </el-button>
    </div>
    <pre><code>{{ formattedSql }}</code></pre>
  </div>
</template>
