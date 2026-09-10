<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">{{ isEdit ? '编辑习惯模板' : '新建习惯模板' }}</text>
            </view>
        </view>

        <scroll-view scroll-y class="page-scroll">
            <view v-if="loading" class="loading-state">
                <text class="loading-text">加载中...</text>
            </view>

            <template v-else>
                <view class="form-card-schedule">
                    <text class="form-card-header">基本设置</text>
                    <view class="fgs-full">
                        <text class="fg-label">🎯 图标</text>
                        <view class="icon-preview-row" @tap="iconPickerVisible = !iconPickerVisible">
                            <view class="ip-badge" :style="{ background: form.color }">{{ form.icon }}</view>
                            <text class="ip-name">{{ form.icon }} {{ form.name || '未命名' }}</text>
                            <text class="ip-arrow">{{ iconPickerVisible ? '⌃' : '›' }}</text>
                        </view>
                        <view v-if="iconPickerVisible" class="icon-grid">
                            <view
                                v-for="theme in habitThemes"
                                :key="theme.key"
                                class="icon-chip"
                                :class="{ active: form.themeKey === theme.key }"
                                @tap.stop="selectTheme(theme)"
                            >
                                <view class="icon-chip-badge" :style="{ background: theme.color }">{{ theme.icon }}</view>
                                <text class="icon-chip-name">{{ theme.label }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📝 习惯名称 <text class="required">*</text></text>
                        <view class="fg-input-wrap">
                            <input v-model="form.name" class="fg-input" maxlength="20" placeholder="如：每日跑步" placeholder-class="field-placeholder" />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📄 描述</text>
                        <view class="fg-input-wrap">
                            <textarea v-model="form.description" class="fg-textarea" maxlength="200" placeholder="可选描述" placeholder-class="field-placeholder" />
                        </view>
                    </view>
                </view>

                <view class="form-card-schedule">
                    <text class="form-card-header">频率与目标</text>
                    <view class="fgs-row">
                        <view class="fgs-cell">
                            <text class="fg-label">频率类型</text>
                            <picker :value="freqIndex" :range="freqOptions" @change="onFreqChange">
                                <view class="fg-select">{{ freqOptions[freqIndex] }}</view>
                            </picker>
                        </view>
                        <view class="fgs-cell">
                            <text class="fg-label">目标天数</text>
                            <view class="fg-input-wrap">
                                <input v-model="form.targetDays" class="fg-input" type="number" placeholder="30" placeholder-class="field-placeholder" />
                                <view class="focus-bar"></view>
                            </view>
                        </view>
                    </view>
                    <view class="fgs-row">
                        <view class="fgs-cell">
                            <text class="fg-label">目标数值</text>
                            <view class="fg-input-wrap">
                                <input v-model="form.targetValue" class="fg-input" type="number" placeholder="1" placeholder-class="field-placeholder" />
                                <view class="focus-bar"></view>
                            </view>
                        </view>
                        <view class="fgs-cell">
                            <text class="fg-label">单位</text>
                            <view class="fg-input-wrap">
                                <input v-model="form.targetUnit" class="fg-input" placeholder="次" placeholder-class="field-placeholder" />
                                <view class="focus-bar"></view>
                            </view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">追踪类型</text>
                        <view class="track-type-row">
                            <view class="track-type-opt" :class="{ active: form.trackingType === 'boolean' }" @tap="form.trackingType = 'boolean'">✅ 打卡/未打卡</view>
                            <view class="track-type-opt" :class="{ active: form.trackingType === 'numeric' }" @tap="form.trackingType = 'numeric'">🔢 记录数值</view>
                        </view>
                    </view>
                </view>

                <view class="form-card-schedule">
                    <text class="form-card-header">颜色与提醒</text>
                    <view class="fgs-full">
                        <text class="fg-label">🎨 颜色</text>
                        <view class="color-strip">
                            <view
                                v-for="c in colorOptions"
                                :key="c"
                                class="color-opt"
                                :class="{ active: form.color === c }"
                                :style="{ background: c }"
                                @tap="form.color = c"
                            ></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">⏰ 提醒时间</text>
                        <picker mode="time" :value="form.reminderTime" @change="form.reminderTime = $event.detail.value">
                            <view class="fg-select">{{ form.reminderTime || '不提醒' }}</view>
                        </picker>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📅 休息日</text>
                        <view class="rest-days-strip">
                            <view
                                v-for="(day, idx) in weekDays"
                                :key="idx"
                                class="rd-btn"
                                :class="{ active: form.restDays.includes(idx) }"
                                @tap="toggleRestDay(idx)"
                            >{{ day }}</view>
                        </view>
                    </view>
                </view>

                <view class="form-card-schedule">
                    <text class="form-card-header">其他设置</text>
                    <view class="fgs-full">
                        <text class="fg-label">适用计划类型</text>
                        <picker :value="planTypeIndex" :range="planTypeOptions" @change="planTypeIndex = $event.detail.value">
                            <view class="fg-select">{{ planTypeOptions[planTypeIndex] }}</view>
                        </picker>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">标签</text>
                        <view class="fg-input-wrap">
                            <input v-model="form.tags" class="fg-input" placeholder="逗号分隔，如：健康,运动" placeholder-class="field-placeholder" />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">可见性</text>
                        <picker :value="visibilityIndex" :range="visibilityOptions" @change="visibilityIndex = $event.detail.value">
                            <view class="fg-select">{{ visibilityOptions[visibilityIndex] }}</view>
                        </picker>
                    </view>
                </view>

                <view style="height: 200rpx"></view>
            </template>
        </scroll-view>

        <view class="action-bar">
            <view class="action-btn action-cancel" @tap="goBack">取消</view>
            <view class="action-btn action-primary" :class="{ disabled: submitting }" @tap="handleSave">
                <text>{{ submitting ? '保存中...' : '💾 保存' }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getHabitTemplateDetail, createHabitTemplate, updateHabitTemplate } from '@/api/plan/habit-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.action-btn,.back-btn,.icon-chip,.color-opt,.track-type-opt,.rd-btn')

const loading = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const templateId = ref('')
const iconPickerVisible = ref(false)

const habitThemes = [
    { key: 'run', icon: '🏃', label: '跑步', color: '#6366f1' },
    { key: 'read', icon: '📖', label: '阅读', color: '#22b573' },
    { key: 'meditate', icon: '🧘', label: '冥想', color: '#a855f7' },
    { key: 'water', icon: '💧', label: '喝水', color: '#06b6d4' },
    { key: 'sleep', icon: '😴', label: '早睡', color: '#6366f1' },
    { key: 'workout', icon: '💪', label: '健身', color: '#f97316' },
    { key: 'music', icon: '🎵', label: '音乐', color: '#ec4899' },
    { key: 'code', icon: '💻', label: '编程', color: '#0ea5e9' },
    { key: 'garden', icon: '🌱', label: '种植', color: '#22b573' },
    { key: 'cook', icon: '🍳', label: '烹饪', color: '#f59e0b' },
    { key: 'study', icon: '📚', label: '学习', color: '#8b5cf6' },
    { key: 'art', icon: '🎨', label: '绘画', color: '#ec4899' }
]

const colorOptions = ['#6366f1', '#22b573', '#f97316', '#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']
const freqOptions = ['每天', '每周', '每月', '自定义']
const freqMap = ['daily', 'weekly', 'monthly', 'custom']
const planTypeOptions = ['全部', '习惯', '日程', '综合']
const visibilityOptions = ['私有', '公开']
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const freqIndex = ref(0)
const planTypeIndex = ref(0)
const visibilityIndex = ref(0)

const form = ref({
    name: '',
    icon: '🎯',
    color: '#6366f1',
    themeKey: '',
    description: '',
    frequencyType: 'daily',
    frequencyRule: '',
    targetDays: '',
    targetValue: '',
    targetUnit: '次',
    trackingType: 'boolean',
    reminderTime: '',
    restDays: [],
    tags: '',
    planType: '',
    visibility: 0
})

const selectTheme = (theme) => {
    form.value.icon = theme.icon
    form.value.color = theme.color
    form.value.themeKey = theme.key
    iconPickerVisible.value = false
}

const onFreqChange = (e) => {
    freqIndex.value = e.detail.value
    form.value.frequencyType = freqMap[e.detail.value]
}

const toggleRestDay = (idx) => {
    const i = form.value.restDays.indexOf(idx)
    if (i >= 0) form.value.restDays.splice(i, 1)
    else form.value.restDays.push(idx)
}

const buildPayload = () => ({
    id: isEdit.value ? templateId.value : undefined,
    name: form.value.name.trim(),
    icon: form.value.icon,
    color: form.value.color,
    description: form.value.description.trim(),
    frequencyType: form.value.frequencyType,
    frequencyRule: form.value.frequencyRule || undefined,
    targetDays: form.value.targetDays ? Number(form.value.targetDays) : undefined,
    targetValue: form.value.targetValue ? Number(form.value.targetValue) : undefined,
    targetUnit: form.value.targetUnit || undefined,
    trackingType: form.value.trackingType,
    reminderTime: form.value.reminderTime || undefined,
    restDays: form.value.restDays.length ? JSON.stringify(form.value.restDays) : undefined,
    tags: form.value.tags || undefined,
    planType: planTypeOptions[planTypeIndex.value] !== '全部' ? planTypeOptions[planTypeIndex.value] : undefined,
    visibility: visibilityIndex.value === 1 ? 1 : 0
})

const handleSave = async () => {
    if (submitting.value) return
    if (!form.value.name.trim()) {
        uni.showToast({ title: '请输入习惯名称', icon: 'none' })
        return
    }
    submitting.value = true
    try {
        const payload = buildPayload()
        if (isEdit.value) {
            await updateHabitTemplate(payload)
        } else {
            await createHabitTemplate(payload)
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1000)
    } catch (e) {
        console.error('保存失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
        submitting.value = false
    }
}

const fetchDetail = async (id) => {
    loading.value = true
    try {
        const res = await getHabitTemplateDetail(id)
        if (res) {
            form.value.name = res.name || ''
            form.value.icon = res.icon || '🎯'
            form.value.color = res.color || '#6366f1'
            form.value.description = res.description || ''
            form.value.frequencyType = res.frequencyType || 'daily'
            freqIndex.value = freqMap.indexOf(form.value.frequencyType)
            if (freqIndex.value < 0) freqIndex.value = 0
            form.value.targetDays = res.targetDays || ''
            form.value.targetValue = res.targetValue || ''
            form.value.targetUnit = res.targetUnit || '次'
            form.value.trackingType = res.trackingType || 'boolean'
            form.value.reminderTime = res.reminderTime || ''
            try { form.value.restDays = JSON.parse(res.restDays || '[]') } catch { form.value.restDays = [] }
            form.value.tags = res.tags || ''
            form.value.visibility = res.visibility || 0
            visibilityIndex.value = form.value.visibility === 1 ? 1 : 0
        }
    } catch (e) {
        console.error('加载详情失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
        loading.value = false
    }
}

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) { uni.navigateBack() }
    else { uni.switchTab({ url: '/pages/knowledge/home/index' }) }
}

onLoad((options) => {
    templateId.value = options.id || ''
    isEdit.value = !!templateId.value
    if (isEdit.value) {
        fetchDetail(templateId.value)
    }
})
</script>

<style scoped>
.plan-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-app);
    overflow: hidden;
}
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(24rpx + var(--status-bar-height)) 40rpx 16rpx;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
}
.back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    margin-left: -16rpx;
}
.back-btn:active {
    background: var(--color-surface-soft);
}
.back-btn .back-icon {
    font-size: 44rpx;
    line-height: 1;
    color: var(--color-text);
}
.page-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text);
}

.page-scroll {
    flex: 1;
    min-height: 0;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 120rpx 0;
}
.loading-text {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.form-card-schedule {
    margin: 16rpx 32rpx;
    padding: 22rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.05);
    animation: cardSlideIn 0.4s ease both;
}
.form-card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 18rpx;
    font-size: 29rpx;
    font-weight: 800;
    color: var(--color-primary);
}
.form-card-header::after {
    content: '';
    flex: 1;
    height: 2rpx;
    background: var(--color-border-light);
}

.fgs-full { margin-top: 18rpx; }
.fgs-full:first-of-type { margin-top: 0; }
.fgs-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18rpx;
    margin-top: 18rpx;
}
.fgs-cell { min-width: 0; }
.fg-label {
    display: block;
    margin-bottom: 10rpx;
    font-size: 24rpx;
    font-weight: 700;
    color: var(--color-text);
}
.required { color: var(--color-danger); }

.fg-input-wrap { position: relative; }
.fg-input,
.fg-select,
.fg-textarea {
    width: 100%;
    box-sizing: border-box;
    border-radius: 18rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface);
    transition: border-color 0.22s, box-shadow 0.22s;
}
.fg-input:focus,
.fg-select:focus,
.fg-textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4rpx rgba(var(--color-primary-rgb), 0.12);
}
.fg-input,
.fg-select {
    height: 82rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    color: var(--color-text);
}
.fg-select {
    display: flex;
    align-items: center;
    font-weight: 700;
}
.fg-textarea {
    min-height: 128rpx;
    padding: 18rpx 20rpx;
    font-size: 26rpx;
    line-height: 1.55;
    color: var(--color-text);
}
.focus-bar {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4rpx;
    border-radius: 2rpx;
    background: var(--color-primary);
    opacity: 0;
    transition: opacity 0.22s ease;
    pointer-events: none;
}
.fg-input-wrap:focus-within .focus-bar { opacity: 1; }
.field-placeholder { color: var(--color-text-tertiary); }

.icon-preview-row {
    min-height: 88rpx;
    padding: 0 20rpx;
    border-radius: 18rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface);
    display: flex;
    align-items: center;
    gap: 16rpx;
}
.icon-preview-row:active { transform: scale(0.98); }
.ip-badge {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 30rpx;
}
.ip-name {
    flex: 1;
    font-size: 26rpx;
    font-weight: 700;
    color: var(--color-text);
}
.ip-arrow {
    font-size: 34rpx;
    color: var(--color-text-tertiary);
}

.icon-grid {
    margin-top: 14rpx;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12rpx;
}
.icon-chip {
    min-height: 94rpx;
    padding: 12rpx 8rpx;
    border-radius: 18rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    transition: border-color 0.2s, background 0.2s;
}
.icon-chip.active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
}
.icon-chip:active { transform: scale(0.96); }
.icon-chip-badge {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 30rpx;
}
.icon-chip-name {
    font-size: 21rpx;
    font-weight: 700;
    color: var(--color-text-secondary);
}

.color-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 14rpx;
}
.color-opt {
    width: 50rpx;
    height: 50rpx;
    border-radius: 999rpx;
    border: 4rpx solid #fff;
    box-shadow: 0 0 0 2rpx rgba(15, 23, 42, 0.08);
    transition: transform 0.22s, box-shadow 0.22s;
    cursor: pointer;
}
.color-opt.active {
    box-shadow: 0 0 0 5rpx var(--color-primary-soft);
    transform: scale(1.08);
}
.color-opt:active { transform: scale(0.9); }

.track-type-row {
    display: flex;
    gap: 14rpx;
}
.track-type-opt {
    flex: 1;
    min-height: 72rpx;
    border-radius: 16rpx;
    border: 3rpx solid var(--color-border-light);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 24rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}
.track-type-opt.active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);
}
.track-type-opt:active { transform: scale(0.96); }

.rest-days-strip {
    display: flex;
    gap: 6rpx;
    flex-wrap: wrap;
}
.rd-btn {
    width: 42rpx;
    height: 42rpx;
    border-radius: 12rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface-soft, #f8fafc);
    color: var(--color-text-secondary);
    font-size: 20rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}
.rd-btn.active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);
}
.rd-btn:active { transform: scale(0.9); }

.action-bar {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    display: flex;
    gap: 16rpx;
    padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
    background: var(--color-bg-app);
    border-top: 1rpx solid var(--color-border-light);
    box-shadow: 0 -4rpx 20rpx rgba(15, 23, 42, 0.06);
}
.action-btn {
    flex: 1;
    height: 92rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 700;
    transition: transform 0.25s ease;
}
.action-btn:active { transform: scale(0.97); }
.action-btn.disabled { opacity: 0.6; pointer-events: none; }
.action-cancel {
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 2rpx solid var(--color-border-light);
}
.action-primary {
    color: #fff;
    background: var(--gradient-primary);
    box-shadow: var(--shadow-glow);
}

@keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
