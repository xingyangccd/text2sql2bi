<script setup>
/**
 * ECharts 图表视图。
 * 直接消费后端返回的 chart.option 配置，保证前后端职责分离。
 */
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '360px' }
})

const container = ref(null)
let chart = null

function render() {
  if (!container.value) return
  if (!chart) {
    chart = echarts.init(container.value)
  }
  chart.setOption(
    {
      color: ['#5b5bd6', '#16a394', '#f59f47', '#e35d6a', '#76839a'],
      textStyle: { fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' },
      animationDuration: 400,
      ...props.option
    },
    true
  )
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  render()
  window.addEventListener('resize', resize)
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="container" class="chart-canvas" :style="{ height }" />
</template>
