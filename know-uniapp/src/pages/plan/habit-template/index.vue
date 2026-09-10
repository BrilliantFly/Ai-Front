<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">🎯 习惯模板</text>
            </view>
            <view class="header-actions">
                <view class="premium-header-btn" @tap="goCreate">新建</view>
            </view>
        </view>

        <view class="search-bar">
            <view class="search-input-wrap">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索习惯模板..."
                    placeholder-class="field-placeholder"
                    confirm-type="search"
                    @confirm="onSearch"
                />
            </view>
        </view>

        <view class="filter-tabs">
            <scroll-view scroll-x class="filter-scroll">
                <view
                    v-for="tab in filterTabs"
                    :key="tab.value"
                    class="filter-tab"
                    :class="{ active: activeFilter === tab.value }"
                    @tap="switchFilter(tab.value)"
                >
                    {{ tab.label }}
                </view>
            </scroll-view>
        </view>

        <scroll-view scroll-y class="page-scroll" @scrolltolower="loadMore">
            <view v-if="loading && !list.length" class="loading-state">
                <text class="loading-text">加载中...</text>
            </view>

            <view v-else-if="!list.length" class="empty-state">
                <text class="empty-icon">🎯</text>
                <text class="empty-text">暂无习惯模板</text>
            </view>

            <template v-else>
                <view
                    v-for="item in list"
                    :key="item.id"
                    class="ht-card"
                    @tap="goDetail(item.id)"
                >
                    <view class="ht-left">
                        <view class="ht-icon" :style="{ background: (item.color || 'var(--color-primary)') + '22', color: item.color || 'var(--color-primary)' }">
                            {{ item.icon || '🎯' }}
                        </view>
                        <view class="ht-info">
                            <text class="ht-name">{{ item.name }}</text>
                            <text class="ht-desc">{{ item.description || getFreqLabel(item) }}</text>
                        </view>
                    </view>
                    <view class="ht-right">
                        <text class="ht-count">{{ item.useCount || 0 }}人用</text>
                        <text class="ht-arrow">›</text>
                    </view>
                </view>
            </template>

            <view v-if="list.length && !hasMore" class="no-more">
                <text class="no-more-text">— 没有更多了 —</text>
            </view>

            <view style="height: 120rpx"></view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getHabitTemplateList, getHotHabitTemplates } from '@/api/plan/habit-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.ht-card,.filter-tab,.premium-header-btn')

const keyword = ref('')
const activeFilter = ref('all')
const list = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = 10
const hasMore = ref(true)
const hasLoaded = ref(false)

const filterTabs = computed(() => [
    { label: '全部', value: 'all' },
    { label: '习惯', value: 'habit' },
    { label: '我的', value: 'mine' }
])

const getFreqLabel = (item) => {
    const map = { daily: '每天', weekly: '每周', monthly: '每月', custom: '自定义' }
    return map[item.frequencyType] || item.frequencyType || ''
}

const fetchList = async (reset = true) => {
    if (loading.value) return
    if (reset) {
        pageNum.value = 1
        hasMore.value = true
        list.value = []
    }
    if (!hasMore.value) return
    loading.value = true
    try {
        const params = {
            pageNum: pageNum.value,
            pageSize,
            keyword: keyword.value || undefined,
            visibility: activeFilter.value === 'mine' ? 0 : undefined
        }
        const res = await getHabitTemplateList(params)
        const records = (res && res.records) || res || []
        if (reset) {
            list.value = records
        } else {
            list.value = [...list.value, ...records]
        }
        hasMore.value = records.length === pageSize
        pageNum.value++
    } catch (e) {
        console.error('加载习惯模板失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
        loading.value = false
    }
}

const switchFilter = (val) => {
    activeFilter.value = val
    fetchList(true)
}

const onSearch = () => {
    fetchList(true)
}

const loadMore = () => {
    if (hasMore.value && !loading.value) {
        fetchList(false)
    }
}

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) { uni.navigateBack() }
    else { uni.switchTab({ url: '/pages/knowledge/home/index' }) }
}

const goDetail = (id) => {
    uni.navigateTo({ url: `/pages/plan/habit-template/detail?id=${id}` })
}

const goCreate = () => {
    uni.navigateTo({ url: '/pages/plan/habit-template/detail?mode=create' })
}

onMounted(async () => {
    await fetchList()
    hasLoaded.value = true
})

onShow(async () => {
    if (!hasLoaded.value) return
    await fetchList()
})
</script>

<style scoped>
.plan-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-app);
    overflow: hidden;
}
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(24rpx + var(--status-bar-height)) 40rpx 16rpx;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}
.back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    margin-left: -16rpx;
}
.back-btn:active {
    background: var(--color-surface-soft);
}
.back-btn .back-icon {
    font-size: 44rpx;
    line-height: 1;
    color: var(--color-text);
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
}
.page-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text);
}
.premium-header-btn {
    padding: 10rpx 24rpx;
    border-radius: 999rpx;
    background: var(--color-primary-soft, #eef2ff);
    color: var(--color-primary);
    font-size: 24rpx;
    font-weight: 700;
}
.premium-header-btn:active {
    transform: scale(0.96);
}

.search-bar {
    padding: 0 32rpx 16rpx;
}
.search-input-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 72rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    background: var(--color-surface-soft, #f8fafc);
    border: 2rpx solid var(--color-border-light);
}
.search-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}
.search-input {
    flex: 1;
    font-size: 26rpx;
    color: var(--color-text);
}

.filter-tabs {
    padding: 0 32rpx 16rpx;
}
.filter-scroll {
    white-space: nowrap;
}
.filter-tab {
    display: inline-block;
    padding: 10rpx 28rpx;
    margin-right: 12rpx;
    border-radius: 999rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-surface-soft, #f8fafc);
    border: 2rpx solid var(--color-border-light);
    transition: all 0.2s;
}
.filter-tab.active {
    color: var(--color-primary);
    background: var(--color-primary-soft, #eef2ff);
    border-color: var(--color-primary);
}
.filter-tab:active {
    transform: scale(0.96);
}

.page-scroll {
    flex: 1;
    min-height: 0;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 120rpx 0;
}
.loading-text {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
}
.empty-icon {
    font-size: 80rpx;
}
.empty-text {
    font-size: 28rpx;
    color: var(--color-text-tertiary);
    margin-top: 16rpx;
}

.ht-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 32rpx 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    box-shadow: 0 2rpx 12rpx rgba(15, 23, 42, 0.04);
    animation: cardSlideIn 0.4s ease both;
}
.ht-card:active {
    transform: scale(0.98);
}
.ht-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
}
.ht-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
}
.ht-info {
    flex: 1;
    min-width: 0;
}
.ht-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.ht-desc {
    display: block;
    margin-top: 4rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}
.ht-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-shrink: 0;
}
.ht-count {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}
.ht-arrow {
    font-size: 32rpx;
    color: var(--color-text-tertiary);
}

.no-more {
    text-align: center;
    padding: 24rpx 0;
}
.no-more-text {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

@keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
