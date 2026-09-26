<template>
    <view class="industry-tabs">
        <scroll-view class="tabs-scroll" scroll-x :show-scrollbar="false">
            <view class="tabs-inner">
                <view
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab-item"
                    :class="{ active: tab.key === current }"
                    @tap="select(tab.key)"
                >
                    <text class="tab-text">{{ tab.label }}</text>
                    <view v-if="tab.key === current" class="tab-slider"></view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    /** Tab 项（key/label） */
    tabs: { key: string; label: string }[]
    /** 当前选中 key，缺省取首项 */
    active?: string
}>()

const emit = defineEmits<{
    (e: 'change', key: string): void
}>()

const current = computed(() => props.active || props.tabs[0]?.key || '')

const select = (key: string) => {
    if (key === current.value) return
    emit('change', key)
}
</script>

<style scoped lang="scss">
.industry-tabs {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 16rpx 40rpx 0;
    background: var(--color-bg);
}

.tabs-scroll {
    width: 100%;
    white-space: nowrap;
    box-sizing: border-box;
}

.tabs-inner {
    display: inline-flex;
    align-items: stretch;
    padding: 8rpx;
    border-radius: 20rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.tab-item {
    position: relative;
    flex: 0 0 auto;
    min-width: 160rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
}

.tab-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.tab-item.active .tab-text {
    color: var(--color-primary);
}

.tab-slider {
    position: absolute;
    left: 24rpx;
    right: 24rpx;
    bottom: 4rpx;
    height: 6rpx;
    border-radius: 3rpx;
    background: var(--gradient-primary);
}
</style>
