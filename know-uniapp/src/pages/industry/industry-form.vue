<template>
    <view class="form-page">
        <!-- hero 渐变头部卡（参考首页标语/欢迎语视觉） -->
        <view class="form-hero">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="form-hero-top">
                <view class="form-hero-avatar">{{ heroInitial }}</view>
                <view class="form-hero-main">
                    <text class="form-hero-title">{{ heroTitle }}</text>
                    <text class="form-hero-sub">{{ heroSub }}</text>
                </view>
            </view>
        </view>

        <!-- 区段（配置驱动：industrySections） -->
        <scroll-view scroll-y class="form-scroll">
            <view v-for="section in formSections" :key="section.title">
                <SectionCard :title="section.title" :collapsible="true" :default-collapsed="false">
                    <view
                        v-for="block in section.blocks"
                        :key="block.key"
                        :class="block.level === 2 ? 'leaf-block' : 'sub-block'"
                    >
                        <text :class="block.level === 2 ? 'leaf-title' : 'sub-title'">{{
                            block.title
                        }}</text>

                        <view v-for="field in block.fields" :key="field.key" class="form-field">
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
                                    >{{ selectLabel(field) || field.placeholder || '请选择' }}</text
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
                                :placeholder="field.placeholder || '请选择所属行业（可多选）'"
                            />

                            <!-- 文本域 -->
                            <textarea
                                v-else-if="field.type === 'textarea'"
                                v-model="formData[field.key]"
                                class="field-textarea"
                                :placeholder="field.placeholder || defaultPlaceholder(field)"
                                placeholder-class="field-placeholder"
                            />

                            <!-- 数字输入 -->
                            <input
                                v-else-if="field.type === 'number'"
                                v-model="formData[field.key]"
                                class="field-input"
                                type="digit"
                                :placeholder="field.placeholder || defaultPlaceholder(field)"
                                placeholder-class="field-placeholder"
                            />

                            <!-- 普通文本输入 -->
                            <input
                                v-else
                                v-model="formData[field.key]"
                                class="field-input"
                                type="text"
                                :placeholder="field.placeholder || defaultPlaceholder(field)"
                                placeholder-class="field-placeholder"
                            />
                        </view>
                    </view>
                </SectionCard>
            </view>
            <view class="form-bottom-space"></view>
        </scroll-view>

        <!-- 底部操作栏（中文按钮） -->
        <view class="form-bottom-bar">
            <view class="form-btn cancel" :class="{ disabled: saving }" @tap="goBack">取消</view>
            <view class="form-btn primary" :class="{ disabled: saving }" @tap="submit">
                {{ saving ? '保存中…' : '保存' }}
            </view>
        </view>

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
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import SectionCard from '@/components/customer/SectionCard.vue'
import MultiSelectChips from '@/components/customer/MultiSelectChips.vue'
import IndustryPicker from '@/components/customer/IndustryPicker.vue'
import { useLockFn } from '@/hooks/useLockFn'
import { industrySections, type UniFieldDef, type UniSectionDef } from '@/config/industry-sections'
import {
    createIndustry,
    updateIndustry,
    getIndustryDetail,
    type BizIndustry
} from '@/api/biz/industry'

const router = useRouter()
const formData = ref<Record<string, any>>({})
const industryId = ref('')
const industryName = ref('')

/* hero 页头文案 */
const isEdit = computed(() => !!industryId.value)
const heroTitle = computed(() => (isEdit.value ? '[编辑] 行业' : '[新建] 行业'))
const heroSub = computed(() =>
    isEdit.value ? '更新行业档案与产业链信息' : '完善行业定义，沉淀行业认知'
)
const heroInitial = computed(() => {
    const name = (industryName.value || '').trim()
    return name ? name.charAt(0) : '业'
})

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

const formSections = computed<FormSection[]>(() => normalizeSections(industrySections))

const allFields = computed<UniFieldDef[]>(() =>
    formSections.value.flatMap((section) => section.blocks.flatMap((block) => block.fields))
)

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
const initFormData = () => {
    const base: Record<string, any> = {}
    for (const field of allFields.value) {
        base[field.key] =
            field.type === 'selectMultiple' || field.type === 'industryPicker' ? [] : ''
    }
    formData.value = base
}

const fillForm = async () => {
    try {
        const detail = (await getIndustryDetail(industryId.value)) || ({} as BizIndustry)
        const next: Record<string, any> = {}
        for (const field of allFields.value) {
            const raw = (detail as any)[field.key]
            next[field.key] = raw === undefined || raw === null ? '' : raw
        }
        formData.value = next
        industryName.value = detail.industryName || ''
    } catch (error) {
        console.error('加载行业资料失败', error)
        uni.showToast({ title: '加载行业资料失败', icon: 'none' })
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
        if (key === 'sort') {
            payload.sort = Number(value)
            continue
        }
        payload[key] = value
    }
    return payload
}

const doSubmit = async () => {
    const payload = buildPayload()
    try {
        if (isEdit.value) {
            await updateIndustry({ ...payload, id: industryId.value })
        } else {
            await createIndustry(payload)
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => router.navigateBack(), 600)
    } catch (error) {
        console.error('保存行业失败', error)
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

const goBack = () => {
    if (isLock.value) return
    router.navigateBack()
}

onLoad((options) => {
    initFormData()
    // 雪花 ID 超出 JS 安全整数，保留字符串（禁止 Number() 转换）
    industryId.value = String(options?.id || '')
    if (industryId.value) {
        fillForm()
    }
})
</script>

<style scoped lang="scss">
.form-page {
    min-height: 100vh;
    background: var(--color-bg-app);
}

/* ===== hero 页头（参考首页标语/欢迎语视觉标准） ===== */
.form-hero {
    position: relative;
    overflow: hidden;
    padding: 44rpx 40rpx 56rpx;
    background: var(--gradient-primary);

    /* #ifdef APP-PLUS */
    padding-top: calc(44rpx + var(--status-bar-height));
    /* #endif */

    &::before {
        content: '';
        position: absolute;
        right: -60rpx;
        top: -60rpx;
        width: 260rpx;
        height: 260rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100rpx;
        bottom: -90rpx;
        width: 220rpx;
        height: 220rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
    }
}

.deco-ring {
    position: absolute;
    top: -56rpx;
    right: 34rpx;
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(255, 255, 255, 0.16);
    pointer-events: none;
}

.deco-dot {
    position: absolute;
    right: 70rpx;
    bottom: 32rpx;
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 28rpx -18rpx 0 rgba(255, 255, 255, 0.12), -18rpx 24rpx 0 rgba(255, 255, 255, 0.12);
    pointer-events: none;
}

.form-hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.form-hero-avatar {
    width: 108rpx;
    height: 108rpx;
    border-radius: 54rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.14);
    color: var(--color-btn-text);
    font-size: 40rpx;
    font-weight: 700;
    flex-shrink: 0;
}

.form-hero-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.form-hero-title {
    font-size: 38rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.form-hero-sub {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

.form-scroll {
    max-height: calc(100vh - 320rpx);
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
    font-size: 28rpx;
    font-weight: 600;
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
    margin-bottom: 14rpx;
}

.field-label {
    font-size: 26rpx;
    color: var(--color-text-secondary);
}

.required-mark {
    font-size: 26rpx;
    color: var(--color-danger-rgb);
}

.field-input {
    display: flex;
    align-items: center;
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
    font-size: 28rpx;
    color: var(--color-text);
}

.field-textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
    font-size: 28rpx;
    line-height: 1.6;
    color: var(--color-text);
    box-sizing: border-box;
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
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
}

.field-select-hover {
    background: var(--color-surface-hover);
}

.field-select-value {
    font-size: 28rpx;
    color: var(--color-text);
}

.field-select-value.placeholder {
    color: var(--color-text-tertiary);
}

.field-select-arrow {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
}

/* ===== 底部 ===== */
.form-bottom-space {
    height: 40rpx;
}

.form-bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: flex;
    gap: 20rpx;
    padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
    background: var(--color-surface);
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.form-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
}

.form-btn.cancel {
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    border: 1rpx solid var(--color-border);
}

.form-btn.primary {
    background: var(--color-primary);
    color: var(--color-btn-text);
    box-shadow: var(--shadow-glow);
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
    border-radius: 24rpx 24rpx 0 0;
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
