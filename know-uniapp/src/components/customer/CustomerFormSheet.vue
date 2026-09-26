<template>
    <uni-popup ref="popup" type="bottom" @change="onPopupChange">
        <view class="sheet-panel">
            <!-- 拖拽把手 -->
            <view class="sheet-handle"></view>

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
                    <view class="form-hero-close" @tap="close">
                        <text class="form-hero-close-text">×</text>
                    </view>
                </view>
            </view>

            <!-- 表单区（内部滚动） -->
            <scroll-view scroll-y class="sheet-scroll">
                <view class="sheet-body">
                    <!-- 区段（配置驱动） -->
                    <view v-for="section in customerSections" :key="section.title">
                        <SectionCard :title="section.title" :collapsible="true" :default-collapsed="false">
                            <view v-for="sub in section.subSections" v-if="section.subSections && section.subSections.length" :key="sub.title" class="sub-block">
                                <text class="sub-title">{{ sub.title }}</text>

                                <!-- 叶子区段（fields） -->
                                <template v-if="sub.fields && sub.fields.length">
                                    <view
                                        v-for="field in sub.fields"
                                        :key="field.key"
                                        class="form-field"
                                    >
                                        <view class="field-label-row">
                                            <text class="field-label">{{ field.label }}</text>
                                            <text v-if="isRequired(field)" class="required-mark">*</text>
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
                                            >{{ selectLabel(field) || field.placeholder || '请选择' }}</text>
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
                                            type="number"
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
                                </template>

                                <!-- 更深层级（基础认识/详细认识 → 三级叶子） -->
                                <template v-else-if="sub.subSections && sub.subSections.length">
                                    <view
                                        v-for="leaf in sub.subSections"
                                        :key="leaf.title"
                                        class="leaf-block"
                                    >
                                        <text class="leaf-title">{{ leaf.title }}</text>
                                        <view
                                            v-for="field in leaf.fields"
                                            :key="field.key"
                                            class="form-field"
                                        >
                                            <view class="field-label-row">
                                                <text class="field-label">{{ field.label }}</text>
                                                <text v-if="isRequired(field)" class="required-mark">*</text>
                                            </view>

                                            <view
                                                v-if="field.type === 'select'"
                                                class="field-select"
                                                hover-class="field-select-hover"
                                                @tap="openSelect(field)"
                                            >
                                                <text
                                                    class="field-select-value"
                                                    :class="{ placeholder: !selectLabel(field) }"
                                                >{{ selectLabel(field) || field.placeholder || '请选择' }}</text>
                                                <text class="field-select-arrow">›</text>
                                            </view>
                                            <MultiSelectChips
                                                v-else-if="field.type === 'selectMultiple'"
                                                v-model="formData[field.key]"
                                                :options="field.options || []"
                                                :placeholder="field.placeholder || '请选择（可多选）'"
                                            />
                                            <IndustryPicker
                                                v-else-if="field.type === 'industryPicker'"
                                                v-model="formData[field.key]"
                                                :placeholder="field.placeholder || '请选择所属行业（可多选）'"
                                            />
                                            <textarea
                                                v-else-if="field.type === 'textarea'"
                                                v-model="formData[field.key]"
                                                class="field-textarea"
                                                :placeholder="field.placeholder || defaultPlaceholder(field)"
                                                placeholder-class="field-placeholder"
                                            />
                                            <input
                                                v-else-if="field.type === 'number'"
                                                v-model="formData[field.key]"
                                                class="field-input"
                                                type="number"
                                                :placeholder="field.placeholder || defaultPlaceholder(field)"
                                                placeholder-class="field-placeholder"
                                            />
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
                                </template>
                            </view>
                        </SectionCard>
                    </view>
                </view>
            </scroll-view>

            <!-- 底部操作栏（中文按钮） -->
            <view class="form-bottom-bar">
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
                    <text v-if="String(selectValue) === String(opt.value)" class="select-option-check">✓</text>
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
import {
    customerSections,
    collectFields,
    type UniFieldDef
} from '@/config/customer-sections'
import { createCustomer, updateCustomer, setCustomerIndustries, getCustomerDetail } from '@/api/customer'

const props = withDefaults(
    defineProps<{
        show: boolean
        mode?: 'create' | 'edit'
        customerId?: number | string
    }>(),
    { mode: 'create', customerId: '' }
)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved'): void
}>()

const popup = ref<any>(null)
const formData = ref<Record<string, any>>({})
const saving = ref(false)
const customerName = ref('')

const isEdit = computed(() => props.mode === 'edit')

/* hero 页头文案（参考首页欢迎语标语） */
const heroTitle = computed(() => (isEdit.value ? '编辑客户资料' : '新增客户'))
const heroSub = computed(() =>
    isEdit.value ? '更新客户档案，让跟进更有据可循' : '完善客户档案，建立长期联系'
)
const heroInitial = computed(() => {
    if (isEdit.value) {
        const n = (customerName.value || '').trim()
        if (n) return n.charAt(0).toUpperCase()
    }
    return '新'
})

const allFields = computed<UniFieldDef[]>(() => collectFields(customerSections))
const multiFields = computed<Set<string>>(
    () => new Set(allFields.value.filter((f) => f.type === 'selectMultiple').map((f) => f.key))
)

const isRequired = (field: UniFieldDef) => field.key === 'name'

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

/* ---------- 弹层开关 ---------- */
watch(
    () => props.show,
    (val) => {
        if (val) {
            popup.value?.open()
        } else {
            popup.value?.close()
        }
    },
    { immediate: false }
)

const onPopupChange = (e: { show: boolean }) => {
    if (e.show) {
        // 打开：清空 + 编辑回填
        resetForm()
        if (isEdit.value && props.customerId) {
            fillForm()
        }
    } else {
        emit('close')
    }
}

const resetForm = () => {
    const base: Record<string, any> = {}
    for (const f of allFields.value) {
        base[f.key] = f.type === 'selectMultiple' || f.type === 'industryPicker' ? [] : ''
    }
    base.industryIds = []
    formData.value = base
    customerName.value = ''
    saving.value = false
}

/* ---------- 编辑回填 ---------- */
const flattenTo = (prefix: string, obj: Record<string, any>, out: Record<string, any>) => {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            flattenTo(key, v, out)
        } else {
            out[key] = v
        }
    }
}

const fillForm = async () => {
    try {
        const detail = await getCustomerDetail(props.customerId)
        const flat: Record<string, any> = {}
        flattenTo('', detail || {}, flat)
        // 行业关联 → industryIds
        flat.industryIds = (detail?.industries || []).map((i) => i.industryId)
        // selectMultiple 字符串 → 数组
        for (const key of multiFields.value) {
            const v = flat[key]
            if (typeof v === 'string' && v) {
                flat[key] = v.split(/[,，]/).filter(Boolean)
            } else if (v === undefined || v === null) {
                flat[key] = []
            }
        }
        if (flat.industryIds === undefined) flat.industryIds = []
        formData.value = flat
        customerName.value = detail?.name || ''
    } catch (error) {
        console.error('加载客户资料失败', error)
        uni.showToast({ title: '加载客户资料失败', icon: 'none' })
    }
}

/* ---------- 提交 ---------- */
const isEmptyValue = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

const setByPath = (obj: Record<string, any>, path: string, value: any) => {
    const keys = path.split('.')
    let cur = obj
    for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] || {}
        cur = cur[keys[i]]
    }
    cur[keys[keys.length - 1]] = value
}

const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {}
    const industryIds: number[] = []
    for (const [key, value] of Object.entries(formData.value)) {
        if (isEmptyValue(value)) continue
        if (key === 'industryIds') {
            industryIds.push(...(value as number[]))
            continue
        }
        if (multiFields.value.has(key) && Array.isArray(value)) {
            setByPath(payload, key, value.join(','))
        } else {
            setByPath(payload, key, value)
        }
    }
    if (industryIds.length) payload.industryIds = industryIds
    return payload
}

const submit = async () => {
    if (saving.value) return
    const name = String(formData.value.name || '').trim()
    if (!name) {
        uni.showToast({ title: '请填写客户姓名', icon: 'none' })
        return
    }

    const payload = buildPayload()
    saving.value = true
    try {
        let id = props.customerId
        if (isEdit.value && id) {
            await updateCustomer({ ...payload, id })
            uni.showToast({ title: '保存成功', icon: 'success' })
        } else {
            // 雪花 ID 保持字符串（Number() 会精度丢失）
            id = String(newId)
            uni.showToast({ title: '创建成功', icon: 'success' })
        }
        // 行业关系：create 时后端已落库；edit 时全量覆盖（幂等：删旧插新）
        if (isEdit.value && id && Array.isArray(payload.industryIds) && payload.industryIds.length) {
            await setCustomerIndustries(
                id,
                payload.industryIds.map((industryId: number, index: number) => ({
                    industryId,
                    isMain: index === 0 ? 1 : undefined
                }))
            )
        }
        setTimeout(() => {
            popup.value?.close()
            emit('saved')
        }, 500)
    } catch (error) {
        console.error('保存客户失败', error)
        uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
        saving.value = false
    }
}

const close = () => {
    if (saving.value) return
    popup.value?.close()
}
</script>

<style scoped lang="scss">
.sheet-panel {
    width: 100%;
    background: var(--color-bg-app);
    border-radius: 24rpx 24rpx 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sheet-handle {
    width: 72rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--color-border);
    margin: 16rpx auto 0;
    flex-shrink: 0;
}

/* ===== hero 页头（参考首页标语/欢迎语视觉标准） ===== */
.form-hero {
    position: relative;
    overflow: hidden;
    padding: 24rpx 40rpx 36rpx;
    background: var(--gradient-primary);
    flex-shrink: 0;

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
    width: 96rpx;
    height: 96rpx;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.14);
    color: var(--color-btn-text);
    font-size: 36rpx;
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
    font-size: 36rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.form-hero-sub {
    margin-top: 8rpx;
    font-size: 22rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

.form-hero-close {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.16);
    flex-shrink: 0;
}

.form-hero-close:active {
    transform: scale(0.92);
}

.form-hero-close-text {
    font-size: 44rpx;
    line-height: 1;
    color: var(--color-btn-text);
}

/* ===== 滚动区 ===== */
.sheet-scroll {
    max-height: 62vh;
    min-height: 200rpx;
}

.sheet-body {
    padding: 8rpx 32rpx 24rpx;
}

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
    min-height: 140rpx;
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
.form-bottom-bar {
    flex-shrink: 0;
    display: flex;
    gap: 20rpx;
    padding: 16rpx 40rpx calc(16rpx + env(safe-area-inset-bottom));
    background: var(--color-surface);
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.form-btn {
    flex: 1;
    height: 84rpx;
    border-radius: 42rpx;
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

.form-btn.primary.disabled {
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