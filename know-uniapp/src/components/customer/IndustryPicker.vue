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
                <view v-else-if="rows.length" class="panel-body">
                    <view class="tree-wrap">
                        <view
                            v-for="item in rows"
                            :key="String(item.id)"
                            class="tree-row"
                            :class="{ active: isActive(item.id) }"
                            @tap="toggle(item.id)"
                        >
                            <text class="tree-indent">{{ '　'.repeat(item.depth) }}</text>
                            <text class="tree-label" :class="{ leaf: item.depth > 0 }">{{
                                item.industryName
                            }}</text>
                            <text
                                v-if="item.children?.length"
                                class="tree-count"
                                >{{ item.children.length }} 下级</text
                            >
                            <text v-if="isActive(item.id)" class="tree-check">✓</text>
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
import { getIndustryTree, type BizIndustry } from '@/api/biz/industry'

/** 摊平后的展示行：层级深度 + 是否含下级 */
interface IndustryRow extends BizIndustry {
    depth: number
}

const props = withDefaults(
    defineProps<{
        modelValue: Array<number | string>
        title?: string
        placeholder?: string
    }>(),
    { title: '选择所属行业', placeholder: '请选择所属行业（可多选）' }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: Array<number | string>): void
}>()

const popup = shallowRef()
const rows = ref<IndustryRow[]>([])
const loading = ref(false)
const draft = ref<Array<number | string>>([])

const active = computed<Array<number | string>>(() => props.modelValue ?? [])

/** 树 → 深度摊平（顶级在前，下级紧随父级，保留 children 用于计数） */
const flattenTree = (nodes: BizIndustry[] = [], depth = 0, out: IndustryRow[] = []): IndustryRow[] => {
    for (const node of nodes) {
        out.push({ ...node, depth })
        if (node.children?.length) flattenTree(node.children, depth + 1, out)
    }
    return out
}

const isActive = (id: number | string) =>
    draft.value.some((d) => String(d) === String(id))

const toggle = (id: number | string) => {
    const list = [...draft.value]
    const index = list.findIndex((d) => String(d) === String(id))
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
    if (!rows.value.length || !active.value.length) return []
    return active.value
        .map((id) => rows.value.find((item) => String(item.id) === String(id)))
        .filter((item): item is IndustryRow => !!item)
        .map((item) => item.industryName || '')
        .filter(Boolean)
})

const load = async () => {
    if (rows.value.length) return
    loading.value = true
    try {
        const tree = (await getIndustryTree()) || []
        rows.value = flattenTree(tree)
    } catch (error) {
        console.error('加载行业列表失败', error)
        rows.value = []
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
    const valid = draft.value.filter((id) => rows.value.some((item) => String(item.id) === String(id)))
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

.tree-wrap {
    padding-bottom: 24rpx;
}

.tree-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 20rpx 8rpx;
    border-bottom: 1rpx solid var(--color-border-light);

    &:last-child {
        border-bottom: none;
    }

    &:active {
        opacity: 0.8;
    }
}

.tree-indent {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
}

.tree-label {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tree-label.leaf {
    color: var(--color-text-secondary);
}

.tree-count {
    flex-shrink: 0;
    font-size: 20rpx;
    padding: 2rpx 12rpx;
    border-radius: 14rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-tertiary);
}

.tree-check {
    flex-shrink: 0;
    font-size: 30rpx;
    color: var(--color-primary);
}

.tree-row.active .tree-label {
    color: var(--color-primary);
    font-weight: 600;
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