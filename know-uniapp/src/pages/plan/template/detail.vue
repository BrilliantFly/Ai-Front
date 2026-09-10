<template>
    <view class="plan-page">
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="page-title">模板详情</text>
            </view>
        </view>

        <scroll-view scroll-y class="page-scroll">
            <view v-if="loading" class="loading-state">
                <text class="loading-text">加载中...</text>
            </view>

            <template v-else-if="detail">
                <!-- Hero Card -->
                <view class="hero-card" :style="{ borderTopColor: detail.color || '#6366f1' }">
                    <view class="hero-top">
                        <view class="hero-icon" :style="{ background: `linear-gradient(135deg, ${detail.color || '#6366f1'}, ${(detail.color || '#6366f1')}88)` }">
                            {{ detail.icon || '📋' }}
                        </view>
                        <view class="hero-info">
                            <text class="hero-name">{{ detail.name }}</text>
                            <text class="hero-desc">{{ detail.description || '暂无描述' }}</text>
                        </view>
                    </view>
                    <view class="hero-stats">
                        <view class="hero-stat">
                            <text class="hs-num">{{ detail.useCount || 0 }}</text>
                            <text class="hs-label">使用次数</text>
                        </view>
                        <view class="hero-stat">
                            <text class="hs-num">{{ detail.rating || '—' }}</text>
                            <text class="hs-label">评分</text>
                        </view>
                        <view class="hero-stat">
                            <text class="hs-num">{{ detail.durationDays || '—' }}天</text>
                            <text class="hs-label">周期</text>
                        </view>
                    </view>
                </view>

                <!-- 层级结构 -->
                <view v-if="subPlans.length" class="section-block">
                    <view class="section-hdr">
                        <span class="title">📂 子计划层级</span>
                    </view>
                    <view class="tree-wrap">
                        <view v-for="(plan, idx) in subPlans" :key="idx" class="tree-node">
                            <view class="tree-node-header">
                                <text class="tree-dot" :style="{ background: detail.color || 'var(--color-primary)' }"></text>
                                <text class="tree-name">{{ plan.plan_name || plan.planName || '子计划' }}</text>
                                <text class="tree-tag" v-if="plan.duration_days || plan.durationDays">{{ plan.duration_days || plan.durationDays }}天</text>
                            </view>
                            <view v-if="(plan.habit_ids || plan.habitIds || plan.habits) && parseList(plan.habit_ids || plan.habitIds || plan.habits).length" class="tree-children">
                                <view v-for="(hid, hi) in parseList(plan.habit_ids || plan.habitIds || plan.habits)" :key="hi" class="tree-leaf">
                                    <text class="leaf-dot">🎯</text>
                                    <text class="leaf-text">{{ habitNameMap[hid] || '习惯#' + hid }}</text>
                                </view>
                            </view>
                            <view v-if="(plan.event_ids || plan.eventIds || plan.events) && parseList(plan.event_ids || plan.eventIds || plan.events).length" class="tree-children">
                                <view v-for="(eid, ei) in parseList(plan.event_ids || plan.eventIds || plan.events)" :key="ei" class="tree-leaf">
                                    <text class="leaf-dot">📅</text>
                                    <text class="leaf-text">{{ eventNameMap[eid] || '日程#' + eid }}</text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 根级习惯 -->
                <view v-if="rootHabits.length" class="section-block">
                    <view class="section-hdr">
                        <span class="title">🎯 根级习惯</span>
                        <span class="count-badge">{{ rootHabits.length }}个</span>
                    </view>
                    <view class="item-list">
                        <TemplateHabitItem
                            v-for="h in rootHabits"
                            :key="h.id || h.habitId"
                            :id="h.id || h.habitId"
                            :name="h.name || h.habitName"
                            :icon="h.icon"
                            :color="h.color"
                        />
                    </view>
                </view>

                <!-- 根级日程 -->
                <view v-if="rootEvents.length" class="section-block">
                    <view class="section-hdr">
                        <span class="title">📅 根级日程</span>
                        <span class="count-badge">{{ rootEvents.length }}个</span>
                    </view>
                    <view class="item-list">
                        <TemplateEventItem
                            v-for="e in rootEvents"
                            :key="e.id || e.eventId"
                            :id="e.id || e.eventId"
                            :name="e.name || e.eventTitle || e.title"
                        />
                    </view>
                </view>

                <view style="height: 200rpx"></view>
            </template>
        </scroll-view>

        <!-- Bottom Action Bar -->
        <view class="action-bar">
            <view class="action-btn action-secondary" @tap="childFormVisible = !childFormVisible">
                <text>{{ childFormVisible ? '✕ 收起' : '➕ 添加子模板' }}</text>
            </view>
            <view class="action-btn action-primary" @tap="goUse">
                <text>🚀 使用此模板</text>
            </view>
        </view>

        <!-- 添加子模板 inline form -->
        <view v-if="childFormVisible" class="child-form-mask" @tap.self="childFormVisible = false">
            <view class="child-form">
                <view class="modal-handle"></view>
                <text class="modal-title">➕ 添加子模板</text>
                <view class="fgs-full">
                    <text class="fg-label">子模板名称 <text class="required">*</text></text>
                    <view class="fg-input-wrap">
                        <input v-model="childForm.name" class="fg-input" maxlength="30" placeholder="子计划名称" placeholder-class="field-placeholder" />
                        <view class="focus-bar"></view>
                    </view>
                </view>
                <view class="fgs-full">
                    <text class="fg-label">持续天数</text>
                    <view class="fg-input-wrap">
                        <input v-model="childForm.durationDays" class="fg-input" type="number" placeholder="如 30" placeholder-class="field-placeholder" />
                        <view class="focus-bar"></view>
                    </view>
                </view>
                <view class="form-actions">
                    <view class="action-btn cancel" @tap="childFormVisible = false">取消</view>
                    <view class="action-btn submit" :class="{ disabled: childSubmitting }" @tap="submitChild">
                        <text>{{ childSubmitting ? '保存中...' : '保存子模板' }}</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TemplateHabitItem from './components/TemplateHabitItem.vue'
import TemplateEventItem from './components/TemplateEventItem.vue'
import { getTemplateDetail, createTemplate } from '@/api/plan/template'
import { getHabitTemplateDetail } from '@/api/plan/habit-template'
import { getEventTemplateDetail } from '@/api/plan/event-template'
import { useHoverEffect } from '@/hooks/useHoverEffect'

useHoverEffect('.action-btn,.back-btn')

const loading = ref(true)
const detail = ref(null)
const templateId = ref('')
const subPlans = ref([])
const rootHabits = ref([])
const rootEvents = ref([])
const habitNameMap = ref({})
const eventNameMap = ref({})
const childFormVisible = ref(false)
const childSubmitting = ref(false)
const childForm = ref({
    name: '',
    durationDays: ''
})

const safeJsonParse = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
        try { return JSON.parse(val) } catch { return [] }
    }
    return []
}

const parseList = (val) => {
    return safeJsonParse(val)
}

const fetchDetail = async (id) => {
    loading.value = true
    try {
        const res = await getTemplateDetail(id)
        detail.value = res || {}
        subPlans.value = safeJsonParse(res.defaultSubPlans || res.subPlans)
        const rawHabits = safeJsonParse(res.defaultHabitIds)
        const inlineHabits = safeJsonParse(res.defaultHabits)
        rootHabits.value = inlineHabits.length ? inlineHabits : rawHabits.map(id => ({ id }))
        rootEvents.value = safeJsonParse(res.defaultEventIds).map(id => ({ id }))

        // Collect tree habit/event ids for name resolution
        const treeHabitIds = []
        const treeEventIds = []
        const walkPlans = (plans) => {
            plans.forEach(p => {
                safeJsonParse(p.habit_ids || p.habitIds || p.habits).forEach(hid => {
                    if (typeof hid !== 'object') treeHabitIds.push(hid)
                })
                safeJsonParse(p.event_ids || p.eventIds || p.events).forEach(eid => {
                    if (typeof eid !== 'object') treeEventIds.push(eid)
                })
                if (p.sub_plans || p.subPlans) walkPlans(safeJsonParse(p.sub_plans || p.subPlans))
            })
        }
        walkPlans(subPlans.value)

        // Fetch names for habit IDs
        const habitIds = [...new Set([...rawHabits.filter(id => typeof id !== 'object'), ...treeHabitIds])]
        if (habitIds.length) {
            const results = await Promise.allSettled(habitIds.slice(0, 20).map(hid => getHabitTemplateDetail(hid)))
            results.forEach((r, i) => {
                if (r.status === 'fulfilled' && r.value) {
                    habitNameMap.value[habitIds[i]] = r.value.name || r.value.habitName
                }
            })
        }
        // Fetch names for event IDs
        const eventIds = [...new Set([...safeJsonParse(res.defaultEventIds).filter(id => typeof id !== 'object'), ...treeEventIds])]
        if (eventIds.length) {
            const results = await Promise.allSettled(eventIds.slice(0, 20).map(eid => getEventTemplateDetail(eid)))
            results.forEach((r, i) => {
                if (r.status === 'fulfilled' && r.value) {
                    eventNameMap.value[eventIds[i]] = r.value.name || r.value.eventTitle || r.value.title
                }
            })
        }
    } catch (e) {
        console.error('加载模板详情失败', e)
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

const goUse = () => {
    uni.navigateTo({ url: `/pages/plan/template/use?id=${templateId.value}` })
}

const submitChild = async () => {
    if (childSubmitting.value) return
    if (!childForm.value.name.trim()) {
        uni.showToast({ title: '请输入子模板名称', icon: 'none' })
        return
    }
    childSubmitting.value = true
    try {
        await createTemplate({
            parentId: templateId.value,
            name: childForm.value.name.trim(),
            durationDays: childForm.value.durationDays ? Number(childForm.value.durationDays) : undefined
        })
        uni.showToast({ title: '子模板已创建', icon: 'success' })
        childFormVisible.value = false
        childForm.value = { name: '', durationDays: '' }
        fetchDetail(templateId.value)
    } catch (e) {
        console.error('创建子模板失败', e)
        uni.showToast({ title: '创建失败', icon: 'none' })
    } finally {
        childSubmitting.value = false
    }
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
    padding: 28rpx;
    border-radius: 24rpx;
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
    border-top: 6rpx solid var(--color-primary);
    box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.06);
}
.hero-top {
    display: flex;
    align-items: center;
    gap: 20rpx;
}
.hero-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;
    color: #fff;
    flex-shrink: 0;
}
.hero-info {
    flex: 1;
}
.hero-name {
    display: block;
    font-size: 34rpx;
    font-weight: 700;
    color: var(--color-text);
}
.hero-desc {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    color: var(--color-text-secondary);
    line-height: 1.5;
}
.hero-stats {
    display: flex;
    gap: 0;
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid var(--color-border-light);
}
.hero-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.hs-num {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--color-text);
}
.hs-label {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
    margin-top: 4rpx;
}

.section-block {
    margin: 16rpx 0;
}
.section-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 32rpx 12rpx;
}
.section-hdr .title {
    font-size: 30rpx;
    font-weight: 700;
    color: var(--color-text);
}
.count-badge {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
    background: var(--color-surface-soft);
    padding: 4rpx 14rpx;
    border-radius: 999rpx;
}

.tree-wrap {
    padding: 0 32rpx;
}
.tree-node {
    padding: 16rpx 0;
}
.tree-node + .tree-node {
    border-top: 1rpx solid var(--color-border-light);
}
.tree-node-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
}
.tree-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    flex-shrink: 0;
}
.tree-name {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text);
}
.tree-tag {
    font-size: 20rpx;
    font-weight: 600;
    color: var(--color-text-tertiary);
    background: var(--color-surface-soft);
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
}
.tree-children {
    margin-left: 24rpx;
    margin-top: 10rpx;
}
.tree-leaf {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 6rpx 0;
}
.leaf-dot {
    font-size: 22rpx;
}
.leaf-text {
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.item-list {
    padding: 0 32rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
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
.action-primary {
    color: #fff;
    background: var(--gradient-primary);
    box-shadow: var(--shadow-glow);
}
.action-secondary {
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 2rpx solid var(--color-border-light);
}

.child-form-mask {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 200;
    background: rgba(15, 23, 42, 0.42);
    display: flex;
    align-items: flex-end;
    justify-content: center;
}
.child-form {
    width: 100%;
    padding: 18rpx 18rpx calc(30rpx + env(safe-area-inset-bottom));
    border-radius: 32rpx 32rpx 0 0;
    background: var(--color-bg-app, #ffffff);
    box-shadow: 0 -8rpx 40rpx rgba(15, 23, 42, 0.12);
}
.modal-handle {
    width: 72rpx;
    height: 8rpx;
    border-radius: 999rpx;
    background: var(--color-border);
    margin: 0 auto 18rpx;
}
.modal-title {
    display: block;
    margin-bottom: 22rpx;
    font-size: 38rpx;
    font-weight: 800;
    color: var(--color-text);
}
.fgs-full {
    margin-top: 18rpx;
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
.fg-input {
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
.fg-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4rpx rgba(var(--color-primary-rgb), 0.12);
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
.fg-input-wrap:focus-within .focus-bar {
    opacity: 1;
}
.form-actions {
    display: flex;
    gap: 14rpx;
    margin-top: 22rpx;
    padding-top: 14rpx;
    border-top: 1rpx solid var(--color-border-light);
}
.form-actions .action-btn {
    flex: 1;
    min-height: 86rpx;
    border-radius: 18rpx;
    font-size: 27rpx;
    font-weight: 800;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s;
}
.form-actions .action-btn.submit {
    flex: 1.15;
    color: #fff;
    background: var(--gradient-primary);
    box-shadow: var(--shadow-glow);
    border: none;
}
.form-actions .action-btn.submit.disabled {
    opacity: 0.65;
    pointer-events: none;
}
.form-actions .action-btn.cancel {
    color: var(--color-text-secondary);
    background: var(--color-surface, #ffffff);
    border: 2rpx solid var(--color-border-light);
}
.field-placeholder {
    color: var(--color-text-tertiary);
}
</style>
