<template>
    <view class="sub-section">
        <view class="sub-title">{{ title }}</view>
        <view class="sub-body">
            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
defineProps<{
    title: string
}>()
</script>

<style scoped lang="scss">
.sub-section {
    margin-top: 20rpx;
    border-radius: 20rpx;
    background: var(--color-surface-soft);

    &:first-child {
        margin-top: 0;
    }
}

.sub-title {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 20rpx 24rpx 4rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}

.sub-body {
    padding: 0 24rpx 12rpx;
}
</style>