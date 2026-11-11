import { computed, onMounted, ref } from 'vue';
import { format } from 'sql-formatter';
import { api } from './api';
import ChartView from './components/ChartView.vue';
const question = ref('');
const loading = ref(false);
const syncing = ref(false);
const online = ref(false);
const activePage = ref('analysis');
const result = ref(null);
const dashboards = ref([]);
const queryHistory = ref([]);
const historySearch = ref('');
const expandedHistoryId = ref(null);
const error = ref('');
const activeView = ref('chart');
const sqlOpen = ref(false);
const sqlCopied = ref(false);
const history = ref([]);
const suggestions = [
    '按月份统计2026年已支付订单的销售额趋势',
    '各区域客户贡献的销售额分别是多少？',
    '销售额最高的5个产品是什么？',
    '不同渠道的订单数量和平均客单价',
];
const chartTypeName = computed(() => ({ kpi: '指标卡', bar: '柱状图', line: '趋势图', pie: '占比图', table: '数据表' }[result.value?.chart?.type ?? 'table']));
const pageHeading = computed(() => ({
    analysis: ['数据工作台 / 对话分析', '让数据直接回答问题'],
    dashboards: ['数据工作台 / 数据看板', '沉淀你的关键业务洞察'],
    history: ['数据工作台 / 查询历史', '回顾每一次数据探索'],
}[activePage.value]));
const filteredHistory = computed(() => {
    const keyword = historySearch.value.trim().toLowerCase();
    return keyword ? queryHistory.value.filter((item) => item.question.toLowerCase().includes(keyword)) : queryHistory.value;
});
const formattedSql = computed(() => {
    const sql = result.value?.sql;
    if (!sql)
        return '';
    try {
        return format(sql, {
            language: 'postgresql',
            keywordCase: 'upper',
            tabWidth: 2,
            linesBetweenQueries: 1,
        });
    }
    catch {
        return sql;
    }
});
function formatSql(sql) {
    try {
        return format(sql, { language: 'postgresql', keywordCase: 'upper', tabWidth: 2 });
    }
    catch {
        return sql;
    }
}
function dashboardResponse(item) {
    const response = item.definition?.response;
    return response && typeof response === 'object' && 'question' in response
        ? response
        : null;
}
function formatDate(value) {
    return new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
}
async function showPage(page) {
    activePage.value = page;
    error.value = '';
    if (page === 'dashboards')
        dashboards.value = await api.dashboards().catch(() => []);
    if (page === 'history')
        queryHistory.value = await api.history().catch(() => []);
}
async function runQuery(text = question.value) {
    const clean = text.trim();
    if (!clean || loading.value)
        return;
    question.value = clean;
    loading.value = true;
    error.value = '';
    try {
        const response = await api.query(clean, history.value);
        result.value = response;
        history.value.push({ role: 'user', content: clean }, { role: 'assistant', content: response.answer });
        queryHistory.value = await api.history().catch(() => queryHistory.value);
        activeView.value = response.chart?.type === 'table' ? 'table' : 'chart';
        question.value = '';
    }
    catch (e) {
        error.value = e instanceof Error ? e.message : '查询失败';
    }
    finally {
        loading.value = false;
    }
}
async function syncSchema() {
    syncing.value = true;
    error.value = '';
    try {
        const data = await api.syncSchema();
        error.value = `已同步 ${data.tables} 张业务表到 Qdrant`;
    }
    catch (e) {
        error.value = e instanceof Error ? e.message : '同步失败';
    }
    finally {
        syncing.value = false;
    }
}
async function saveCurrent() {
    if (!result.value)
        return;
    const name = window.prompt('仪表盘名称', result.value.chart?.title ?? result.value.question);
    if (!name)
        return;
    await api.saveDashboard(name, { query: result.value.question, response: result.value });
    dashboards.value = await api.dashboards();
}
function openDashboard(item) {
    const saved = dashboardResponse(item);
    if (!saved)
        return;
    result.value = saved;
    activePage.value = 'analysis';
    sqlOpen.value = false;
}
async function removeDashboard(item) {
    if (!window.confirm(`确定删除看板“${item.name}”吗？`))
        return;
    await api.deleteDashboard(item.id);
    dashboards.value = dashboards.value.filter((dashboard) => dashboard.id !== item.id);
}
async function rerunHistory(item) {
    activePage.value = 'analysis';
    history.value = [];
    await runQuery(item.question);
}
async function removeHistory(item) {
    if (!window.confirm('确定删除这条查询记录吗？'))
        return;
    await api.deleteHistory(item.id);
    queryHistory.value = queryHistory.value.filter((record) => record.id !== item.id);
}
function newAnalysis() {
    activePage.value = 'analysis';
    result.value = null;
    history.value = [];
    question.value = '';
    error.value = '';
}
async function copySql() {
    if (!result.value?.sql)
        return;
    await window.navigator.clipboard.writeText(result.value.sql);
    sqlCopied.value = true;
    window.setTimeout(() => { sqlCopied.value = false; }, 1600);
}
onMounted(async () => {
    online.value = (await api.health().catch(() => ({ database: false }))).database;
    dashboards.value = await api.dashboards().catch(() => []);
    queryHistory.value = await api.history().catch(() => []);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-shell" },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "sidebar" },
});
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand" },
});
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "brand-mark" },
});
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.newAnalysis) },
    ...{ class: "new-analysis" },
});
/** @type {__VLS_StyleScopedClasses['new-analysis']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "nav-label" },
});
/** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showPage('analysis'));
            // @ts-ignore
            [newAnalysis, showPage,];
        } },
    ...{ class: (['nav-item', { active: __VLS_ctx.activePage === 'analysis' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showPage('dashboards'));
            // @ts-ignore
            [showPage, activePage,];
        } },
    ...{ class: (['nav-item', { active: __VLS_ctx.activePage === 'dashboards' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showPage('history'));
            // @ts-ignore
            [showPage, activePage,];
        } },
    ...{ class: (['nav-item', { active: __VLS_ctx.activePage === 'history' }]) },
});
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "nav-label dashboards-label" },
});
/** @type {__VLS_StyleScopedClasses['nav-label']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboards-label']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.dashboards))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.openDashboard(item));
                // @ts-ignore
                [activePage, dashboards, openDashboard,];
            } },
        key: (item.id),
        ...{ class: "saved-item" },
    });
    /** @type {__VLS_StyleScopedClasses['saved-item']} */ ;
    (item.name);
    // @ts-ignore
    [];
}
if (!__VLS_ctx.dashboards.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty-saved" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-saved']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-footer" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "avatar" },
});
/** @type {__VLS_StyleScopedClasses['avatar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "topbar" },
});
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "eyebrow" },
});
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
(__VLS_ctx.pageHeading[0]);
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
(__VLS_ctx.pageHeading[1]);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-actions" },
});
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: (['status', __VLS_ctx.online ? 'online' : 'offline']) },
});
/** @type {__VLS_StyleScopedClasses['status']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.i)({});
(__VLS_ctx.online ? '服务正常' : '服务离线');
if (__VLS_ctx.activePage === 'analysis') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.syncSchema) },
        ...{ class: "source-button" },
        disabled: (__VLS_ctx.syncing),
    });
    /** @type {__VLS_StyleScopedClasses['source-button']} */ ;
    (__VLS_ctx.syncing ? '同步中…' : '↻ 同步数据源');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "workspace" },
});
/** @type {__VLS_StyleScopedClasses['workspace']} */ ;
if (__VLS_ctx.activePage === 'analysis') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "query-card" },
    });
    /** @type {__VLS_StyleScopedClasses['query-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "query-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['query-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "spark" },
    });
    /** @type {__VLS_StyleScopedClasses['spark']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
        ...{ onSubmit: (...[$event]) => {
                if (!(__VLS_ctx.activePage === 'analysis'))
                    throw 0;
                return (__VLS_ctx.runQuery());
                // @ts-ignore
                [activePage, activePage, dashboards, pageHeading, pageHeading, online, online, syncSchema, syncing, syncing, runQuery,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
        ...{ onKeydown: (...[$event]) => {
                if (!(__VLS_ctx.activePage === 'analysis'))
                    throw 0;
                return (__VLS_ctx.runQuery());
                // @ts-ignore
                [runQuery,];
            } },
        value: (__VLS_ctx.question),
        rows: "3",
        placeholder: "例如：按月份统计今年各区域的销售额趋势，并找出增长最快的区域",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "query-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['query-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        disabled: (__VLS_ctx.loading || !__VLS_ctx.question.trim()),
    });
    (__VLS_ctx.loading ? '分析中…' : '开始分析 →');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "suggestions" },
    });
    /** @type {__VLS_StyleScopedClasses['suggestions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    for (const [item] of __VLS_vFor((__VLS_ctx.suggestions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activePage === 'analysis'))
                        throw 0;
                    return (__VLS_ctx.runQuery(item));
                    // @ts-ignore
                    [runQuery, question, question, loading, loading, suggestions,];
                } },
            key: (item),
        });
        (item);
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.error) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: (['notice', __VLS_ctx.error.startsWith('已同步') ? 'success' : '']) },
        });
        /** @type {__VLS_StyleScopedClasses['notice']} */ ;
        (__VLS_ctx.error);
    }
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "loading-panel" },
        });
        /** @type {__VLS_StyleScopedClasses['loading-panel']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: "loader" },
        });
        /** @type {__VLS_StyleScopedClasses['loader']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    }
    else if (__VLS_ctx.result) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-head" },
        });
        /** @type {__VLS_StyleScopedClasses['result-head']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        (__VLS_ctx.result.chart?.title || __VLS_ctx.result.question);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "result-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['result-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.result.row_count);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.result.duration_ms);
        if (__VLS_ctx.result.from_cache) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "insight-strip" },
        });
        /** @type {__VLS_StyleScopedClasses['insight-strip']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.result.answer);
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "visual-card" },
        });
        /** @type {__VLS_StyleScopedClasses['visual-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-toolbar" },
        });
        /** @type {__VLS_StyleScopedClasses['card-toolbar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "tabs" },
        });
        /** @type {__VLS_StyleScopedClasses['tabs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activePage === 'analysis'))
                        throw 0;
                    if (!!(__VLS_ctx.loading))
                        throw 0;
                    if (!(__VLS_ctx.result))
                        throw 0;
                    return (__VLS_ctx.activeView = 'chart');
                    // @ts-ignore
                    [loading, error, error, error, result, result, result, result, result, result, result, activeView,];
                } },
            ...{ class: ({ active: __VLS_ctx.activeView === 'chart' }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activePage === 'analysis'))
                        throw 0;
                    if (!!(__VLS_ctx.loading))
                        throw 0;
                    if (!(__VLS_ctx.result))
                        throw 0;
                    return (__VLS_ctx.activeView = 'table');
                    // @ts-ignore
                    [activeView, activeView,];
                } },
            ...{ class: ({ active: __VLS_ctx.activeView === 'table' }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "toolbar-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['toolbar-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.chartTypeName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activePage === 'analysis'))
                        throw 0;
                    if (!!(__VLS_ctx.loading))
                        throw 0;
                    if (!(__VLS_ctx.result))
                        throw 0;
                    return (__VLS_ctx.sqlOpen = !__VLS_ctx.sqlOpen);
                    // @ts-ignore
                    [activeView, chartTypeName, sqlOpen, sqlOpen,];
                } },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.saveCurrent) },
            ...{ class: "save" },
        });
        /** @type {__VLS_StyleScopedClasses['save']} */ ;
        if (__VLS_ctx.activeView === 'chart' && __VLS_ctx.result.chart?.type === 'kpi') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "kpi-view" },
            });
            /** @type {__VLS_StyleScopedClasses['kpi-view']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            (__VLS_ctx.result.chart.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.result.chart.option.value);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else if (__VLS_ctx.activeView === 'chart' && __VLS_ctx.result.chart && __VLS_ctx.result.chart.type !== 'table') {
            const __VLS_0 = ChartView;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                option: (__VLS_ctx.result.chart.option),
            }));
            const __VLS_2 = __VLS_1({
                option: (__VLS_ctx.result.chart.option),
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "table-wrap" },
            });
            /** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            for (const [column] of __VLS_vFor((__VLS_ctx.result.columns))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
                    key: (column),
                });
                (column);
                // @ts-ignore
                [result, result, result, result, result, result, result, activeView, activeView, saveCurrent,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [row, i] of __VLS_vFor((__VLS_ctx.result.rows))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (i),
                });
                for (const [cell, j] of __VLS_vFor((row))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                        key: (j),
                    });
                    (cell);
                    // @ts-ignore
                    [result,];
                }
                // @ts-ignore
                [];
            }
            if (!__VLS_ctx.result.rows.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            }
        }
        if (__VLS_ctx.sqlOpen) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "sql-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['sql-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "sql-panel-head" },
            });
            /** @type {__VLS_StyleScopedClasses['sql-panel-head']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.i)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.copySql) },
            });
            (__VLS_ctx.sqlCopied ? '已复制' : '复制 SQL');
            __VLS_asFunctionalElement1(__VLS_intrinsics.pre, __VLS_intrinsics.pre)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
            (__VLS_ctx.formattedSql);
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "capabilities" },
        });
        /** @type {__VLS_StyleScopedClasses['capabilities']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
}
else if (__VLS_ctx.activePage === 'dashboards') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-title-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-title-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.newAnalysis) },
        ...{ class: "primary-action" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-action']} */ ;
    if (__VLS_ctx.dashboards.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dashboard-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.dashboards))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                key: (item.id),
                ...{ class: "dashboard-card" },
            });
            /** @type {__VLS_StyleScopedClasses['dashboard-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dashboard-card-head" },
            });
            /** @type {__VLS_StyleScopedClasses['dashboard-card-head']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "chart-badge" },
            });
            /** @type {__VLS_StyleScopedClasses['chart-badge']} */ ;
            (__VLS_ctx.dashboardResponse(item)?.chart?.type ?? 'table');
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            (__VLS_ctx.formatDate(item.updated_at));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'analysis'))
                            throw 0;
                        if (!(__VLS_ctx.activePage === 'dashboards'))
                            throw 0;
                        if (!(__VLS_ctx.dashboards.length))
                            throw 0;
                        return (__VLS_ctx.removeDashboard(item));
                        // @ts-ignore
                        [newAnalysis, activePage, dashboards, dashboards, result, sqlOpen, copySql, sqlCopied, formattedSql, dashboardResponse, formatDate, removeDashboard,];
                    } },
                ...{ class: "icon-action danger" },
                title: "删除看板",
            });
            /** @type {__VLS_StyleScopedClasses['icon-action']} */ ;
            /** @type {__VLS_StyleScopedClasses['danger']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            (item.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            (__VLS_ctx.dashboardResponse(item)?.question || item.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dashboard-preview" },
            });
            /** @type {__VLS_StyleScopedClasses['dashboard-preview']} */ ;
            if (__VLS_ctx.dashboardResponse(item)?.chart?.type === 'kpi') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mini-kpi" },
                });
                /** @type {__VLS_StyleScopedClasses['mini-kpi']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (__VLS_ctx.dashboardResponse(item)?.chart?.option.value);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            }
            else if (__VLS_ctx.dashboardResponse(item)?.chart && __VLS_ctx.dashboardResponse(item)?.chart?.type !== 'table') {
                const __VLS_5 = ChartView;
                // @ts-ignore
                const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
                    option: (__VLS_ctx.dashboardResponse(item).chart.option),
                }));
                const __VLS_7 = __VLS_6({
                    option: (__VLS_ctx.dashboardResponse(item).chart.option),
                }, ...__VLS_functionalComponentArgsRest(__VLS_6));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "mini-table" },
                });
                /** @type {__VLS_StyleScopedClasses['mini-table']} */ ;
                for (const [column] of __VLS_vFor((__VLS_ctx.dashboardResponse(item)?.columns.slice(0, 4)))) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        key: (column),
                    });
                    (column);
                    // @ts-ignore
                    [dashboardResponse, dashboardResponse, dashboardResponse, dashboardResponse, dashboardResponse, dashboardResponse, dashboardResponse,];
                }
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "dashboard-card-foot" },
            });
            /** @type {__VLS_StyleScopedClasses['dashboard-card-foot']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.dashboardResponse(item)?.row_count ?? 0);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'analysis'))
                            throw 0;
                        if (!(__VLS_ctx.activePage === 'dashboards'))
                            throw 0;
                        if (!(__VLS_ctx.dashboards.length))
                            throw 0;
                        return (__VLS_ctx.openDashboard(item));
                        // @ts-ignore
                        [openDashboard, dashboardResponse,];
                    } },
            });
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "empty-state compact-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.newAnalysis) },
            ...{ class: "primary-action" },
        });
        /** @type {__VLS_StyleScopedClasses['primary-action']} */ ;
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-title-row history-title-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-title-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['history-title-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "history-search" },
    });
    /** @type {__VLS_StyleScopedClasses['history-search']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "搜索历史问题",
    });
    (__VLS_ctx.historySearch);
    if (__VLS_ctx.filteredHistory.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "history-list" },
        });
        /** @type {__VLS_StyleScopedClasses['history-list']} */ ;
        for (const [item] of __VLS_vFor((__VLS_ctx.filteredHistory))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                key: (item.id),
                ...{ class: "history-item" },
            });
            /** @type {__VLS_StyleScopedClasses['history-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['history-icon']} */ ;
            (item.chart_type === 'line' ? '⌁' : item.chart_type === 'pie' ? '◔' : item.chart_type === 'kpi' ? '#' : '▦');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-main" },
            });
            /** @type {__VLS_StyleScopedClasses['history-main']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
            (item.question);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-meta" },
            });
            /** @type {__VLS_StyleScopedClasses['history-meta']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.chart_type.toUpperCase());
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (item.duration_ms);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatDate(item.created_at));
            if (__VLS_ctx.expandedHistoryId === item.id) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "history-sql" },
                });
                /** @type {__VLS_StyleScopedClasses['history-sql']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.pre, __VLS_intrinsics.pre)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({});
                (__VLS_ctx.formatSql(item.sql));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "history-actions" },
            });
            /** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'analysis'))
                            throw 0;
                        if (!!(__VLS_ctx.activePage === 'dashboards'))
                            throw 0;
                        if (!(__VLS_ctx.filteredHistory.length))
                            throw 0;
                        return (__VLS_ctx.expandedHistoryId = __VLS_ctx.expandedHistoryId === item.id ? null : item.id);
                        // @ts-ignore
                        [newAnalysis, formatDate, historySearch, filteredHistory, filteredHistory, expandedHistoryId, expandedHistoryId, expandedHistoryId, formatSql,];
                    } },
            });
            (__VLS_ctx.expandedHistoryId === item.id ? '收起 SQL' : '查看 SQL');
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'analysis'))
                            throw 0;
                        if (!!(__VLS_ctx.activePage === 'dashboards'))
                            throw 0;
                        if (!(__VLS_ctx.filteredHistory.length))
                            throw 0;
                        return (__VLS_ctx.rerunHistory(item));
                        // @ts-ignore
                        [expandedHistoryId, rerunHistory,];
                    } },
                ...{ class: "rerun" },
            });
            /** @type {__VLS_StyleScopedClasses['rerun']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'analysis'))
                            throw 0;
                        if (!!(__VLS_ctx.activePage === 'dashboards'))
                            throw 0;
                        if (!(__VLS_ctx.filteredHistory.length))
                            throw 0;
                        return (__VLS_ctx.removeHistory(item));
                        // @ts-ignore
                        [removeHistory,];
                    } },
                ...{ class: "icon-action danger" },
                title: "删除记录",
            });
            /** @type {__VLS_StyleScopedClasses['icon-action']} */ ;
            /** @type {__VLS_StyleScopedClasses['danger']} */ ;
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "empty-state compact-empty" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        (__VLS_ctx.historySearch ? '没有匹配的查询' : '暂无查询历史');
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        (__VLS_ctx.historySearch ? '换一个关键词试试。' : '成功执行的自然语言查询会自动保存在这里。');
    }
}
// @ts-ignore
[historySearch, historySearch,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
