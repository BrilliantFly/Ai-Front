<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">📅 日程模板</text>
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
                    placeholder="搜索日程模板..."
                    placeholder-class="field-placeholder"
                    confirm-type="search"
                    @confirm="onSearch"
                />
            </view>
        </view>

        <scroll-view scroll-y class="page-scroll" @scrolltolower="loadMore">
            <view v-if="loading && !list.length" class="loading-state">
                <text class="loading-text">加载中...</text>
            </view>

            <view v-else-if="!list.length" class="empty-state">
                <text class="empty-icon">📅</text>
                <text class="empty-text">暂无日程模板</text>
            </view>

            <template v-else>
                <view
                    v-for="item in list"
                    :key="item.id"
                    class="et-card"
                    @tap="goDetail(item.id)"
                >
                    <view class="et-left">
                        <view class="et-icon">📅</view>
                        <view class="et-info">
                            <text class="et-name">{{ item.name }}</text>
                            <view class="et-tags">
                                <text v-if="item.eventType" class="et-tag">{{ item.eventType }}</text>
                                <text v-if="item.quadrant" class="et-tag">{{ item.quadrant }}</text>
                                <text v-if="item.priority" class="et-tag">⭐{{ item.priority }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="et-right">
                        <text class="et-count">{{ item.useCount || 0 }}人用</text>
                        <text class="et-arrow">›</text>
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
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getEventTemplateList } from '@/api/plan/event-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.et-card,.premium-header-btn')

const keyword = ref('')
const list = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = 10
const hasMore = ref(true)
const hasLoaded = ref(false)

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
            keyword: keyword.value || undefined
        }
        const res = await getEventTemplateList(params)
        const records = (res && res.records) || res || []
        if (reset) {
            list.value = records
        } else {
            list.value = [...list.value, ...records]
        }
        hasMore.value = records.length === pageSize
        pageNum.value++
    } catch (e) {
        console.error('加载日程模板失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
        loading.value = false
    }
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
    uni.navigateTo({ url: `/pages/plan/event-template/detail?id=${id}` })
}

const goCreate = () => {
    uni.navigateTo({ url: '/pages/plan/event-template/detail?mode=create' })
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

.et-card {
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
.et-card:active {
    transform: scale(0.98);
}
.et-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
}
.et-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    background: var(--color-primary-soft, #eef2ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
}
.et-info {
    flex: 1;
    min-width: 0;
}
.et-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.et-tags {
    display: flex;
    gap: 8rpx;
    margin-top: 6rpx;
    flex-wrap: wrap;
}
.et-tag {
    font-size: 20rpx;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-surface-soft, #f8fafc);
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
}
.et-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-shrink: 0;
}
.et-count {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}
.et-arrow {
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
