<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">{{ isEdit ? '编辑日程模板' : '新建日程模板' }}</text>
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
                        <text class="fg-label">📝 模板名称 <text class="required">*</text></text>
                        <view class="fg-input-wrap">
                            <input v-model="form.name" class="fg-input" maxlength="30" placeholder="模板名称" placeholder-class="field-placeholder" />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📋 日程标题 <text class="required">*</text></text>
                        <view class="fg-input-wrap">
                            <input v-model="form.title" class="fg-input" maxlength="50" placeholder="日程标题" placeholder-class="field-placeholder" />
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
                    <text class="form-card-header">日程属性</text>
                    <view class="fgs-row">
                        <view class="fgs-cell">
                            <text class="fg-label">日程类型</text>
                            <picker :value="eventTypeIndex" :range="eventTypeOptions" @change="eventTypeIndex = $event.detail.value">
                                <view class="fg-select">{{ eventTypeOptions[eventTypeIndex] }}</view>
                            </picker>
                        </view>
                        <view class="fgs-cell">
                            <text class="fg-label">四象限</text>
                            <picker :value="quadrantIndex" :range="quadrantOptions" @change="quadrantIndex = $event.detail.value">
                                <view class="fg-select">{{ quadrantOptions[quadrantIndex] }}</view>
                            </picker>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">⭐ 优先级</text>
                        <view class="star-row">
                            <text
                                v-for="s in 5"
                                :key="s"
                                class="star"
                                :class="{ active: s <= form.priority }"
                                @tap="form.priority = s"
                            >★</text>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <view class="switch-row">
                            <text class="switch-label">是否重复</text>
                            <view class="slider-toggle" :class="{ on: form.isRepeat }" @tap="form.isRepeat = !form.isRepeat">
                                <view class="knob"></view>
                            </view>
                        </view>
                    </view>
                    <view v-if="form.isRepeat" class="fgs-row">
                        <view class="fgs-cell">
                            <text class="fg-label">重复类型</text>
                            <picker :value="repeatTypeIndex" :range="repeatTypeOptions" @change="repeatTypeIndex = $event.detail.value">
                                <view class="fg-select">{{ repeatTypeOptions[repeatTypeIndex] }}</view>
                            </picker>
                        </view>
                        <view class="fgs-cell">
                            <text class="fg-label">重复规则</text>
                            <view class="fg-input-wrap">
                                <input v-model="form.repeatRule" class="fg-input" placeholder="如: 1,5" placeholder-class="field-placeholder" />
                                <view class="focus-bar"></view>
                            </view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <view class="switch-row">
                            <text class="switch-label">全天</text>
                            <view class="slider-toggle" :class="{ on: form.allDay }" @tap="form.allDay = !form.allDay">
                                <view class="knob"></view>
                            </view>
                        </view>
                    </view>
                    <view v-if="!form.allDay" class="fgs-row">
                        <view class="fgs-cell">
                            <text class="fg-label">开始时间</text>
                            <picker mode="time" :value="form.startTime" @change="form.startTime = $event.detail.value">
                                <view class="fg-select">{{ form.startTime || '选择' }}</view>
                            </picker>
                        </view>
                        <view class="fgs-cell">
                            <text class="fg-label">结束时间</text>
                            <picker mode="time" :value="form.endTime" @change="form.endTime = $event.detail.value">
                                <view class="fg-select">{{ form.endTime || '选择' }}</view>
                            </picker>
                        </view>
                    </view>
                </view>

                <view class="form-card-schedule">
                    <text class="form-card-header">提醒与其他</text>
                    <view class="fgs-full">
                        <text class="fg-label">⏰ 提前提醒（分钟）</text>
                        <view class="fg-input-wrap">
                            <input v-model="form.reminderMinutes" class="fg-input" type="number" placeholder="15" placeholder-class="field-placeholder" />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">📍 地点</text>
                        <view class="fg-input-wrap">
                            <input v-model="form.location" class="fg-input" placeholder="可选地点" placeholder-class="field-placeholder" />
                            <view class="focus-bar"></view>
                        </view>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">适用计划类型</text>
                        <picker :value="planTypeIndex" :range="planTypeOptions" @change="planTypeIndex = $event.detail.value">
                            <view class="fg-select">{{ planTypeOptions[planTypeIndex] }}</view>
                        </picker>
                    </view>
                    <view class="fgs-full">
                        <text class="fg-label">标签</text>
                        <view class="fg-input-wrap">
                            <input v-model="form.tags" class="fg-input" placeholder="逗号分隔" placeholder-class="field-placeholder" />
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
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getEventTemplateDetail, createEventTemplate, updateEventTemplate } from '@/api/plan/event-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.action-btn,.back-btn,.star')

const loading = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const templateId = ref('')

const eventTypeOptions = ['普通', '重要', '紧急', '会议', '截止']
const quadrantOptions = ['不重要不紧急', '重要不紧急', '不重要紧急', '重要紧急']
const repeatTypeOptions = ['每天', '每周', '每月', '每年']
const planTypeOptions = ['全部', '习惯', '日程', '综合']
const visibilityOptions = ['私有', '公开']

const eventTypeIndex = ref(0)
const quadrantIndex = ref(0)
const repeatTypeIndex = ref(0)
const planTypeIndex = ref(0)
const visibilityIndex = ref(0)

const form = ref({
    name: '',
    title: '',
    description: '',
    eventType: '普通',
    quadrant: '不重要不紧急',
    priority: 1,
    isRepeat: false,
    repeatType: '每天',
    repeatRule: '',
    allDay: false,
    startTime: '09:00',
    endTime: '10:00',
    reminderMinutes: '',
    location: '',
    tags: '',
    planType: '',
    visibility: 0
})

const buildPayload = () => ({
    id: isEdit.value ? templateId.value : undefined,
    name: form.value.name.trim(),
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    eventType: eventTypeOptions[eventTypeIndex.value],
    quadrant: quadrantOptions[quadrantIndex.value],
    priority: form.value.priority,
    isRepeat: form.value.isRepeat,
    repeatType: form.value.isRepeat ? repeatTypeOptions[repeatTypeIndex.value] : undefined,
    repeatRule: form.value.isRepeat ? form.value.repeatRule : undefined,
    allDay: form.value.allDay,
    startTime: form.value.allDay ? undefined : form.value.startTime,
    endTime: form.value.allDay ? undefined : form.value.endTime,
    reminderMinutes: form.value.reminderMinutes ? Number(form.value.reminderMinutes) : undefined,
    location: form.value.location || undefined,
    tags: form.value.tags || undefined,
    planType: planTypeOptions[planTypeIndex.value] !== '全部' ? planTypeOptions[planTypeIndex.value] : undefined,
    visibility: visibilityIndex.value === 1 ? 1 : 0
})

const handleSave = async () => {
    if (submitting.value) return
    if (!form.value.name.trim()) {
        uni.showToast({ title: '请输入模板名称', icon: 'none' })
        return
    }
    if (!form.value.title.trim()) {
        uni.showToast({ title: '请输入日程标题', icon: 'none' })
        return
    }
    submitting.value = true
    try {
        const payload = buildPayload()
        if (isEdit.value) {
            await updateEventTemplate(payload)
        } else {
            await createEventTemplate(payload)
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
        const res = await getEventTemplateDetail(id)
        if (res) {
            form.value.name = res.name || ''
            form.value.title = res.title || res.eventTitle || ''
            form.value.description = res.description || ''
            form.value.eventType = res.eventType || '普通'
            eventTypeIndex.value = eventTypeOptions.indexOf(form.value.eventType)
            if (eventTypeIndex.value < 0) eventTypeIndex.value = 0
            form.value.quadrant = res.quadrant || '不重要不紧急'
            quadrantIndex.value = quadrantOptions.indexOf(form.value.quadrant)
            if (quadrantIndex.value < 0) quadrantIndex.value = 0
            form.value.priority = res.priority || 1
            form.value.isRepeat = !!res.isRepeat
            form.value.repeatType = res.repeatType || '每天'
            repeatTypeIndex.value = repeatTypeOptions.indexOf(form.value.repeatType)
            if (repeatTypeIndex.value < 0) repeatTypeIndex.value = 0
            form.value.repeatRule = res.repeatRule || ''
            form.value.allDay = !!res.allDay
            form.value.startTime = res.startTime || '09:00'
            form.value.endTime = res.endTime || '10:00'
            form.value.reminderMinutes = res.reminderMinutes || ''
            form.value.location = res.location || ''
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

.star-row {
    display: flex;
    gap: 12rpx;
}
.star {
    font-size: 44rpx;
    color: var(--color-border-light);
    transition: color 0.2s, transform 0.2s;
    cursor: pointer;
}
.star.active {
    color: #f59e0b;
}
.star:active {
    transform: scale(1.2);
}

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
