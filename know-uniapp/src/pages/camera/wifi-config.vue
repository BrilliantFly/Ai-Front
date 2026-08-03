<template>
    <view class="wifi-config-page">
        <!-- 顶部标题栏：含返回按钮 -->
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <view>
                    <text class="page-title">WiFi配网</text>
                </view>
            </view>
        </view>
        <WiFiConfig :show-header="false" />
    </view>
</template>

<script setup lang="ts">
import { switchTabCompat } from '@/utils/util'
import WiFiConfig from '@/components/camera/WiFiConfig.vue'

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack()
    } else {
        switchTabCompat('/pages/index/index')
    }
}
</script>

<style lang="scss">
.wifi-config-page {
    min-height: 100vh;
    background: var(--color-bg);
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

.page-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.2;
}

.page-subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: var(--color-text-secondary);
}
</style>
