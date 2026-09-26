<template>
    <view class="industry-page">
        <!-- hero 渐变页头（欢迎语视觉基准） -->
        <view class="hero-bar">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-title">
                    <text class="hero-name">行业管理</text>
                    <text class="hero-sub">集中维护行业信息与产业链关系</text>
                </view>
            </view>
        </view>

        <!-- 统计条（行业/企业/产品/客户 4 格；可换 StatBar 组件） -->
        <view class="stats-row">
            <view v-for="item in statItems" :key="item.label" class="stat-card">
                <text class="stat-num">{{ item.value }}</text>
                <text class="stat-label">{{ item.label }}</text>
            </view>
        </view>

        <!-- 搜索 -->
        <view class="search-section">
            <view class="search-box">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索行业名称或代码"
                    placeholder-class="search-placeholder"
                    confirm-type="search"
                    @input="onKeywordInput"
                />
                <text v-if="keyword" class="search-clear" @tap="clearKeyword">×</text>
            </view>
        </view>

        <!-- 行业列表（z-paging 分页流） -->
        <view class="list-wrap">
            <z-paging
                ref="paging"
                v-model="industryList"
                @query="queryList"
                :fixed="false"
                height="100%"
                :use-inner-scroll="true"
            >
                <view
                    v-for="item in industryList"
                    :key="String(item.id)"
                    class="industry-card"
                    hover-class="industry-card-hover"
                >
                    <view class="card-head">
                        <text class="card-title">{{ item.industryName || '--' }}</text>
                        <text v-if="item.industryCode" class="code-tag">{{
                            item.industryCode
                        }}</text>
                    </view>
                    <view v-if="tagList(item.tags).length" class="tag-wrap card-tags">
                        <text v-for="tag in tagList(item.tags)" :key="tag" class="tag-chip">{{
                            tag
                        }}</text>
                    </view>
                    <text class="card-desc">{{ item.definition || '暂无行业定义' }}</text>
                    <view class="card-actions">
                        <view class="action-btn" @tap.stop="goDetail(item)">详情</view>
                        <view class="action-btn" @tap.stop="goEdit(item)">编辑</view>
                        <view class="action-btn danger" @tap.stop="confirmDelete(item)">删除</view>
                    </view>
                </view>

                <!-- 空态 / 错误态 -->
                <template #empty>
                    <view class="empty-state">
                        <template v-if="loadFailed">
                            <view class="empty-icon">!</view>
                            <text class="empty-title">行业数据加载失败</text>
                            <text class="empty-desc">请检查网络后重试</text>
                            <view class="empty-btn" @tap="reload">重试</view>
                        </template>
                        <template v-else>
                            <view class="empty-icon">业</view>
                            <text class="empty-title">暂无行业数据</text>
                            <text class="empty-desc">点击下方按钮创建你的第一个行业</text>
                            <view class="empty-btn" @tap="goCreate">新建行业</view>
                        </template>
                    </view>
                </template>
            </z-paging>
        </view>

        <!-- 悬浮新建 -->
        <view class="fab" hover-class="fab-hover" @tap="goCreate">+</view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import {
    getIndustryPage,
    deleteIndustry,
    getIndustryStatistics,
    type BizIndustry
} from '@/api/biz/industry'

const router = useRouter()
const paging = shallowRef()
const keyword = ref('')
const industryList = ref<BizIndustry[]>([])
const loadFailed = ref(false)

/* 统计条（可换 StatBar 组件：props items:[{label,value}]） */
const statistics = ref<{
    industryCount: number | string
    enterpriseCount: number | string
    productCount: number | string
    relationCount: number | string
}>({
    industryCount: '--',
    enterpriseCount: '--',
    productCount: '--',
    relationCount: '--'
})

const statItems = computed(() => [
    { label: '行业', value: statistics.value.industryCount },
    { label: '企业', value: statistics.value.enterpriseCount },
    { label: '产品', value: statistics.value.productCount },
    { label: '客户', value: statistics.value.relationCount }
])

let keywordTimer: ReturnType<typeof setTimeout> | undefined

/* ---------- 列表分页 ---------- */
const queryList = async (pageNo: number, pageSize: number) => {
    try {
        const params: any = { pageNum: pageNo, pageSize }
        const kw = keyword.value.trim()
        if (kw) params.industryName = kw
        const res = await getIndustryPage(params)
        loadFailed.value = false
        paging.value?.complete(res.records || [], res.total)
    } catch (error) {
        console.error('加载行业列表失败', error)
        loadFailed.value = true
        paging.value?.complete(false)
    }
}

/** 搜索防抖 300ms */
const onKeywordInput = () => {
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
        paging.value?.reload()
    }, 300)
}

const clearKeyword = () => {
    keyword.value = ''
    paging.value?.reload()
}

const reload = () => {
    loadFailed.value = false
    paging.value?.reload()
}

/* ---------- 统计 ---------- */
const loadStatistics = async () => {
    try {
        const res = await getIndustryStatistics()
        statistics.value = {
            industryCount: res?.industryCount ?? '--',
            enterpriseCount: res?.enterpriseCount ?? '--',
            productCount: res?.productCount ?? '--',
            relationCount: res?.relationCount ?? '--'
        }
    } catch (error) {
        console.error('加载行业统计失败', error)
        statistics.value = {
            industryCount: '--',
            enterpriseCount: '--',
            productCount: '--',
            relationCount: '--'
        }
    }
}

/* ---------- 卡片操作 ---------- */
const goCreate = () => {
    router.navigateTo('/pages/industry/industry-form')
}

const goDetail = (item: BizIndustry) => {
    if (!item.id) return
    router.navigateTo(`/pages/industry/detail?id=${item.id}`)
}

const goEdit = (item: BizIndustry) => {
    if (!item.id) return
    router.navigateTo(`/pages/industry/industry-form?id=${item.id}`)
}

const confirmDelete = (item: BizIndustry) => {
    if (!item.id) return
    uni.showModal({
        title: '确认删除',
        content: '确定删除该记录？',
        success: async (res) => {
            if (!res.confirm) return
            try {
                await deleteIndustry(item.id as number | string)
                uni.showToast({ title: '删除成功', icon: 'success' })
                paging.value?.reload()
                loadStatistics()
            } catch (error) {
                console.error('删除行业失败', error)
                uni.showToast({ title: '删除失败', icon: 'none' })
            }
        }
    })
}

/* ---------- 标签拆分 ---------- */
const tagList = (value?: string) => {
    if (!value) return []
    return String(value)
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

let inited = false
onLoad(() => {
    loadStatistics()
})

onShow(() => {
    if (inited) {
        paging.value?.reload()
        loadStatistics()
    }
    inited = true
})
</script>

<style scoped lang="scss">
.industry-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 90rpx;
}

/* ===== hero 渐变页头（欢迎语视觉基准） ===== */
.hero-bar {
    position: relative;
    overflow: hidden;
    padding: 36rpx 40rpx 52rpx;
    background: var(--gradient-primary);

    /* #ifdef APP-PLUS */
    padding-top: calc(36rpx + var(--status-bar-height));
    /* #endif */

    &::before {
        content: '';
        position: absolute;
        right: -60rpx;
        top: -60rpx;
        width: 260rpx;
        height: 260rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100rpx;
        bottom: -90rpx;
        width: 220rpx;
        height: 220rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
    }
}

.deco-ring {
    position: absolute;
    top: -56rpx;
    right: 34rpx;
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(255, 255, 255, 0.16);
    pointer-events: none;
}

.deco-dot {
    position: absolute;
    right: 70rpx;
    bottom: 32rpx;
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 28rpx -18rpx 0 rgba(255, 255, 255, 0.12), -18rpx 24rpx 0 rgba(255, 255, 255, 0.12);
    pointer-events: none;
}

.hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}

.hero-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.hero-name {
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.hero-sub {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

/* ===== 统计条 ===== */
.stats-row {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 40rpx 0;
}

.stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 6rpx 22rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    min-width: 0;
}

.stat-num {
    font-size: 38rpx;
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1.2;
}

.stat-label {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}

/* ===== 搜索 ===== */
.search-section {
    padding: 24rpx 40rpx 0;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 38rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    border: 1rpx solid var(--color-border-light);
}

.search-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 28rpx;
    color: var(--color-text);
}

.search-placeholder {
    color: var(--color-text-tertiary);
}

.search-clear {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
    flex-shrink: 0;
}

/* ===== 列表 ===== */
.list-wrap {
    margin-top: 20rpx;
    height: calc(100vh - 460rpx);
    min-height: 320rpx;
}

.industry-card {
    margin: 0 40rpx 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.industry-card-hover {
    background: var(--color-surface-hover);
}

.card-head {
    display: flex;
    align-items: center;
    gap: 14rpx;
    flex-wrap: wrap;
}

.card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.code-tag {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    white-space: nowrap;
}

.tag-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.tag-chip {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    white-space: nowrap;
}

.card-tags {
    margin-top: 14rpx;
}

.card-desc {
    display: -webkit-box;
    margin-top: 14rpx;
    font-size: 25rpx;
    line-height: 1.6;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 20rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.action-btn {
    padding: 10rpx 28rpx;
    border-radius: 28rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
}

.action-btn.danger {
    background: var(--color-danger-soft);
    color: var(--color-danger-rgb);
}

/* ===== 空态 ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 110rpx 40rpx 0;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 64rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-title {
    margin-top: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.empty-desc {
    margin-top: 12rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

.empty-btn {
    margin-top: 36rpx;
    padding: 20rpx 64rpx;
    border-radius: 40rpx;
    background: var(--color-primary);
    color: var(--color-btn-text);
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: var(--shadow-glow);
}

/* ===== FAB ===== */
.fab {
    position: fixed;
    right: 40rpx;
    bottom: calc(40rpx + env(safe-area-inset-bottom));
    z-index: 50;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    line-height: 1;
    box-shadow: var(--shadow-glow);
}

.fab-hover {
    transform: scale(0.96);
}
</style>
