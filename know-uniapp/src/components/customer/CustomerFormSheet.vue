<template>
    <uni-popup ref="popup" type="bottom" @change="onPopupChange">
        <view class="sheet-panel">
            <!-- 拖拽把手 -->
            <view class="sheet-handle"></view>

            <!-- 标题行（小记风格：居中标题 + 右上角关闭） -->
            <view class="sheet-title-row">
                <text class="sheet-title">{{ heroTitle }}</text>
                <view class="sheet-title-actions">
                    <view class="sheet-close" @tap="close">×</view>
                </view>
            </view>

            <!-- 表单区（内部滚动） -->
            <scroll-view scroll-y class="sheet-scroll">
                <view class="sheet-body">
                    <!-- 区段（配置驱动） -->
                    <view v-for="section in customerSections" :key="section.title">
                        <SectionCard
                            :title="section.title"
                            :collapsible="true"
                            :default-collapsed="false"
                        >
                            <template v-for="sub in section.subSections || []" :key="sub.title">
                                <view class="sub-block">
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
                                                <text v-if="isRequired(field)" class="required-mark"
                                                    >*</text
                                                >
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
                                                        selectLabel(field) ||
                                                        field.placeholder ||
                                                        '请选择'
                                                    }}</text
                                                >
                                                <text class="field-select-arrow">›</text>
                                            </view>

                                            <!-- 多选 chips -->
                                            <MultiSelectChips
                                                v-else-if="field.type === 'selectMultiple'"
                                                v-model="formData[field.key]"
                                                :options="field.options || []"
                                                :placeholder="
                                                    field.placeholder || '请选择（可多选）'
                                                "
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
                                                type="number"
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
                                                    <text class="field-label">{{
                                                        field.label
                                                    }}</text>
                                                    <text
                                                        v-if="isRequired(field)"
                                                        class="required-mark"
                                                        >*</text
                                                    >
                                                </view>

                                                <view
                                                    v-if="field.type === 'select'"
                                                    class="field-select"
                                                    hover-class="field-select-hover"
                                                    @tap="openSelect(field)"
                                                >
                                                    <text
                                                        class="field-select-value"
                                                        :class="{
                                                            placeholder: !selectLabel(field)
                                                        }"
                                                        >{{
                                                            selectLabel(field) ||
                                                            field.placeholder ||
                                                            '请选择'
                                                        }}</text
                                                    >
                                                    <text class="field-select-arrow">›</text>
                                                </view>
                                                <MultiSelectChips
                                                    v-else-if="field.type === 'selectMultiple'"
                                                    v-model="formData[field.key]"
                                                    :options="field.options || []"
                                                    :placeholder="
                                                        field.placeholder || '请选择（可多选）'
                                                    "
                                                />
                                                <IndustryPicker
                                                    v-else-if="field.type === 'industryPicker'"
                                                    v-model="formData[field.key]"
                                                    :placeholder="
                                                        field.placeholder ||
                                                        '请选择所属行业（可多选）'
                                                    "
                                                />
                                                <textarea
                                                    v-else-if="field.type === 'textarea'"
                                                    v-model="formData[field.key]"
                                                    class="field-textarea"
                                                    :placeholder="
                                                        field.placeholder ||
                                                        defaultPlaceholder(field)
                                                    "
                                                    placeholder-class="field-placeholder"
                                                />
                                                <input
                                                    v-else-if="field.type === 'number'"
                                                    v-model="formData[field.key]"
                                                    class="field-input"
                                                    type="number"
                                                    :placeholder="
                                                        field.placeholder ||
                                                        defaultPlaceholder(field)
                                                    "
                                                    placeholder-class="field-placeholder"
                                                />
                                                <input
                                                    v-else
                                                    v-model="formData[field.key]"
                                                    class="field-input"
                                                    type="text"
                                                    :placeholder="
                                                        field.placeholder ||
                                                        defaultPlaceholder(field)
                                                    "
                                                    placeholder-class="field-placeholder"
                                                />
                                            </view>
                                        </view>
                                    </template>
                                </view>
                            </template>
                        </SectionCard>
                    </view>
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
import { customerSections, collectFields, type UniFieldDef } from '@/config/customer-sections'
import {
    createCustomer,
    updateCustomer,
    setCustomerIndustries,
    getCustomerDetail
} from '@/api/customer'

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

const isEdit = computed(() => props.mode === 'edit')

/* hero 页头文案 */
const heroTitle = computed(() => (isEdit.value ? '编辑客户资料' : '新增客户'))

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
    } catch (error) {
        console.error('加载客户资料失败', error)
        uni.showToast({ title: '加载客户资料失败', icon: 'none' })
    }
}

/* ---------- 提交 ---------- */
const isEmptyValue = (v: any) =>
    v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

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
            const created = await createCustomer(payload)
            id = String(created)
            uni.showToast({ title: '创建成功', icon: 'success' })
        }
        // 行业关系：create 时后端已落库；edit 时全量覆盖（幂等：删旧插新）
        if (
            isEdit.value &&
            id &&
            Array.isArray(payload.industryIds) &&
            payload.industryIds.length
        ) {
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

/* ===== 标题行（小记风格：居中标题 + 右上角关闭） ===== */
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

/* ===== 滚动区 ===== */
.sheet-scroll {
    max-height: 68vh;
    min-height: 200rpx;
}

.sheet-body {
    padding: 0 32rpx;
}

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
.sheet-bottom-bar {
    flex-shrink: 0;
    display: flex;
    gap: 20rpx;
    padding: 20rpx 0 calc(24rpx + env(safe-area-inset-bottom));
    background: transparent;
}

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
