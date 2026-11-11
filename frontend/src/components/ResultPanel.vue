<script setup>
/**
 * 查询结果展示：图表 / 数据表切换 + 指标卡 + SQL 面板。
 */
import { computed, ref, watch } from 'vue'
import ChartView from './ChartView.vue'
import SqlPanel from './SqlPanel.vue'

const props = defineProps({
  result: { type: Object, default: null }
})

const emit = defineEmits(['save'])

const activeView = ref('chart')
const sqlOpen = ref(false)

const chartType = computed(() => props.result?.chart?.type || 'table')

const chartTypeName = computed(
  () =>
    ({
      kpi: '指标卡',
      bar: '柱状图',
      line: '趋势图',
      pie: '占比图',
      table: '数据表'
    })[chartType.value]
)

const kpiValue = computed(() => props.result?.chart?.option?.value)

const isEmpty = computed(() => !props.result?.rows?.length)

/** 把二维数组转成 el-table 需要的对象数组 */
const tableRows = computed(() => {
  const rows = props.result?.rows || []
  return rows.map((row) => {
    const item = {}
    row.forEach((cell, index) => {
      item[`c${index}`] = cell
    })
    return item
  })
})

watch(
  () => props.result,
  (value) => {
    activeView.value = value?.chart?.type === 'table' ? 'table' : 'chart'
  }
)
</script>

<template>
  <section v-if="result" class="visual-card">
    <div class="card-toolbar">
      <el-radio-group v-model="activeView" size="small">
        <el-radio-button value="chart">图表</el-radio-button>
        <el-radio-button value="table">数据</el-radio-button>
      </el-radio-group>
      <div class="toolbar-actions">
        <span>{{ chartTypeName }}</span>
        <el-button size="small" @click="sqlOpen = !sqlOpen">&lt;/&gt; SQL</el-button>
        <el-button size="small" type="primary" @click="emit('save')">保存到看板</el-button>
      </div>
    </div>

    <!-- 指标卡 -->
    <div v-if="activeView === 'chart' && chartType === 'kpi'" class="kpi-view">
      <small>{{ result.chart?.title }}</small>
      <strong>{{ kpiValue }}</strong>
      <span>实时查询指标</span>
    </div>

    <!-- ECharts 图表 -->
    <ChartView
      v-else-if="activeView === 'chart' && chartType !== 'table'"
      :option="result.chart?.option || {}"
    />

    <!-- 数据表 -->
    <div v-else class="table-wrap">
      <el-table :data="tableRows" size="small" border stripe>
        <el-table-column
          v-for="(column, index) in result.columns"
          :key="column"
          :prop="`c${index}`"
          :label="column"
          min-width="120"
          show-overflow-tooltip
        />
      </el-table>
      <p v-if="isEmpty" class="empty-row">暂无数据</p>
    </div>

    <SqlPanel v-if="sqlOpen" :sql="result.sql" />
  </section>
</template>
