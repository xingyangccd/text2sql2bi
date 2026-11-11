<script setup>
/**
 * 数据看板列表。展示已保存的分析结果快照。
 */
import { computed } from 'vue'
import ChartView from './ChartView.vue'

const props = defineProps({
  dashboards: { type: Array, default: () => [] }
})

const emit = defineEmits(['open', 'remove'])

/** 从 definition 中还原查询响应快照 */
function responseOf(item) {
  const definition = item?.definition
  if (!definition || typeof definition !== 'object') return null
  if ('response' in definition && definition.response && typeof definition.response === 'object') {
    return definition.response
  }
  if ('question' in definition) return definition
  return null
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

const cards = computed(() =>
  props.dashboards.map((item) => ({
    raw: item,
    snapshot: responseOf(item),
    chartType: responseOf(item)?.chart?.type || 'table'
  }))
)
</script>

<template>
  <div v-if="cards.length" class="dashboard-grid">
    <article v-for="card in cards" :key="card.raw.id" class="dashboard-card">
      <div class="dashboard-card-head">
        <div>
          <span class="chart-badge">{{ card.chartType }}</span>
          <small>{{ formatDate(card.raw.updated_at) }}</small>
        </div>
        <el-button
          class="icon-action danger"
          text
          circle
          @click="emit('remove', card.raw)"
        >
          ×
        </el-button>
      </div>
      <h3>{{ card.raw.name }}</h3>
      <p>{{ card.snapshot?.question || card.raw.description }}</p>
      <div class="dashboard-preview">
        <div v-if="card.chartType === 'kpi'" class="mini-kpi">
          <strong>{{ card.snapshot?.chart?.option?.value }}</strong>
          <span>关键指标</span>
        </div>
        <ChartView
          v-else-if="card.chartType !== 'table' && card.snapshot?.chart?.option"
          :option="card.snapshot.chart.option"
          height="190px"
        />
        <div v-else class="mini-table">
          <span v-for="column in (card.snapshot?.columns || []).slice(0, 4)" :key="column">
            {{ column }}
          </span>
        </div>
      </div>
      <div class="dashboard-card-foot">
        <span>{{ card.snapshot?.row_count ?? 0 }} 条数据</span>
        <el-button text type="primary" @click="emit('open', card.raw)">
          打开分析 →
        </el-button>
      </div>
    </article>
  </div>

  <section v-else class="empty-state compact-empty">
    <div class="empty-icon">▦</div>
    <h2>还没有保存的看板</h2>
    <p>完成一次分析后，点击“保存到看板”即可在这里长期查看。</p>
  </section>
</template>
