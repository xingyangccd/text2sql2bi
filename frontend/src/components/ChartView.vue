<script setup lang="ts">
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps<{ option: Record<string, unknown> }>()
const container = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!container.value) return
  chart ??= echarts.init(container.value)
  chart.setOption({
    color: ['#5b5bd6', '#16a394', '#f59f47', '#e35d6a', '#76839a'],
    textStyle: { fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' },
    animationDuration: 500,
    ...props.option,
  }, true)
}

onMounted(render)
watch(() => props.option, render, { deep: true })
useResizeObserver(container, () => chart?.resize())
onBeforeUnmount(() => chart?.dispose())
</script>

<template><div ref="container" class="chart-canvas" /></template>

