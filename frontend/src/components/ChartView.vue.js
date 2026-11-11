import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
const props = defineProps();
const container = ref();
let chart = null;
function render() {
    if (!container.value)
        return;
    chart ??= echarts.init(container.value);
    chart.setOption({
        color: ['#5b5bd6', '#16a394', '#f59f47', '#e35d6a', '#76839a'],
        textStyle: { fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' },
        animationDuration: 500,
        ...props.option,
    }, true);
}
onMounted(render);
watch(() => props.option, render, { deep: true });
useResizeObserver(container, () => chart?.resize());
onBeforeUnmount(() => chart?.dispose());
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ref: "container",
    ...{ class: "chart-canvas" },
});
/** @type {__VLS_StyleScopedClasses['chart-canvas']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
