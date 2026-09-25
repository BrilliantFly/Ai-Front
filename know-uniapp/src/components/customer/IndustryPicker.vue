<template>
    <view class="industry-picker">
        <!-- 触发区：显示已选行业 -->
        <view class="picker-trigger" @tap="open">
            <text
                v-if="selectedNames.length"
                class="picker-value"
            >{{ selectedNames.join('、') }}</text>
            <text v-else class="picker-placeholder">{{ placeholder }}</text>
            <text class="picker-arrow">›</text>
        </view>

        <!-- 底部选择面板 -->
        <uni-popup ref="popup" type="bottom">
            <view class="panel">
                <view class="panel-header">
                    <text class="panel-title">{{ title }}</text>
                    <view class="panel-actions">
                        <text class="panel-clear" @tap="clearAll">清空</text>
                        <text class="panel-close" @tap="close">×</text>
                    </view>
                </view>

                <view v-if="loading" class="panel-loading">加载中…</view>
                <view v-else-if="industries.length" class="panel-body">
                    <view class="chips-wrap">
                        <view
                            v-for="item in industries"
                            :key="item.id"
                            class="chip"
                            :class="{ active: isActive(item.id) }"
                            @tap="toggle(item.id)"
                        >
                            {{ item.industryName }}
                        </view>
                    </view>
                </view>
                <view v-else class="panel-loading">暂无行业数据</view>

                <view class="panel-footer">
                    <view class="btn btn-cancel" @tap="close">取消</view>
                    <view class="btn btn-confirm" @tap="confirm">确定</view>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, onMounted } from 'vue'
import { getIndustryList, type IndustryItem } from '@/api/customer'

const props = withDefaults(
    defineProps<{
        modelValue: number[]
        title?: string
        placeholder?: string
    }>(),
    { title: '选择所属行业', placeholder: '请选择所属行业（可多选）' }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: number[]): void
}>()

const popup = shallowRef()
const industries = ref<IndustryItem[]>([])
const loading = ref(false)
const draft = ref<number[]>([])

const active = computed<number[]>(() => props.modelValue ?? [])

const isActive = (id: number) => draft.value.includes(id)

const toggle = (id: number) => {
    const list = [...draft.value]
    const index = list.indexOf(id)
    if (index >= 0) {
        list.splice(index, 1)
    } else {
        list.push(id)
    }
    draft.value = list
}

const clearAll = () => {
    draft.value = []
}

const selectedNames = computed(() => {
    if (!industries.value.length || !active.value.length) return []
    return industries.value
        .filter((item) => active.value.includes(item.id))
        .map((item) => item.industryName)
})

const load = async () => {
    if (industries.value.length) return
    loading.value = true
    try {
        industries.value = (await getIndustryList()) || []
    } catch (error) {
        console.error('加载行业列表失败', error)
        industries.value = []
    } finally {
        loading.value = false
    }
}

const open = () => {
    draft.value = [...active.value]
    load()
    popup.value?.open()
}

onMounted(() => {
    load()
})

const close = () => {
    popup.value?.close()
}

const confirm = () => {
    // 保持用户勾选顺序，过滤无效 id
    const valid = draft.value.filter((id) => industries.value.some((item) => item.id === id))
    emit('update:modelValue', valid)
    close()
}
</script>

<style scoped lang="scss">
.industry-picker {
    padding: 8rpx 0;
}

.picker-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 72rpx;
    gap: 16rpx;
    padding: 8rpx 4rpx;
}

.picker-value {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: var(--color-text);
    line-height: 1.6;
}

.picker-placeholder {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: var(--color-text-tertiary);
}

.picker-arrow {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
}

/* ===== 面板 ===== */
.panel {
    background: var(--color-surface);
    border-radius: 24rpx 24rpx 0 0;
    padding: 32rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24rpx;
}

.panel-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.panel-actions {
    display: flex;
    align-items: center;
    gap: 32rpx;
}

.panel-clear {
    font-size: 26rpx;
    color: var(--color-text-secondary);
}

.panel-close {
    font-size: 44rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
}

.panel-loading {
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.panel-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.chips-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    padding-bottom: 24rpx;
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

.panel-footer {
    display: flex;
    gap: 20rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.btn {
    flex: 1;
    height: 84rpx;
    border-radius: 42rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
}

.btn-cancel {
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    border: 1rpx solid var(--color-border);
}

.btn-confirm {
    background: var(--color-primary);
    color: var(--color-btn-text);
}
</style>