<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">使用模板</text>
            </view>
        </view>

        <scroll-view scroll-y class="page-scroll">
            <view v-if="loading" class="loading-state">
                <text class="loading-text">加载中...</text>
            </view>

            <template v-else-if="detail">
                <!-- 模板预览 -->
                <view class="hero-card" :style="{ borderTopColor: detail.color || '#6366f1' }">
                    <view class="hero-top">
                        <view class="hero-icon" :style="{ background: `linear-gradient(135deg, ${detail.color || '#6366f1'}, ${(detail.color || '#6366f1')}88)` }">
                            {{ detail.icon || '📋' }}
                        </view>
                        <view class="hero-info">
                            <text class="hero-name">{{ detail.name }}</text>
                            <text class="hero-desc">{{ detail.description || '' }}</text>
                        </view>
                    </view>
                </view>

                <!-- 基本设置 -->
                <view class="form-card-schedule">
                    <text class="form-card-header">基本设置</text>
                    <view class="fgs-full">
                        <text class="fg-label">📝 计划名称 <text class="required">*</text></text>
                        <view class="fg-input-wrap">
                            <input
                                v-model="form.planName"
                                class="fg-input"
                                maxlength="30"
                                placeholder="输入计划名称"
                                placeholder-class="field-placeholder"
                            />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📅 开始日期 <text class="required">*</text></text>
                        <picker mode="date" :value="form.startDate" @change="onDateChange">
                            <view class="fg-select">{{ form.startDate || '选择日期' }}</view>
                        </picker>
                    </view>
                    <view class="fgs-full">
                        <view class="switch-row">
                            <text class="switch-label">执行状态</text>
                            <view class="slider-toggle on">
                                <view class="knob"></view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 模板树选择 -->
                <view v-if="subPlans.length" class="form-card-schedule">
                    <text class="form-card-header">子计划（{{ checkedSubCount }}/{{ subPlans.length }}）</text>
                    <view v-for="(plan, idx) in subPlans" :key="idx" class="tree-check-row">
                        <view class="tpl-check" @tap="toggleSubPlan(idx)">
                            <text :class="['check-icon', { checked: subPlanChecked[idx] }]">{{ subPlanChecked[idx] ? '☑' : '☐' }}</text>
                        </view>
                        <view class="tree-check-info">
                            <text class="tree-check-name">{{ plan.plan_name || plan.planName || '子计划' }}</text>
                            <text class="tree-check-sub" v-if="plan.duration_days || plan.durationDays">{{ plan.duration_days || plan.durationDays }}天</text>
                        </view>
                    </view>
                </view>

                <!-- 习惯预览 -->
                <view v-if="rootHabits.length" class="form-card-schedule">
                    <text class="form-card-header">包含习惯（{{ rootHabits.length }}个）</text>
                    <view class="item-list">
                        <TemplateHabitItem
                            v-for="h in rootHabits"
                            :key="h.id || h.habitId"
                            :id="h.id || h.habitId"
                            :name="h.name || h.habitName"
                            :icon="h.icon"
                            :color="h.color"
                            :show-check="true"
                            :checked="habitChecked[h.id || h.habitId] !== false"
                            @update:checked="(v) => onHabitCheckChange(h.id || h.habitId, v)"
                        />
                    </view>
                </view>

                <!-- 日程预览 -->
                <view v-if="rootEvents.length" class="form-card-schedule">
                    <text class="form-card-header">包含日程（{{ rootEvents.length }}个）</text>
                    <view class="item-list">
                        <TemplateEventItem
                            v-for="e in rootEvents"
                            :key="e.id || e.eventId"
                            :id="e.id || e.eventId"
                            :name="e.name || e.eventTitle || e.title"
                            :show-check="true"
                            :checked="eventChecked[e.id || e.eventId] !== false"
                            @update:checked="(v) => onEventCheckChange(e.id || e.eventId, v)"
                        />
                    </view>
                </view>

                <view style="height: 200rpx"></view>
            </template>
        </scroll-view>

        <!-- Bottom Action Bar -->
        <view class="action-bar">
            <view class="action-btn action-cancel" @tap="goBack">取消</view>
            <view class="action-btn action-primary" :class="{ disabled: submitting }" @tap="handleSubmit">
                <text>{{ submitting ? '创建中...' : '🚀 确认创建' }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TemplateHabitItem from './components/TemplateHabitItem.vue'
import TemplateEventItem from './components/TemplateEventItem.vue'
import { getTemplateDetail, useTemplate } from '@/api/plan/template'
import { getHabitTemplateDetail } from '@/api/plan/habit-template'
import { getEventTemplateDetail } from '@/api/plan/event-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.action-btn,.back-btn,.tree-check-row')

const loading = ref(true)
const submitting = ref(false)
const detail = ref(null)
const templateId = ref('')
const subPlans = ref([])
const rootHabits = ref([])
const rootEvents = ref([])
const subPlanChecked = ref([])
const habitChecked = ref({})
const eventChecked = ref({})

const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const form = ref({
    planName: '',
    startDate: today,
    execStatus: 1
})

const checkedSubCount = computed(() => subPlanChecked.value.filter(Boolean).length)

const safeJsonParse = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
        try { return JSON.parse(val) } catch { return [] }
    }
    return []
}

const onDateChange = (e) => {
    form.value.startDate = e.detail.value
}

const toggleSubPlan = (idx) => {
    subPlanChecked.value[idx] = !subPlanChecked.value[idx]
}

const onHabitCheckChange = (id, val) => {
    habitChecked.value[id] = val
    if (!val) {
        uni.showToast({ title: '如需选择部分习惯/日程，请在计划内使用模板', icon: 'none', duration: 2500 })
    }
}

const onEventCheckChange = (id, val) => {
    eventChecked.value[id] = val
    if (!val) {
        uni.showToast({ title: '如需选择部分习惯/日程，请在计划内使用模板', icon: 'none', duration: 2500 })
    }
}

const fetchDetail = async (id) => {
    loading.value = true
    try {
        const res = await getTemplateDetail(id)
        detail.value = res || {}
        form.value.planName = res.name || ''
        subPlans.value = safeJsonParse(res.defaultSubPlans || res.subPlans)
        subPlanChecked.value = subPlans.value.map(() => true)

        const rawHabits = safeJsonParse(res.defaultHabitIds)
        const inlineHabits = safeJsonParse(res.defaultHabits)
        rootHabits.value = inlineHabits.length ? inlineHabits : rawHabits.map(hid => ({ id: hid }))

        const rawEvents = safeJsonParse(res.defaultEventIds)
        rootEvents.value = rawEvents.map(eid => ({ id: eid }))

        // Fetch names
        const habitIds = rawHabits.filter(id => typeof id !== 'object')
        if (habitIds.length) {
            const results = await Promise.allSettled(habitIds.slice(0, 20).map(hid => getHabitTemplateDetail(hid)))
            const nameMap = {}
            results.forEach((r, i) => {
                if (r.status === 'fulfilled' && r.value) {
                    nameMap[habitIds[i]] = r.value
                }
            })
            rootHabits.value = inlineHabits.length ? inlineHabits : rawHabits.map(hid => {
                const fetched = nameMap[hid]
                return fetched ? { id: hid, name: fetched.name || fetched.habitName, icon: fetched.icon, color: fetched.color } : { id: hid }
            })
        }

        const eventIds = rawEvents.filter(id => typeof id !== 'object')
        if (eventIds.length) {
            const results = await Promise.allSettled(eventIds.slice(0, 20).map(eid => getEventTemplateDetail(eid)))
            const nameMap = {}
            results.forEach((r, i) => {
                if (r.status === 'fulfilled' && r.value) {
                    nameMap[eventIds[i]] = r.value
                }
            })
            rootEvents.value = rawEvents.map(eid => {
                const fetched = nameMap[eid]
                return fetched ? { id: eid, name: fetched.name || fetched.eventTitle || fetched.title } : { id: eid }
            })
        }
    } catch (e) {
        console.error('加载模板失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
        loading.value = false
    }
}

const handleSubmit = async () => {
    if (submitting.value) return
    if (!form.value.planName.trim()) {
        uni.showToast({ title: '请输入计划名称', icon: 'none' })
        return
    }
    if (!form.value.startDate) {
        uni.showToast({ title: '请选择开始日期', icon: 'none' })
        return
    }

    submitting.value = true
    try {
        const customizations = {}
        const skipSubPlans = []
        subPlanChecked.value.forEach((checked, idx) => {
            if (!checked) skipSubPlans.push(idx)
        })
        if (skipSubPlans.length) customizations.skipSubPlans = skipSubPlans

        const startDateTs = new Date(form.value.startDate + 'T00:00:00').getTime()

        await useTemplate({
            templateId: templateId.value,
            planName: form.value.planName.trim(),
            startDate: startDateTs,
            execStatus: 1,
            customizations
        })

        uni.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => {
            uni.showModal({
                title: '创建成功',
                content: '计划已创建，是否前往计划总览？',
                confirmText: '去查看',
                cancelText: '留在这里',
                success: (res) => {
                    if (res.confirm) {
                        uni.redirectTo({ url: '/pages/plan/home/index' })
                    } else {
                        uni.navigateBack()
                    }
                }
            })
        }, 1200)
    } catch (e) {
        console.error('使用模板失败', e)
        uni.showToast({ title: '创建失败，请重试', icon: 'none' })
    } finally {
        submitting.value = false
    }
}

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) { uni.navigateBack() }
    else { uni.switchTab({ url: '/pages/knowledge/home/index' }) }
}

onLoad((options) => {
    templateId.value = options.id || ''
    if (templateId.value) {
        fetchDetail(templateId.value)
    } else {
        loading.value = false
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

.hero-card {
    margin: 16rpx 32rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    border-top: 6rpx solid var(--color-primary);
}
.hero-top {
    display: flex;
    align-items: center;
    gap: 18rpx;
}
.hero-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    color: #fff;
    flex-shrink: 0;
}
.hero-info {
    flex: 1;
}
.hero-name {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--color-text);
}
.hero-desc {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.form-card-schedule {
    margin: 16rpx 32rpx;
    padding: 22rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.05);
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

.fgs-full {
    margin-top: 18rpx;
}
.fgs-full:first-of-type {
    margin-top: 0;
}
.fg-label {
    display: block;
    margin-bottom: 10rpx;
    font-size: 24rpx;
    font-weight: 700;
    color: var(--color-text);
}
.required {
    color: var(--color-danger);
}

.fg-input-wrap {
    position: relative;
}
.fg-input,
.fg-select {
    width: 100%;
    box-sizing: border-box;
    height: 82rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    color: var(--color-text);
    border-radius: 18rpx;
    border: 2rpx solid var(--color-border-light);
    background: var(--color-surface);
    transition: border-color 0.22s, box-shadow 0.22s;
}
.fg-input:focus,
.fg-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4rpx rgba(var(--color-primary-rgb), 0.12);
}
.fg-select {
    display: flex;
    align-items: center;
    font-weight: 700;
}

.focus-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4rpx;
    border-radius: 2rpx;
    background: var(--color-primary);
    opacity: 0;
    transition: opacity 0.22s ease;
    pointer-events: none;
}
.fg-input-wrap:focus-within .focus-bar {
    opacity: 1;
}

.field-placeholder {
    color: var(--color-text-tertiary);
}

.switch-row {
    min-height: 74rpx;
    padding: 0 18rpx;
    border-radius: 18rpx;
    background: var(--color-surface);
    border: 2rpx solid var(--color-border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.switch-label {
    font-size: 24rpx;
    font-weight: 700;
    color: var(--color-text);
}
.slider-toggle {
    width: 92rpx;
    height: 50rpx;
    padding: 4rpx;
    border-radius: 999rpx;
    background: var(--color-border);
    box-sizing: border-box;
    transition: background 0.3s ease;
}
.slider-toggle.on {
    background: var(--color-primary);
}
.knob {
    width: 42rpx;
    height: 42rpx;
    border-radius: 999rpx;
    background: #fff;
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
    position: relative;
    left: 4rpx;
    transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slider-toggle.on .knob {
    left: 46rpx;
}

.tree-check-row {
    display: flex;
    align-items: center;
    gap: 14rpx;
    padding: 14rpx 0;
}
.tree-check-row + .tree-check-row {
    border-top: 1rpx solid var(--color-border-light);
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
.tree-check-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10rpx;
}
.tree-check-name {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}
.tree-check-sub {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

.item-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
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
.action-btn:active {
    transform: scale(0.97);
}
.action-btn.disabled {
    opacity: 0.6;
    pointer-events: none;
}
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
</style>
