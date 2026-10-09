<template>
    <view class="enterprise-picker">
        <!-- 触发区：显示已选企业 -->
        <view class="picker-trigger" @tap="open">
            <text v-if="selectedName" class="picker-value">{{ selectedName }}</text>
            <text v-else class="picker-placeholder">{{ placeholder }}</text>
            <text class="picker-arrow">›</text>
        </view>

        <!-- 底部选择面板（单选 + 关键字搜索） -->
        <uni-popup ref="popup" type="bottom">
            <view class="panel">
                <view class="panel-header">
                    <text class="panel-title">{{ title }}</text>
                    <view class="panel-actions">
                        <text class="panel-clear" @tap="clear">清空</text>
                        <text class="panel-close" @tap="close">×</text>
                    </view>
                </view>

                <!-- 搜索框 -->
                <view class="search-bar">
                    <input
                        v-model="keyword"
                        class="search-input"
                        type="text"
                        placeholder="搜索企业名称"
                        placeholder-class="search-placeholder"
                        confirm-type="search"
                        @input="onKeywordInput"
                    />
                </view>

                <view v-if="loading" class="panel-loading">加载中…</view>
                <view v-else-if="filtered.length" class="panel-body">
                    <view
                        v-for="item in filtered"
                        :key="String(item.id)"
                        class="enterprise-option"
                        :class="{ active: isActive(item.id) }"
                        @tap="pick(item)"
                    >
                        <view class="enterprise-main">
                            <text class="enterprise-name" :class="{ selected: isActive(item.id) }">{{
                                item.enterpriseName || '--'
                            }}</text>
                            <text v-if="item.enterpriseType" class="enterprise-type">{{
                                item.enterpriseType
                            }}</text>
                        </view>
                        <text
                            v-if="isActive(item.id)"
                            class="enterprise-check"
                        >✓</text>
                    </view>
                    <view v-if="!filtered.length && !loading" class="panel-empty">未找到匹配企业</view>
                </view>
                <view v-else class="panel-loading">暂无企业数据</view>

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
import { getEnterprisePage, type BizIndustryEnterprise } from '@/api/biz/industry/enterprise'

const props = withDefaults(
    defineProps<{
        modelValue?: number | string
        title?: string
        placeholder?: string
    }>(),
    { modelValue: undefined, title: '选择所属企业', placeholder: '请选择所属企业（自行业企业库）' }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value?: number | string): void
}>()

const popup = shallowRef()
const enterprises = ref<BizIndustryEnterprise[]>([])
const loading = ref(false)
const keyword = ref('')
const draft = ref<number | string | undefined>(undefined)

const filtered = computed(() => {
    const kw = keyword.value.trim()
    if (!kw) return enterprises.value
    return enterprises.value.filter((item) => (item.enterpriseName || '').includes(kw))
})

const isActive = (id: number | string) => String(draft.value) === String(id)

const selectedName = computed(() => {
    if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') return ''
    const found = enterprises.value.find((item) => String(item.id) === String(props.modelValue))
    return found ? found.enterpriseName || '' : ''
})

const load = async () => {
    if (enterprises.value.length) return
    loading.value = true
    try {
        const records: BizIndustryEnterprise[] = []
        const pageSize = 500
        let pageNum = 1
        let total = 0
        do {
            const res: any = await getEnterprisePage({ pageNum, pageSize })
            const list = res?.records || []
            records.push(...list)
            total = Number(res?.total || 0)
            if (!list.length) break
            pageNum += 1
        } while (records.length < total)
        enterprises.value = records
    } catch (error) {
        console.error('加载行业企业库失败', error)
        enterprises.value = []
    } finally {
        loading.value = false
    }
}

const open = () => {
    draft.value = props.modelValue
    keyword.value = ''
    load()
    popup.value?.open()
}

const onKeywordInput = () => {
    // 关键字过滤走 computed filtered，无需额外逻辑
}

const pick = (item: BizIndustryEnterprise) => {
    draft.value = item.id
}

const clear = () => {
    draft.value = undefined
}

const confirm = () => {
    emit('update:modelValue', draft.value)
    close()
}

const close = () => {
    popup.value?.close()
}

onMounted(() => {
    load()
})
</script>

<style scoped lang="scss">
.enterprise-picker {
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
    max-height: 72vh;
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

/* ===== 搜索 ===== */
.search-bar {
    padding-bottom: 20rpx;
}

.search-input {
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
    font-size: 28rpx;
    color: var(--color-text);
}

.search-placeholder {
    color: var(--color-text-tertiary);
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

.enterprise-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 26rpx 8rpx;
    border-bottom: 1rpx solid var(--color-border-light);
}

.enterprise-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.enterprise-name {
    font-size: 28rpx;
    color: var(--color-text);
    line-height: 1.4;
}

.enterprise-name.selected {
    color: var(--color-primary);
    font-weight: 600;
}

.enterprise-type {
    flex-shrink: 0;
    font-size: 22rpx;
    color: var(--color-text-secondary);
    background: var(--color-surface-soft);
    padding: 4rpx 16rpx;
    border-radius: 18rpx;
}

.enterprise-check {
    font-size: 32rpx;
    color: var(--color-primary);
}

.panel-empty {
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
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