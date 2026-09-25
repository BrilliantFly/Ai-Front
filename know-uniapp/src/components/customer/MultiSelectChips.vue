<template>
    <view class="chips-field">
        <view v-if="options.length" class="chips-wrap">
            <view
                v-for="opt in options"
                :key="String(opt.value)"
                class="chip"
                :class="{ active: isActive(opt.value) }"
                @tap="toggle(opt.value)"
            >
                {{ opt.label }}
            </view>
        </view>
        <text v-else class="chips-empty">{{ placeholder }}</text>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        modelValue: (string | number)[]
        options: { label: string; value: string | number }[]
        placeholder?: string
    }>(),
    { placeholder: '请选择（可多选）' }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: (string | number)[]): void
}>()

const active = computed<(string | number)[]>(() => props.modelValue ?? [])

const isActive = (value: string | number) => active.value.includes(value)

const toggle = (value: string | number) => {
    const list = [...active.value]
    const index = list.indexOf(value)
    if (index >= 0) {
        list.splice(index, 1)
    } else {
        list.push(value)
    }
    emit('update:modelValue', list)
}
</script>

<style scoped lang="scss">
.chips-field {
    padding: 8rpx 0;
}

.chips-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.chip {
    padding: 12rpx 28rpx;
    border-radius: 30rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 26rpx;
    border: 1rpx solid var(--color-border-light);
}

.chip.active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-glow);
}

.chips-empty {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}
</style>