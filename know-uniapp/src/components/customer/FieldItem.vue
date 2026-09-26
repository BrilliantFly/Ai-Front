<template>
    <view class="field-row">
        <text class="field-label">{{ label }}</text>
        <text v-if="!hasSlot" class="field-value" :class="{ empty: isEmpty }">{{ displayValue }}</text>
        <view v-else class="field-value">
            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
    defineProps<{
        label: string
        value?: string | number | null
        /** 空值时兜底文案（默认 --） */
        emptyText?: string
    }>(),
    { value: null, emptyText: '--' }
)

const slots = useSlots()
const hasSlot = computed(() => !!slots.default)

const isEmpty = computed(() => {
    const v = props.value
    return v === null || v === undefined || String(v).trim() === ''
})

const displayValue = computed(() => {
    if (isEmpty.value) return props.emptyText
    return String(props.value)
})
</script>

<style scoped lang="scss">
.field-row {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);

    &:last-child {
        border-bottom: none;
    }
}

.field-label {
    flex-shrink: 0;
    width: 152rpx;
    font-size: 26rpx;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.field-value {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--color-text);
    word-break: break-all;
}

.field-value.empty {
    color: var(--color-text-tertiary);
}
</style>