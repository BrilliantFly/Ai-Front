<template>
    <view class="finance-panel">
        <view v-for="item in items" :key="item.key" class="finance-cell">
            <text class="finance-value">{{ item.value }}</text>
            <text class="finance-label">{{ item.label }}</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    /** 毛利额 */
    grossProfit?: number
    /** 毛利率（%） */
    grossMargin?: number
    /** 净利额 */
    netProfit?: number
    /** 净利率（%） */
    netMargin?: number
}>()

/** 金额格式化：>=1e8 记 2 位小数（亿），>=1e4 记 1 位小数（万），其余原值 */
const formatAmount = (value?: number) => {
    if (value === null || value === undefined || value === '') return '--'
    const num = Number(value)
    if (Number.isNaN(num)) return String(value)
    if (num >= 1e8) return `${(num / 1e8).toFixed(2)}亿`
    if (num >= 1e4) return `${(num / 1e4).toFixed(1)}万`
    return String(num)
}

/** 比率格式化：补 % 后缀 */
const formatRate = (value?: number) => {
    if (value === null || value === undefined || value === '') return '--'
    const num = Number(value)
    if (Number.isNaN(num)) return String(value)
    return `${num}%`
}

const items = computed(() => [
    { key: 'grossProfit', label: '毛利额', value: formatAmount(props.grossProfit) },
    { key: 'grossMargin', label: '毛利率', value: formatRate(props.grossMargin) },
    { key: 'netProfit', label: '净利额', value: formatAmount(props.netProfit) },
    { key: 'netMargin', label: '净利率', value: formatRate(props.netMargin) }
])
</script>

<style scoped lang="scss">
.finance-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 18rpx;
    padding: 20rpx 0 4rpx;
}

.finance-cell {
    width: calc(50% - 9rpx);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26rpx 12rpx 22rpx;
    border-radius: 20rpx;
    background: var(--color-surface-soft);
}

.finance-value {
    font-size: 34rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-primary);
}

.finance-label {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}
</style>
