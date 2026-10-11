<template>
    <view class="cascade-picker">
        <!-- 触发区 -->
        <view class="cp-trigger" @tap="open">
            <text v-if="displayText" class="cp-value">{{ displayText }}</text>
            <text v-else class="cp-placeholder">{{ placeholder }}</text>
            <text class="cp-arrow">›</text>
        </view>

        <!-- 底部选择面板 -->
        <uni-popup ref="popup" type="bottom">
            <view class="cp-panel">
                <view class="cp-header">
                    <text class="cp-title">{{ title }}</text>
                    <view class="cp-actions">
                        <text v-if="clearable && hasValue" class="cp-clear" @tap="clear">清空</text>
                        <text class="cp-close" @tap="close">×</text>
                    </view>
                </view>

                <scroll-view scroll-y class="cp-body">
                    <view v-if="loading" class="cp-tip">加载中…</view>
                    <template v-else-if="flatNodes.length">
                        <view
                            v-for="node in flatNodes"
                            :key="node.value"
                            class="cp-row"
                            :class="{ active: String(node.value) === String(modelValue) }"
                            :style="{ paddingLeft: (22 + node.depth * 30) + 'rpx' }"
                            @tap="select(node)"
                        >
                            <text class="cp-row-label">
                                <text v-if="node.icon" class="cp-row-icon">{{ node.icon }}</text>
                                {{ node.name }}
                            </text>
                            <text v-if="String(node.value) === String(modelValue)" class="cp-check">✓</text>
                        </view>
                    </template>
                    <view v-else class="cp-tip">暂无可选项</view>
                </scroll-view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { resolveCascadePath } from '@/utils/cascade'

const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    tree: { type: Array, default: () => [] },
    title: { type: String, default: '请选择' },
    placeholder: { type: String, default: '请选择' },
    clearable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change'])

const popup = ref(null)
const loading = ref(false)

const hasValue = computed(
    () => props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== ''
)

const displayText = computed(() => resolveCascadePath(props.tree, props.modelValue))

const flatNodes = computed(() => {
    const result = []
    const walk = (nodes, depth) => {
        ;(nodes || []).forEach((node) => {
            result.push({ value: node.value, name: node.name, icon: node.icon, depth })
            if (node.children && node.children.length) {
                walk(node.children, depth + 1)
            }
        })
    }
    walk(props.tree, 0)
    return result
})

const open = () => {
    loading.value = false
    if (popup.value) popup.value.open()
}

const close = () => {
    if (popup.value) popup.value.close()
}

const select = (node) => {
    emit('update:modelValue', node.value)
    emit('change', node)
    close()
}

const clear = () => {
    emit('update:modelValue', '')
    emit('change', null)
    close()
}
</script>

<style scoped>
.cascade-picker {
    width: 100%;
}

.cp-trigger {
    min-height: 76rpx;
    padding: 0 20rpx;
    border-radius: 16rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface, #ffffff);
    display: flex;
    align-items: center;
    gap: 12rpx;
}
.cp-trigger:active {
    transform: scale(0.99);
}
.cp-value {
    flex: 1;
    font-size: 26rpx;
    font-weight: 700;
    color: var(--color-text);
}
.cp-placeholder {
    flex: 1;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}
.cp-arrow {
    font-size: 32rpx;
    color: var(--color-text-tertiary);
}

.cp-panel {
    background: var(--color-surface, #ffffff);
    border-radius: 24rpx 24rpx 0 0;
    padding: 22rpx 24rpx calc(22rpx + env(safe-area-inset-bottom));
}
.cp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6rpx 6rpx 18rpx;
}
.cp-title {
    font-size: 28rpx;
    font-weight: 800;
    color: var(--color-text);
}
.cp-actions {
    display: flex;
    align-items: center;
    gap: 24rpx;
}
.cp-clear {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}
.cp-close {
    font-size: 40rpx;
    line-height: 1;
    color: var(--color-text-tertiary);
}

.cp-body {
    max-height: 60vh;
}
.cp-tip {
    padding: 48rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}
.cp-row {
    min-height: 78rpx;
    padding-right: 12rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    border-bottom: 2rpx solid var(--color-border-light);
}
.cp-row:active {
    transform: scale(0.99);
}
.cp-row.active .cp-row-label {
    color: var(--color-primary);
    font-weight: 800;
}
.cp-row-label {
    flex: 1;
    font-size: 26rpx;
    font-weight: 700;
    color: var(--color-text);
}
.cp-row-icon {
    margin-right: 8rpx;
}
.cp-check {
    font-size: 30rpx;
    color: var(--color-primary);
}
</style>
