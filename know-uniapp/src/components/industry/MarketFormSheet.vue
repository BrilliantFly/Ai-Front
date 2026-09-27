<template>
    <uni-popup ref="popup" type="bottom" @change="onPopupChange">
        <view class="sheet-panel" :class="{ expanded }">
            <!-- 拖拽把手（小记风格） -->
            <view class="sheet-handle"></view>

            <!-- 标题行（小记风格：居中标题 + 右上角全屏/收起 + 关闭） -->
            <view class="sheet-title-row">
                <text class="sheet-title">{{ heroTitle }}</text>
                <view class="sheet-title-actions">
                    <view class="sheet-expand" @tap="toggleExpand">
                        <text class="sheet-expand-text">{{ expanded ? '收起' : '全屏' }}</text>
                    </view>
                    <view class="sheet-close" @tap="close">×</view>
                </view>
            </view>

            <!-- 区段（配置驱动：marketSections） -->
            <scroll-view scroll-y class="sheet-scroll">
                <view class="sheet-body">
                    <view v-for="section in formSections" :key="section.title">
                        <SectionCard
                            :title="section.title"
                            :collapsible="true"
                            :default-collapsed="false"
                        >
                            <view
                                v-for="block in section.blocks"
                                :key="block.key"
                                :class="block.level === 2 ? 'leaf-block' : 'sub-block'"
                            >
                                <text :class="block.level === 2 ? 'leaf-title' : 'sub-title'">{{
                                    block.title
                                }}</text>

                                <view
                                    v-for="field in block.fields"
                                    :key="field.key"
                                    class="form-field"
                                >
                                    <view class="field-label-row">
                                        <text class="field-label">{{ field.label }}</text>
                                        <text v-if="field.required" class="required-mark">*</text>
                                    </view>

                                    <!-- 单选 select -->
                                    <view
                                        v-if="field.type === 'select'"
                                        class="field-select"
                                        hover-class="field-select-hover"
                                        @tap="openSelect(field)"
                                    >
                                        <text
                                            class="field-select-value"
                                            :class="{ placeholder: !selectLabel(field) }"
                                            >{{
                                                selectLabel(field) || field.placeholder || '请选择'
                                            }}</text
                                        >
                                        <text class="field-select-arrow">›</text>
                                    </view>

                                    <!-- 多选 chips -->
                                    <MultiSelectChips
                                        v-else-if="field.type === 'selectMultiple'"
                                        v-model="formData[field.key]"
                                        :options="field.options || []"
                                        :placeholder="field.placeholder || '请选择（可多选）'"
                                    />

                                    <!-- 行业多选 -->
                                    <IndustryPicker
                                        v-else-if="field.type === 'industryPicker'"
                                        v-model="formData[field.key]"
                                        :placeholder="
                                            field.placeholder || '请选择所属行业（可多选）'
                                        "
                                    />

                                    <!-- 文本域 -->
                                    <textarea
                                        v-else-if="field.type === 'textarea'"
                                        v-model="formData[field.key]"
                                        class="field-textarea"
                                        :placeholder="
                                            field.placeholder || defaultPlaceholder(field)
                                        "
                                        placeholder-class="field-placeholder"
                                    />

                                    <!-- 数字输入 -->
                                    <input
                                        v-else-if="field.type === 'number'"
                                        v-model="formData[field.key]"
                                        class="field-input"
                                        type="digit"
                                        :placeholder="
                                            field.placeholder || defaultPlaceholder(field)
                                        "
                                        placeholder-class="field-placeholder"
                                    />

                                    <!-- 普通文本输入 -->
                                    <input
                                        v-else
                                        v-model="formData[field.key]"
                                        class="field-input"
                                        type="text"
                                        :placeholder="
                                            field.placeholder || defaultPlaceholder(field)
                                        "
                                        placeholder-class="field-placeholder"
                                    />
                                </view>
                            </view>
                        </SectionCard>
                    </view>
                    <view class="sheet-bottom-space"></view>
                </view>
            </scroll-view>

            <!-- 底部操作栏（中文按钮） -->
            <view class="sheet-bottom-bar">
                <view class="form-btn cancel" :class="{ disabled: saving }" @tap="close">取消</view>
                <view class="form-btn primary" :class="{ disabled: saving }" @tap="submit">
                    {{ saving ? '保存中…' : '保存' }}
                </view>
            </view>
        </view>
    </uni-popup>

    <!-- 单选弹层（自绘，样式同 popup 底部面板） -->
    <view v-if="selectVisible" class="select-mask">
        <view class="select-panel">
            <view class="select-panel-header">
                <text class="select-panel-title">请选择</text>
                <text class="select-panel-close" @tap="selectVisible = false">×</text>
            </view>
            <scroll-view scroll-y class="select-options-wrap">
                <view
                    v-for="opt in selectOptions"
                    :key="String(opt.value)"
                    class="select-option"
                    @tap="pickSelectOption(opt)"
                >
                    <text class="select-option-text">{{ opt.label }}</text>
                    <text
                        v-if="String(selectValue) === String(opt.value)"
                        class="select-option-check"
                        >✓</text
                    >
                </view>
            </scroll-view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SectionCard from '@/components/customer/SectionCard.vue'
import MultiSelectChips from '@/components/customer/MultiSelectChips.vue'
import IndustryPicker from '@/components/customer/IndustryPicker.vue'
import { useLockFn } from '@/hooks/useLockFn'
import { marketSections } from '@/config/market-sections'
import type { UniFieldDef, UniSectionDef } from '@/config/industry-sections'
import {
    createMarket,
    saveMarket,
    getMarketByIndustryId,
    type BizIndustryMarket
} from '@/api/biz/industry/market'

const props = withDefaults(
    defineProps<{
        show: boolean
        /** create 新建 / edit 编辑（需传 recordId） */
        mode?: 'create' | 'edit'
        /** 市场记录雪花 ID（edit 时必传；保持字符串，禁止 Number()） */
        recordId?: number | string
        /** 所属行业 ID（市场以行业为主键；必填） */
        industryId: number | string
    }>(),
    { mode: 'create', recordId: '' }
)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved'): void
}>()

const popup = ref<any>(null)
const formData = ref<Record<string, any>>({})

/* 全屏/收起（半屏 62vh，全屏撑满） */
const expanded = ref(false)
const toggleExpand = () => {
    expanded.value = !expanded.value
}

/* hero 页头文案 */
const isEdit = computed(() => props.mode === 'edit')
const heroTitle = computed(() => (isEdit.value ? '编辑市场' : '新建市场'))

/* ---------- 配置摊平（区段 > 块 > 字段，块沿用配置层级） ---------- */
interface FormBlock {
    key: string
    title: string
    level: number
    fields: UniFieldDef[]
}

interface FormSection {
    title: string
    blocks: FormBlock[]
}

const normalizeSections = (sections: UniSectionDef[]): FormSection[] =>
    sections.map((section) => ({
        title: section.title,
        blocks: (section.subSections || []).flatMap((sub) => {
            const blocks: FormBlock[] = []
            if (sub.fields && sub.fields.length) {
                blocks.push({
                    key: `${section.title}-${sub.title}`,
                    title: sub.title,
                    level: 1,
                    fields: sub.fields
                })
            }
            for (const leaf of sub.subSections || []) {
                blocks.push({
                    key: `${section.title}-${sub.title}-${leaf.title}`,
                    title: leaf.title,
                    level: 2,
                    fields: leaf.fields || []
                })
            }
            return blocks
        })
    }))

const formSections = computed<FormSection[]>(() => normalizeSections(marketSections))

const allFields = computed<UniFieldDef[]>(() =>
    formSections.value.flatMap((section) => section.blocks.flatMap((block) => block.fields))
)

const multiFields = computed<Set<string>>(
    () => new Set(allFields.value.filter((f) => f.type === 'selectMultiple').map((f) => f.key))
)

/* 关联 id 数组原样提交（后端按数组接收） */
const ARRAY_KEYS = new Set(['industryIds'])
/* 后端声明为数字的字段 */
const NUMBER_KEYS = new Set(['grossProfit', 'grossMargin', 'netProfit', 'netMargin'])

/* ---------- 开关（show → open/close；@change 驱动初始化与回填） ---------- */
watch(
    () => props.show,
    (val) => {
        if (val) {
            popup.value?.open()
        } else {
            popup.value?.close()
        }
    }
)

const onPopupChange = (e: { show: boolean }) => {
    if (e.show) {
        resetForm()
        // 市场以行业为主键：编辑时按行业查市场样本
        if (isEdit.value && props.industryId) {
            fillForm()
        }
    } else {
        emit('close')
    }
}

/* ---------- 控件辅助 ---------- */
const defaultPlaceholder = (field: UniFieldDef) => {
    const label = field.label.replace(/（.*?）/g, '')
    return `请输入${label}（选填）`
}

const selectLabel = (field: UniFieldDef) => {
    const value = formData.value[field.key]
    if (value === undefined || value === null || value === '') return ''
    const opt = (field.options || []).find((o) => String(o.value) === String(value))
    return opt ? opt.label : String(value)
}

let activeSelectField: UniFieldDef | null = null
const selectOptions = ref<{ label: string; value: string | number }[]>([])
const selectVisible = ref(false)
const selectValue = ref<string | number>('')

const openSelect = (field: UniFieldDef) => {
    activeSelectField = field
    selectOptions.value = field.options || []
    selectValue.value = formData.value[field.key] ?? ''
    selectVisible.value = true
}

const pickSelectOption = (opt: { label: string; value: string | number }) => {
    if (activeSelectField) {
        formData.value[activeSelectField.key] = opt.value
    }
    selectVisible.value = false
}

/* ---------- 表单初值 / 回显 ---------- */
const resetForm = () => {
    const base: Record<string, any> = {}
    for (const field of allFields.value) {
        base[field.key] =
            field.type === 'selectMultiple' || field.type === 'industryPicker' ? [] : ''
    }
    base.industryIds = props.industryId ? [props.industryId] : []
    formData.value = base
    expanded.value = false
}

const toArray = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw
    if (raw === undefined || raw === null || raw === '') return []
    return String(raw)
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

const fillForm = async () => {
    try {
        const detail = (await getMarketByIndustryId(props.industryId)) || ({} as BizIndustryMarket)
        const next: Record<string, any> = {}
        for (const field of allFields.value) {
            const raw = (detail as any)[field.key]
            if (field.type === 'selectMultiple' || field.type === 'industryPicker') {
                next[field.key] = toArray(raw)
            } else {
                next[field.key] = raw === undefined || raw === null ? '' : raw
            }
        }
        next.industryIds = props.industryId ? [props.industryId] : []
        formData.value = next
    } catch (error) {
        console.error('加载市场资料失败', error)
        uni.showToast({ title: '加载市场资料失败', icon: 'none' })
    }
}

/* ---------- 提交 ---------- */
const isEmptyValue = (v: any) =>
    v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

const isChoiceField = (field: UniFieldDef) =>
    field.type === 'select' ||
    field.type === 'selectMultiple' ||
    field.type === 'industryPicker' ||
    field.type === 'date'

const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {}
    for (const [key, value] of Object.entries(formData.value)) {
        if (isEmptyValue(value)) continue
        if (ARRAY_KEYS.has(key) && Array.isArray(value)) {
            payload[key] = value
        } else if (multiFields.value.has(key) && Array.isArray(value)) {
            // 后端多选字段为逗号分隔字符串
            payload[key] = value.join(',')
        } else if (NUMBER_KEYS.has(key)) {
            payload[key] = Number(value)
        } else {
            payload[key] = value
        }
    }
    return payload
}

const doSubmit = async () => {
    const payload = buildPayload()
    try {
        if (isEdit.value) {
            // 市场以行业为主键：saveMarket(行业ID, {…payload, id: 市场ID})
            const primaryIndustryId = props.industryId
            await saveMarket(primaryIndustryId, { ...payload, id: props.recordId })
        } else {
            await createMarket(payload)
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
            popup.value?.close()
            emit('saved')
        }, 500)
    } catch (error) {
        console.error('保存市场失败', error)
        uni.showToast({ title: '保存失败', icon: 'none' })
    }
}

const { isLock, lockFn } = useLockFn(doSubmit)
const saving = computed(() => isLock.value)

const submit = async () => {
    if (isLock.value) return
    for (const field of allFields.value) {
        if (!field.required) continue
        if (isEmptyValue(formData.value[field.key])) {
            const verb = isChoiceField(field) ? '请选择' : '请填写'
            uni.showToast({ title: `${verb}${field.label}`, icon: 'none' })
            return
        }
    }
    await lockFn()
}

const close = () => {
    if (isLock.value) return
    popup.value?.close()
}
</script>

<style scoped lang="scss">
/* ===== 弹层骨架（对齐小记弹层：白底 + 32 圆角 + 内部滚动） ===== */
.sheet-panel {
    width: 100%;
    background: var(--color-surface);
    border-radius: 32rpx 32rpx 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sheet-handle {
    flex-shrink: 0;
    width: 64rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--color-border);
    margin: 24rpx auto 8rpx;
}

/* ===== 标题行（小记风格：居中标题 + 右上角操作） ===== */
.sheet-title-row {
    position: relative;
    flex-shrink: 0;
    padding: 8rpx 0 24rpx;
}

.sheet-title {
    display: block;
    text-align: center;
    font-size: 34rpx;
    font-weight: 700;
    color: var(--color-text);
}

.sheet-title-actions {
    position: absolute;
    right: 8rpx;
    top: 0;
    display: flex;
    align-items: center;
    gap: 18rpx;
}

.sheet-expand {
    padding: 8rpx 20rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);

    &:active {
        opacity: 0.8;
    }
}

.sheet-expand-text {
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.sheet-close {
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-soft);
    color: var(--color-text-tertiary);
    font-size: 40rpx;
    line-height: 1;

    &:active {
        opacity: 0.8;
    }
}

.sheet-scroll {
    max-height: 68vh;
    min-height: 200rpx;

    .sheet-panel.expanded & {
        max-height: calc(100vh - 300rpx - env(safe-area-inset-bottom));
    }
}

.sheet-body {
    padding: 0 32rpx;
}

.sheet-bottom-space {
    height: 24rpx;
}

.sheet-bottom-bar {
    flex-shrink: 0;
    display: flex;
    gap: 20rpx;
    padding: 20rpx 0 calc(24rpx + env(safe-area-inset-bottom));
    background: transparent;
}

/* ===== 区段内块 ===== */
.sub-block {
    padding: 4rpx 0 8rpx;

    &:first-child {
        padding-top: 20rpx;
    }
}

.sub-title {
    display: block;
    font-size: 26rpx;
    font-weight: 700;
    color: var(--color-text);
    padding-bottom: 6rpx;
}

.leaf-block {
    padding-top: 12rpx;
}

.leaf-title {
    display: block;
    font-size: 24rpx;
    color: var(--color-text-secondary);
    padding-bottom: 6rpx;
}

/* ===== 字段 ===== */
.form-field {
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);

    &:last-child {
        border-bottom: none;
    }
}

.field-label-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 12rpx;
}

.field-label {
    font-size: 26rpx;
    font-weight: 700;
    color: var(--color-text);
}

.required-mark {
    font-size: 26rpx;
    color: var(--color-danger-rgb);
}

.field-input {
    display: flex;
    align-items: center;
    height: 82rpx;
    padding: 0 24rpx;
    border-radius: 18rpx;
    background: var(--color-surface);
    border: 1rpx solid var(--color-border-light);
    font-size: 30rpx;
    color: var(--color-text);

    &:focus-within {
        border-color: var(--color-primary);
    }
}

.field-textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx 24rpx;
    border-radius: 18rpx;
    background: var(--color-surface);
    border: 1rpx solid var(--color-border-light);
    font-size: 30rpx;
    line-height: 1.55;
    color: var(--color-text);
    box-sizing: border-box;

    &:focus-within {
        border-color: var(--color-primary);
    }
}

.field-placeholder {
    color: var(--color-text-tertiary);
}

/* 单选行 */
.field-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    height: 82rpx;
    padding: 0 24rpx;
    border-radius: 18rpx;
    background: var(--color-surface);
    border: 1rpx solid var(--color-border-light);
}

.field-select-hover {
    border-color: var(--color-primary);
    background: var(--color-surface-soft);
}

.field-select-value {
    font-size: 30rpx;
    color: var(--color-text);
}

.field-select-value.placeholder {
    color: var(--color-text-tertiary);
}

.field-select-arrow {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
}

/* ===== 底部操作栏（对齐小记按钮） ===== */
.form-btn {
    height: 88rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;

    &:active {
        opacity: 0.85;
    }
}

.form-btn.cancel {
    flex: 1;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
}

.form-btn.primary {
    flex: 1.2;
    background: var(--gradient-primary);
    color: var(--color-btn-text);
    box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3);
}

.form-btn.disabled {
    opacity: 0.6;
}

/* ===== 单选弹层 ===== */
.select-mask {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: flex-end;
    animation: select-mask-in 0.2s ease-out;
}

.select-panel {
    width: 100%;
    background: var(--color-surface);
    border-radius: 32rpx 32rpx 0 0;
    padding: 32rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
    max-height: 60vh;
    display: flex;
    flex-direction: column;
    animation: select-panel-in 0.24s ease-out;
}

.select-options-wrap {
    min-height: 0;
    max-height: 40vh;
}

.select-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20rpx;
}

.select-panel-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.select-panel-close {
    font-size: 44rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
}

.select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 8rpx;
    border-bottom: 1rpx solid var(--color-border-light);

    &:last-child {
        border-bottom: none;
    }
}

.select-option-text {
    font-size: 28rpx;
    color: var(--color-text);
}

.select-option-check {
    font-size: 32rpx;
    color: var(--color-primary);
}

/* ===== 弹层动画（底部滑出） ===== */
@keyframes select-mask-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes select-panel-in {
    from {
        transform: translateY(60%);
    }
    to {
        transform: translateY(0);
    }
}
</style>
