<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">📋 计划模板</text>
            </view>
            <view class="header-actions">
                <view class="premium-header-btn" @tap="goMyTemplates">我的</view>
            </view>
        </view>

        <view class="search-bar">
            <view class="search-input-wrap">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索模板..."
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
            <!-- 热门模板 -->
            <view v-if="hotList.length" class="section-block">
                <view class="section-hdr">
                    <span class="title">🔥 热门模板</span>
                </view>
                <scroll-view scroll-x class="hot-scroll">
                    <view class="hot-list">
                        <view
                            v-for="item in hotList"
                            :key="item.id"
                            class="hot-card"
                            @tap="goDetail(item.id)"
                        >
                            <view class="hot-icon" :style="{ background: `linear-gradient(135deg, ${item.color || '#6366f1'}, ${(item.color || '#6366f1')}88)` }">
                                {{ item.icon || '📋' }}
                            </view>
                            <text class="hot-name">{{ item.name }}</text>
                            <text class="hot-count">{{ item.useCount || 0 }}人使用</text>
                        </view>
                    </view>
                </scroll-view>
            </view>

            <!-- 全部/我的模板 -->
            <view class="section-block">
                <view class="section-hdr">
                    <span class="title">{{ activeFilter === 'mine' ? '我的模板' : '全部模板' }}</span>
                    <span class="count-badge">{{ listTotal }}个</span>
                </view>

                <view v-if="loading && !list.length" class="loading-state">
                    <text class="loading-text">加载中...</text>
                </view>

                <view v-else-if="!list.length" class="empty-state">
                    <text class="empty-icon">📭</text>
                    <text class="empty-text">暂无模板</text>
                </view>

                <template v-else>
                    <TemplateCard
                        v-for="item in list"
                        :key="item.id"
                        :t="item"
                        @tap="goDetail(item.id)"
                        @use="goUse(item.id)"
                    />
                </template>

                <view v-if="list.length && !hasMore" class="no-more">
                    <text class="no-more-text">— 没有更多了 —</text>
                </view>
            </view>

            <view style="height: 120rpx"></view>
        </scroll-view>

        <view class="floating-add" @tap="goCreate">+</view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TemplateCard from './components/TemplateCard.vue'
import { getTemplateList, getHotTemplates } from '@/api/plan/template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.template-card,.floating-add,.filter-tab,.hot-card')

const keyword = ref('')
const activeFilter = ref('all')
const hotList = ref([])
const list = ref([])
const listTotal = ref(0)
const loading = ref(false)
const pageNum = ref(1)
const pageSize = 10
const hasMore = ref(true)
const hasLoaded = ref(false)

const filterTabs = computed(() => [
    { label: '全部', value: 'all' },
    { label: '习惯', value: 'habit' },
    { label: '日程', value: 'schedule' },
    { label: '综合', value: 'combo' },
    { label: '我的', value: 'mine' }
])

const fetchHot = async () => {
    try {
        const res = await getHotTemplates({ pageSize: 10 })
        hotList.value = (res && res.records) || res || []
    } catch (e) {
        console.error('加载热门模板失败', e)
    }
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
            planType: activeFilter.value !== 'all' && activeFilter.value !== 'mine' ? activeFilter.value : undefined,
            visibility: activeFilter.value === 'mine' ? 0 : undefined
        }
        const res = await getTemplateList(params)
        const records = (res && res.records) || res || []
        if (reset) {
            list.value = records
        } else {
            list.value = [...list.value, ...records]
        }
        listTotal.value = (res && res.total) || list.value.length
        hasMore.value = records.length === pageSize
        pageNum.value++
    } catch (e) {
        console.error('加载模板列表失败', e)
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

const goMyTemplates = () => {
    activeFilter.value = 'mine'
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
    uni.navigateTo({ url: `/pages/plan/template/detail?id=${id}` })
}

const goUse = (id) => {
    uni.navigateTo({ url: `/pages/plan/template/use?id=${id}` })
}

const goCreate = () => {
    uni.navigateTo({ url: '/pages/plan/template/detail?mode=create' })
}

onMounted(async () => {
    await Promise.all([fetchHot(), fetchList()])
    hasLoaded.value = true
})

onShow(async () => {
    if (!hasLoaded.value) return
    await Promise.all([fetchHot(), fetchList()])
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

.section-block {
    margin-bottom: 16rpx;
}
.section-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 32rpx 12rpx;
}
.section-hdr .title {
    font-size: 30rpx;
    font-weight: 700;
    color: var(--color-text);
}
.count-badge {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
    background: var(--color-surface-soft);
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
}

.hot-scroll {
    white-space: nowrap;
    padding: 0 32rpx;
}
.hot-list {
    display: inline-flex;
    gap: 16rpx;
}
.hot-card {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: 180rpx;
    padding: 20rpx 12rpx;
    border-radius: 20rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.04);
}
.hot-card:active {
    transform: scale(0.96);
}
.hot-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    color: #fff;
    margin-bottom: 10rpx;
}
.hot-name {
    font-size: 24rpx;
    font-weight: 600;
    color: var(--color-text);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160rpx;
}
.hot-count {
    font-size: 20rpx;
    color: var(--color-text-tertiary);
    margin-top: 4rpx;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 80rpx 0;
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

.no-more {
    text-align: center;
    padding: 24rpx 0;
}
.no-more-text {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

.floating-add {
    position: fixed;
    right: 40rpx;
    bottom: 122rpx;
    z-index: 50;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary, #ff8700), #8980f0);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    box-shadow: var(--shadow-glow, 0 8rpx 32rpx rgba(255, 135, 0, 0.2));
    transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.floating-add:active {
    transform: scale(0.95);
}
</style>
