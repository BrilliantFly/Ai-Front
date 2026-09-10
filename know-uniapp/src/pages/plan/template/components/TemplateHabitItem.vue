<template>
    <view class="tpl-item" :class="{ disabled: disabled }">
        <view v-if="showCheck" class="tpl-check" @tap="toggle">
            <text :class="['check-icon', { checked: checked }]">{{ checked ? '☑' : '☐' }}</text>
        </view>
        <view class="tpl-icon" :style="{ background: (color || 'var(--color-primary)') + '22', color: color || 'var(--color-primary)' }">
            {{ icon || '🎯' }}
        </view>
        <view class="tpl-info">
            <text class="tpl-name">{{ name || ('习惯#' + (id || '?')) }}</text>
            <text v-if="subtitle" class="tpl-sub">{{ subtitle }}</text>
        </view>
    </view>
</template>

<script setup>
const props = defineProps({
    id: [String, Number],
    name: { type: String, default: '' },
    icon: { type: String, default: '🎯' },
    color: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    checked: { type: Boolean, default: true },
    showCheck: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:checked'])
const toggle = () => {
    if (props.disabled) return
    emit('update:checked', !props.checked)
}
</script>

<style scoped>
.tpl-item {
    display: flex;
    align-items: center;
    gap: 14rpx;
    padding: 14rpx 18rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft, #f8fafc);
    border: 1rpx solid var(--color-border-light);
    transition: opacity 0.2s;
}
.tpl-item.disabled {
    opacity: 0.5;
}
.tpl-check {
    flex-shrink: 0;
    padding: 4rpx;
}
.check-icon {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
}
.check-icon.checked {
    color: var(--color-primary);
}
.tpl-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    flex-shrink: 0;
}
.tpl-info {
    flex: 1;
    min-width: 0;
}
.tpl-name {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.tpl-sub {
    display: block;
    font-size: 22rpx;
    color: var(--color-text-tertiary);
    margin-top: 4rpx;
}
</style>
