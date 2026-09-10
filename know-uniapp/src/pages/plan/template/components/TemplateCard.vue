<template>
    <view class="template-card premium-hover-lift" :style="{ borderLeftColor: t.color || '#6366f1' }" @tap="$emit('tap')">
        <view class="tc-top">
            <view class="tc-icon" :style="{ background: `linear-gradient(135deg, ${t.color || '#6366f1'}, ${(t.color || '#6366f1')}88)` }">
                {{ t.icon || '📋' }}
            </view>
            <view class="tc-info">
                <text class="tc-name">{{ t.name }}</text>
                <text class="tc-desc" v-if="t.description">{{ t.description }}</text>
            </view>
            <view v-if="t.planType" class="tc-type-badge" :style="{ color: t.color || 'var(--color-primary)', background: (t.color || 'var(--color-primary)') + '18' }">
                {{ t.planType }}
            </view>
        </view>
        <view class="tc-stats">
            <view class="tc-stat">
                <text class="tc-stat-num">{{ t.useCount || 0 }}</text>
                <text class="tc-stat-label">使用</text>
            </view>
            <view v-if="t.rating" class="tc-stat">
                <text class="tc-stat-num">{{ t.rating }}</text>
                <text class="tc-stat-label">评分</text>
            </view>
            <view v-if="t.durationDays" class="tc-stat">
                <text class="tc-stat-num">{{ t.durationDays }}天</text>
                <text class="tc-stat-label">周期</text>
            </view>
        </view>
        <view class="tc-bottom">
            <view v-if="t.visibility === 1" class="tc-tag tc-public">公开</view>
            <view v-else class="tc-tag tc-private">私有</view>
            <view class="tc-use-btn" @tap.stop="$emit('use')">
                <text>🚀 使用模板</text>
            </view>
        </view>
    </view>
</template>

<script setup>
defineProps({
    t: { type: Object, default: () => ({}) }
})
defineEmits(['tap', 'use'])
</script>

<style scoped>
.template-card {
    margin: 0 32rpx 20rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    border-left: 6rpx solid var(--color-primary);
    box-shadow: 0 2rpx 12rpx rgba(15, 23, 42, 0.05);
    animation: cardSlideIn 0.4s ease both;
}
.template-card:active {
    transform: scale(0.98);
}
.tc-top {
    display: flex;
    align-items: center;
    gap: 18rpx;
}
.tc-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    color: #fff;
    flex-shrink: 0;
}
.tc-info {
    flex: 1;
    min-width: 0;
}
.tc-name {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.tc-desc {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.tc-type-badge {
    font-size: 22rpx;
    font-weight: 700;
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    flex-shrink: 0;
}
.tc-stats {
    display: flex;
    gap: 24rpx;
    margin-top: 18rpx;
    padding-top: 14rpx;
    border-top: 1rpx solid var(--color-border-light);
}
.tc-stat {
    display: flex;
    align-items: center;
    gap: 6rpx;
}
.tc-stat-num {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--color-text);
}
.tc-stat-label {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}
.tc-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
}
.tc-tag {
    font-size: 20rpx;
    font-weight: 600;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
}
.tc-public {
    color: var(--color-success);
    background: rgba(82, 196, 26, 0.12);
}
.tc-private {
    color: var(--color-text-tertiary);
    background: var(--color-surface-soft);
}
.tc-use-btn {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--color-primary);
    padding: 10rpx 20rpx;
    border-radius: 999rpx;
    background: var(--color-primary-soft, #eef2ff);
}
.tc-use-btn:active {
    transform: scale(0.96);
}
@keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
