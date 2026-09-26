<template>
    <view v-if="hasContent" class="bm">
        <text class="bm-title">商业模式</text>
        <view v-if="gridCells.length" class="bm-grid">
            <view v-for="cell in gridCells" :key="cell.key" class="bm-cell">
                <text class="bm-label">{{ cell.label }}</text>
                <text class="bm-value">{{ cell.value || '--' }}</text>
            </view>
        </view>
        <view class="bm-cell bm-cost">
            <text class="bm-label">成本结构</text>
            <text class="bm-value">{{ costText }}</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    /** 九要素宫格项（3 列铺排，key 为 costStructure 的项归入底部成本结构行） */
    cells?: { key: string; label: string; value?: string }[]
    /** 成本结构（底部专行） */
    costStructure?: string
}>()

const COST_KEY = 'costStructure'

/** 成本结构取值：优先独立 prop，其次 cells 中的 costStructure 项 */
const costFromCells = computed(() => (props.cells || []).find((cell) => cell.key === COST_KEY))

const gridCells = computed(() => (props.cells || []).filter((cell) => cell.key !== COST_KEY))

const costText = computed(() => {
    if (props.costStructure) return props.costStructure
    if (costFromCells.value?.value) return costFromCells.value.value
    return '--'
})

const hasContent = computed(
    () => gridCells.value.some((cell) => !!cell.value) || costText.value !== '--'
)
</script>

<style scoped lang="scss">
.bm {
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.bm-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}

.bm-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 16rpx;
}

.bm-cell {
    width: calc((100% - 32rpx) / 3);
    box-sizing: border-box;
    padding: 18rpx 20rpx;
    border-radius: 18rpx;
    background: var(--color-surface-soft);
}

.bm-cost {
    width: 100%;
    margin-top: 16rpx;
}

.bm-label {
    display: block;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}

.bm-value {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-text);
    word-break: break-all;
}
</style>
