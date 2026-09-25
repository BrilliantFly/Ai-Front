<template>
    <view class="section-card">
        <view class="section-header" @tap="collapsible && toggle()">
            <view class="section-title-wrap">
                <view class="section-dot"></view>
                <text class="section-title">{{ title }}</text>
            </view>
            <text v-if="collapsible" class="section-toggle">{{ collapsed ? '▾ 展开' : '▴ 收起' }}</text>
        </view>
        <view v-if="!collapsed" class="section-body">
            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    title: string
    /** 是否可折叠（头部点击展开/收起） */
    collapsible?: boolean
    /** 初始是否折叠（默认收起） */
    defaultCollapsed?: boolean
}>()

const collapsed = ref(props.defaultCollapsed ?? false)

const toggle = () => {
    collapsed.value = !collapsed.value
}
</script>

<style scoped lang="scss">
.section-card {
    margin: 20rpx 40rpx 0;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26rpx 28rpx;
}

.section-title-wrap {
    display: flex;
    align-items: center;
    gap: 14rpx;
}

.section-dot {
    width: 10rpx;
    height: 28rpx;
    border-radius: 5rpx;
    background: var(--gradient-primary);
}

.section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-text);
}

.section-toggle {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}

.section-body {
    padding: 4rpx 28rpx 28rpx;
    border-top: 1rpx solid var(--color-border-light);
}
</style>