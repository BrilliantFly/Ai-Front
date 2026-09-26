<template>
    <view v-if="items.length" class="stat-bar">
        <view
            v-for="(item, index) in items"
            :key="item.label"
            class="stat-cell"
            :class="{ first: index === 0 }"
        >
            <text class="stat-value">{{ formatNum(item.value) }}</text>
            <text class="stat-label">{{ item.label }}</text>
        </view>
    </view>
</template>

<script setup lang="ts">
defineProps<{
    /** 统计项（行业/企业/产品/客户 4 格） */
    items: { label: string; value: number | string }[]
}>()

/** 数量格式化：>=1e8 记 2 位小数（亿），>=1e4 记 1 位小数（万），其余原值 */
const formatNum = (value: number | string) => {
    if (value === null || value === undefined || value === '') return '--'
    const num = Number(value)
    if (Number.isNaN(num)) return String(value)
    if (num >= 1e8) return `${(num / 1e8).toFixed(2)}亿`
    if (num >= 1e4) return `${(num / 1e4).toFixed(1)}万`
    return String(value)
}
</script>

<style scoped lang="scss">
.stat-bar {
    display: flex;
    gap: 18rpx;
    padding: 24rpx 40rpx 0;
}

.stat-cell {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26rpx 10rpx 22rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.stat-value {
    font-size: 42rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-text);
}

.stat-label {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}

.stat-cell.first .stat-value,
.stat-cell.first .stat-label {
    color: var(--color-primary);
}
</style>
