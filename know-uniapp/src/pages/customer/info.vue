<template>
    <view class="customer-page">
        <!-- 顶部状态栏（小记风格 sticky） -->
        <view class="header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="header-title">客户管理</text>
            </view>
        </view>
        <!-- hero 渐变页头（欢迎语视觉基准，见设计 05 §4.5） -->
        <view class="hero-bar">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-title">
                    <text class="hero-name">客户管理</text>
                    <text class="hero-sub">集中维护客户信息与跟进状态</text>
                </view>
                <view class="hero-filter-btn" @tap="openFilterPanel">
                    <text class="hero-filter-text">筛选</text>
                </view>
            </view>
        </view>

        <!-- 搜索 -->
        <view class="search-section">
            <view class="search-box">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索客户名称或手机号"
                    placeholder-class="search-placeholder"
                    confirm-type="search"
                    @input="onKeywordInput"
                />
                <text v-if="keyword" class="search-clear" @tap="clearKeyword">×</text>
            </view>
        </view>

        <!-- 统计卡 -->
        <view class="stats-row">
            <view class="stat-card accent">
                <text class="stat-num">{{ customerStats.total }}</text>
                <text class="stat-label">总客户</text>
            </view>
            <view class="stat-card">
                <text class="stat-num">{{ customerStats.monthly }}</text>
                <text class="stat-label">本月新增</text>
            </view>
            <view class="stat-card">
                <text class="stat-num">{{ customerStats.following }}</text>
                <text class="stat-label">待跟进</text>
            </view>
        </view>

        <!-- 状态筛选 chips（单选常驻） -->
        <scroll-view class="chips-row" scroll-x :show-scrollbar="false">
            <view
                v-for="chip in statusChips"
                :key="chip.value"
                class="status-chip"
                :class="{ active: activeStatus === chip.value }"
                @tap="switchStatus(chip.value)"
            >
                {{ chip.label }}
            </view>
        </scroll-view>

        <!-- 客户列表（z-paging 分页流） -->
        <view class="list-wrap">
            <z-paging
                ref="paging"
                v-model="customerList"
                @query="queryList"
                :fixed="false"
                height="100%"
                :use-inner-scroll="true"
            >
                <view
                    v-for="customer in customerList"
                    :key="customer.id"
                    class="client-card"
                    hover-class="client-card-hover"
                    @tap="goDetail(customer)"
                >
                    <view class="avatar" :style="{ background: 'var(--gradient-primary)' }">
                        {{ avatarText(customer) }}
                    </view>
                    <view class="client-info">
                        <view class="name-row">
                            <text class="client-name">{{ customer.name }}</text>
                            <text class="status-tag" :class="statusClass(customer.status)">
                                {{ statusText(customer.status) }}
                            </text>
                        </view>
                        <view class="client-sub">
                            <text v-if="companyNameOf(customer)" class="client-company">
                                {{ companyNameOf(customer) }}
                            </text>
                            <text class="client-phone">{{ maskPhone(customer.phone) }}</text>
                        </view>
                    </view>
                    <text class="client-arrow">›</text>
                </view>

                <!-- 空态 -->
                <template #empty>
                    <view class="empty-state">
                        <view class="empty-icon">客</view>
                        <text class="empty-title">暂无客户数据</text>
                        <text class="empty-desc">点击下方按钮创建你的第一个客户</text>
                        <view class="empty-btn" @tap="goCreate">新增客户</view>
                    </view>
                </template>
            </z-paging>
        </view>

        <!-- 悬浮新增 -->
        <view class="fab" hover-class="fab-hover" @tap="goCreate">+</view>

        <!-- 筛选面板（底部弹层，全部中文按钮） -->
        <uni-popup ref="filterPopup" type="bottom">
            <view class="filter-panel">
                <view class="filter-header">
                    <text class="filter-title">筛选</text>
                    <text class="filter-close" @tap="closeFilterPanel">×</text>
                </view>
                <scroll-view class="filter-body" scroll-y>
                    <view class="filter-group">
                        <text class="filter-label">客户类型</text>
                        <view class="filter-options">
                            <view
                                v-for="opt in customerTypeOptions"
                                :key="opt.value"
                                class="filter-chip"
                                :class="{ active: filterCustomerType === opt.value }"
                                @tap="filterCustomerType = opt.value"
                            >
                                {{ opt.label }}
                            </view>
                        </view>
                    </view>
                </scroll-view>
                <view class="filter-footer">
                    <view class="btn btn-cancel" @tap="closeFilterPanel">取消</view>
                    <view class="btn btn-confirm" @tap="confirmFilter">确定</view>
                </view>
            </view>
        </uni-popup>

        <!-- 新增客户表单（底部弹出，参考首页标语弹出方式） -->
        <CustomerFormSheet v-model:show="formShow" mode="create" @saved="onFormSaved" />

        <PremiumBottomNav active="customer" />
    </view>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import CustomerFormSheet from '@/components/customer/CustomerFormSheet.vue'
import { getCustomerPage, getCustomerStats, type CustomerInfo } from '@/api/customer'
import { maskPhone } from '@/utils/format'

import { switchTabCompat } from '@/utils/util'

/* 顶部状态栏返回（小记同款） */
const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack()
    } else {
        switchTabCompat('/pages/index/index')
    }
}

/** 状态枚举（与后端 BizCustomer.status 对齐） */
const STATUS_ALL = 0
const STATUS_POTENTIAL = 1
const STATUS_INTENTION = 2
const STATUS_DEAL = 3
const STATUS_LOST = 4

const statusChips = [
    { label: '全部', value: STATUS_ALL },
    { label: '潜在', value: STATUS_POTENTIAL },
    { label: '有意向', value: STATUS_INTENTION },
    { label: '已成交', value: STATUS_DEAL },
    { label: '流失', value: STATUS_LOST }
]

const customerTypeOptions = [
    { label: '全部', value: 0 },
    { label: '普通客户', value: 1 },
    { label: '重点客户', value: 2 }
]

const router = useRouter()
const paging = shallowRef()
const keyword = ref('')
const activeStatus = ref(STATUS_ALL)
const filterCustomerType = ref(0)
const customerList = ref<CustomerInfo[]>([])
const customerStats = ref<{
    total: number | string
    monthly: number | string
    following: number | string
}>({
    total: '--',
    monthly: '--',
    following: '--'
})
const filterPopup = shallowRef()
const formShow = ref(false)

let keywordTimer: ReturnType<typeof setTimeout> | undefined

/* ---------- 列表分页 ---------- */
const queryList = async (pageNo: number, pageSize: number) => {
    try {
        const params: any = { pageNum: pageNo, pageSize }
        const kw = keyword.value.trim()
        if (kw) params.name = kw
        if (activeStatus.value !== STATUS_ALL) params.status = activeStatus.value
        if (filterCustomerType.value !== 0) params.customerType = filterCustomerType.value
        const res = await getCustomerPage(params)
        paging.value?.complete(res.records || [], res.total)
    } catch (error) {
        console.error('加载客户列表失败', error)
        paging.value?.complete(false)
    }
}

/** 搜索防抖 300ms */
const onKeywordInput = () => {
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
        paging.value?.reload()
    }, 300)
}

const clearKeyword = () => {
    keyword.value = ''
    paging.value?.reload()
}

/** 状态 chips 切换 */
const switchStatus = (value: number) => {
    if (activeStatus.value === value) return
    activeStatus.value = value
    paging.value?.reload()
}

/* ---------- 统计卡 ---------- */
const loadStats = async () => {
    try {
        const res = await getCustomerStats()
        customerStats.value = {
            total: res.total ?? '--',
            monthly: res.monthly ?? '--',
            following: res.following ?? '--'
        }
    } catch (error) {
        console.error('加载客户统计失败', error)
        customerStats.value = { total: '--', monthly: '--', following: '--' }
    }
}

/* ---------- 筛选面板 ---------- */
const openFilterPanel = () => {
    filterPopup.value?.open()
}

const closeFilterPanel = () => {
    filterPopup.value?.close()
}

const confirmFilter = () => {
    closeFilterPanel()
    paging.value?.reload()
}

/* ---------- 展示辅助 ---------- */
const avatarText = (item: CustomerInfo) => {
    const name = item.name || ''
    return (name.trim().charAt(0) || '客').toUpperCase()
}

const statusText = (status?: number) => {
    switch (status) {
        case STATUS_POTENTIAL:
            return '潜在'
        case STATUS_INTENTION:
            return '意向'
        case STATUS_DEAL:
            return '成交'
        case STATUS_LOST:
            return '流失'
        default:
            return '未知'
    }
}

const statusClass = (status?: number) => {
    switch (status) {
        case STATUS_DEAL:
            return 'tag-success'
        case STATUS_INTENTION:
            return 'tag-warning'
        case STATUS_LOST:
            return 'tag-danger'
        default:
            return 'tag-neutral'
    }
}

/** 列表 record 未带 company；后端增强后 company.name 有值时展示 */
const companyNameOf = (item: CustomerInfo) => {
    return item.company?.name || ''
}

/* ---------- 跳转 ---------- */
const goDetail = (customer: CustomerInfo) => {
    if (customer.id) {
        router.navigateTo(`/pages/customer/detail?id=${customer.id}`)
    }
}

const goCreate = () => {
    formShow.value = true
}

const onFormSaved = () => {
    paging.value?.reload()
    loadStats()
}

onShow(() => {
    loadStats()
})
</script>

<style scoped lang="scss">
.customer-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 90rpx;
}

/* ===== hero 渐变页头（欢迎语视觉基准） ===== */
.hero-bar {
    position: relative;
    overflow: hidden;
    padding: 36rpx 40rpx 52rpx;
    background: var(--gradient-primary);
    box-shadow: none;

    /* App 端自定义导航栏避让状态栏 */
    /* #ifdef APP-PLUS */
    padding-top: calc(36rpx + var(--status-bar-height));
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

.hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}

.hero-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.hero-name {
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.hero-sub {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

.hero-filter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 104rpx;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(10rpx);
}

.hero-filter-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-btn-text);
}

/* ===== 搜索 ===== */
.search-section {
    padding: 24rpx 40rpx 0;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 38rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    border: 1rpx solid var(--color-border-light);
}

.search-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 28rpx;
    color: var(--color-text);
}

.search-placeholder {
    color: var(--color-text-tertiary);
}

.search-clear {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
    flex-shrink: 0;
}

/* ===== 统计卡 ===== */
.stats-row {
    display: flex;
    gap: 18rpx;
    padding: 24rpx 40rpx 0;
}

.stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26rpx 10rpx 22rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.stat-card.accent {
    background: var(--color-primary-soft);
}

.stat-num {
    font-size: 42rpx;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
}

.stat-label {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}

/* ===== 状态 chips ===== */
.chips-row {
    white-space: nowrap;
    padding: 26rpx 40rpx 0;
    box-sizing: border-box;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 60rpx;
    padding: 0 30rpx;
    margin-right: 16rpx;
    border-radius: 30rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 26rpx;
    font-weight: 500;
}

.status-chip.active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    box-shadow: var(--shadow-glow);
}

/* ===== 列表 ===== */
.list-wrap {
    margin-top: 20rpx;
    height: calc(100vh - 560rpx);
    min-height: 320rpx;
}

.client-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin: 0 40rpx 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.client-card-hover {
    background: var(--color-surface-hover);
}

.avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--color-btn-text);
    flex-shrink: 0;
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.14);
}

.client-info {
    flex: 1;
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 14rpx;
    flex-wrap: wrap;
}

.client-name {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-text);
}

.status-tag {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    white-space: nowrap;
}

.tag-success {
    background: var(--color-success-soft);
    color: var(--color-text);
}

.tag-warning {
    background: var(--color-warning-soft);
    color: var(--color-text);
}

.tag-danger {
    background: var(--color-danger-soft);
    color: var(--color-danger-rgb);
}

.tag-neutral {
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
}

.client-sub {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 8rpx;
    min-width: 0;
}

.client-company {
    font-size: 24rpx;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
}

.client-phone {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
}

.client-arrow {
    font-size: 40rpx;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
    margin-left: 6rpx;
}

/* ===== 空态 ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 110rpx 40rpx 0;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 64rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-title {
    margin-top: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.empty-desc {
    margin-top: 12rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

.empty-btn {
    margin-top: 36rpx;
    padding: 20rpx 64rpx;
    border-radius: 40rpx;
    background: var(--color-primary);
    color: var(--color-btn-text);
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: var(--shadow-glow);
}

/* ===== FAB ===== */
.fab {
    position: fixed;
    right: 40rpx;
    bottom: 122rpx;
    z-index: 50;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    line-height: 1;
    box-shadow: var(--shadow-glow);
}

.fab-hover {
    transform: scale(0.96);
}

/* ===== 筛选面板 ===== */
.filter-panel {
    background: var(--color-surface);
    border-radius: 24rpx 24rpx 0 0;
    padding: 32rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}

.filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24rpx;
}

.filter-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.filter-close {
    font-size: 44rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
}

.filter-body {
    flex: 1;
    min-height: 0;
    max-height: 40vh;
}

.filter-group {
    padding: 8rpx 0 24rpx;
}

.filter-label {
    display: block;
    font-size: 26rpx;
    color: var(--color-text-secondary);
    margin-bottom: 18rpx;
}

.filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.filter-chip {
    padding: 14rpx 32rpx;
    border-radius: 32rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 26rpx;
}

.filter-chip.active {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.filter-footer {
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
/* ===== 顶部状态栏（小记风格 sticky） ===== */
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 96rpx;
    padding: 0 32rpx;
    background: var(--color-surface, rgba(255, 255, 255, 0.92));
    backdrop-filter: blur(24rpx);
    border-bottom: 1rpx solid var(--color-border-light, rgba(0, 0, 0, 0.06));

    /* #ifdef APP-PLUS */
    height: calc(96rpx + var(--status-bar-height));
    padding: var(--status-bar-height) 32rpx 0;
    /* #endif */

    .header-left {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    .back-btn {
        width: 72rpx;
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        margin-left: -16rpx;

        &:active {
            background: var(--color-surface-soft, rgba(0, 0, 0, 0.04));
        }

        .back-icon {
            font-size: 44rpx;
            line-height: 1;
            color: var(--color-text, #1f2329);
        }
    }

    .header-title {
        font-size: 36rpx;
        font-weight: 600;
        color: var(--color-text, #1f2329);
    }
}
</style>
