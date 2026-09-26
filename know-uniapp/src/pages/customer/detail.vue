<template>
    <view class="detail-page">
        <!-- hero 渐变头部卡 -->
        <view class="hero-card">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-avatar" :style="{ background: 'var(--gradient-primary)' }">
                    {{ avatarText() }}
                </view>
                <view class="hero-main">
                    <view class="hero-name-row">
                        <text class="hero-name">{{ detail.name || '--' }}</text>
                        <text class="status-tag" :class="statusClass(status())">
                            {{ statusText(status()) }}
                        </text>
                    </view>
                    <text class="hero-phone">{{ maskPhone(detail.phone) }}</text>
                    <view v-if="typeText()" class="hero-badge">{{ typeText() }}</view>
                </view>
                <view class="hero-edit" @tap="goEdit">
                    <text class="hero-edit-text">编辑</text>
                </view>
            </view>
        </view>

        <!-- 企业信息（常显，未关联时兜底） -->
        <SectionCard title="企业信息">
            <template v-if="company()">
                <FieldItem label="企业名称" :value="company()?.name" />
                <FieldItem label="所属行业" :value="company()?.industry" />
                <FieldItem label="企业规模" :value="company()?.scale" />
                <FieldItem label="成立时间" :value="company()?.establishedDate" />
                <FieldItem label="注册资本" :value="company()?.capital" />
                <FieldItem label="企业地址" :value="company()?.address" />
            </template>
            <view v-else class="company-empty">
                <text class="company-empty-icon">企</text>
                <text class="company-empty-text">未关联企业</text>
                <text class="company-empty-desc">编辑客户资料时可选配所属企业</text>
            </view>
        </SectionCard>

        <!-- 基本信息（可折叠） -->
        <SectionCard title="基本信息" collapsible>
            <FieldItem label="姓名" :value="detail.name" />
            <FieldItem label="性别" :value="genderText()" />
            <FieldItem label="年龄" :value="detail.age" />
            <FieldItem label="手机号" :value="maskPhone(detail.phone)" />
            <FieldItem label="邮箱" :value="maskEmail(detail.email)" />
            <FieldItem label="所在地区" :value="detail.address || detail.regionCode" />
            <FieldItem label="来源" :value="detail.source" />
        </SectionCard>

        <!-- 跟进记录 -->
        <SectionCard title="跟进记录" :collapsible="true">
            <template v-if="followups.length">
                <view
                    v-for="item in followups"
                    :key="item.id"
                    class="timeline-item"
                >
                    <view class="timeline-track">
                        <view class="timeline-dot"></view>
                        <view class="timeline-line"></view>
                    </view>
                    <view class="timeline-content">
                        <view class="timeline-head">
                            <text class="timeline-type">{{ followupTypeText(item.type) }}</text>
                            <text class="timeline-time">{{ formatTime(item.createTime) }}</text>
                        </view>
                        <text class="timeline-text">{{ item.content || '--' }}</text>
                        <text v-if="item.result" class="timeline-result">{{ item.result }}</text>
                    </view>
                </view>
            </template>
            <view v-else class="followup-empty">
                <text class="followup-empty-text">暂无跟进记录</text>
            </view>
            <view class="add-followup" @tap="goAddFollowup">
                <text class="add-followup-text">+ 添加跟进</text>
            </view>
        </SectionCard>

        <view class="page-bottom-space"></view>

        <!-- 底部操作栏 -->
        <view class="bottom-bar">
            <view class="bottom-btn primary" @tap="goAddFollowup">添加跟进</view>
            <view class="bottom-btn ghost" @tap="goEdit">编辑资料</view>
        </view>

        <!-- 编辑表单（底部弹出，参考首页标语弹出方式） -->
        <CustomerFormSheet
            v-model:show="formShow"
            mode="edit"
            :customer-id="customerId"
            @saved="onFormSaved"
        />
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import SectionCard from '@/components/customer/SectionCard.vue'
import FieldItem from '@/components/customer/FieldItem.vue'
import CustomerFormSheet from '@/components/customer/CustomerFormSheet.vue'
import { getCustomerDetail, getFollowupPage, type CustomerInfo, type CustomerFollowup } from '@/api/customer'
import { maskPhone, maskEmail } from '@/utils/format'

const router = useRouter()
const customerId = ref<string | number>('')
const detail = ref<CustomerInfo>({} as CustomerInfo)
const followups = ref<CustomerFollowup[]>([])
const formShow = ref(false)

const followupTypeMap: Record<string, string> = {
    电话: '📞',
    微信: '💬',
    拜访: '🤝',
    邮件: '📧',
    其他: '✉️'
}

const company = () => detail.value.company ?? null

const avatarText = () => {
    const name = detail.value.name || ''
    return (name.trim().charAt(0) || '客').toUpperCase()
}

const status = () => detail.value.status ?? 0

const statusText = (s?: number) => {
    switch (s) {
        case 1:
            return '潜在'
        case 2:
            return '意向'
        case 3:
            return '成交'
        case 4:
            return '流失'
        default:
            return '未知'
    }
}

const statusClass = (s?: number) => {
    switch (s) {
        case 3:
            return 'tag-success'
        case 2:
            return 'tag-warning'
        case 4:
            return 'tag-danger'
        default:
            return 'tag-neutral'
    }
}

const typeText = () => {
    switch (detail.value.customerType) {
        case 1:
            return '普通客户'
        case 2:
            return '重点客户'
        default:
            return ''
    }
}

const genderText = () => {
    switch (detail.value.gender) {
        case 1:
            return '男'
        case 2:
            return '女'
        default:
            return undefined
    }
}

const followupTypeText = (type?: string) => {
    if (!type) return '跟进'
    const icon = followupTypeMap[type]
    return icon ? `${icon} ${type}` : type
}

const formatTime = (t?: number | string) => {
    if (!t) return '--'
    const n = Number(t)
    if (!n) return String(t)
    const d = new Date(n > 1e12 ? n : n * 1000)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadDetail = async () => {
    try {
        const res = await getCustomerDetail(customerId.value)
        detail.value = res || ({} as CustomerInfo)
    } catch (error) {
        console.error('加载客户详情失败', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
    }
}

const loadFollowups = async () => {
    try {
        const res = await getFollowupPage({
            customerId: customerId.value,
            pageNum: 1,
            pageSize: 10
        })
        followups.value = res.records || []
    } catch (error) {
        console.error('加载跟进记录失败', error)
        followups.value = []
    }
}

const goEdit = () => {
    if (customerId.value) {
        formShow.value = true
    }
}

const onFormSaved = () => {
    loadDetail()
    loadFollowups()
}

const goAddFollowup = () => {
    router.navigateTo(`/pages/customer/followup?customerId=${customerId.value}`)
}

onLoad((options) => {
    // 雪花 ID 超出 JS 安全整数范围，必须保留字符串，禁止 Number() 转换（否则精度丢失请求错误 ID）
    customerId.value = String(options?.id || '')
    if (!customerId.value) {
        uni.showToast({ title: '缺少客户ID', icon: 'none' })
    }
})

onShow(() => {
    // 首次进入与从编辑页/跟进页返回时刷新
    if (customerId.value) {
        loadDetail()
        loadFollowups()
    }
})
</script>

<style scoped lang="scss">
.detail-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 140rpx;
}

/* ===== hero 头部卡 ===== */
.hero-card {
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

.hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.hero-avatar {
    width: 108rpx;
    height: 108rpx;
    border-radius: 54rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    font-weight: 700;
    color: var(--color-btn-text);
    flex-shrink: 0;
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.16);
}

.hero-main {
    flex: 1;
    min-width: 0;
}

.hero-name-row {
    display: flex;
    align-items: center;
    gap: 14rpx;
    flex-wrap: wrap;
}

.hero-name {
    font-size: 42rpx;
    font-weight: 700;
    line-height: 1.25;
    color: var(--color-btn-text);
}

.status-tag {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    white-space: nowrap;
}

.tag-success {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-btn-text);
}

.tag-warning {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-btn-text);
}

.tag-danger {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-btn-text);
}

.tag-neutral {
    background: rgba(255, 255, 255, 0.18);
    color: var(--color-btn-text);
    opacity: 0.9;
}

.hero-phone {
    display: block;
    margin-top: 10rpx;
    font-size: 26rpx;
    color: var(--color-btn-text);
    opacity: 0.85;
}

.hero-badge {
    display: inline-flex;
    margin-top: 12rpx;
    padding: 4rpx 18rpx;
    font-size: 20rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.16);
    color: var(--color-btn-text);
}

.hero-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 104rpx;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(10rpx);
    flex-shrink: 0;
}

.hero-edit-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-btn-text);
}

/* ===== 企业空态兜底 ===== */
.company-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0 24rpx;
}

.company-empty-icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: var(--color-surface-soft);
    color: var(--color-text-tertiary);
    font-size: 36rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.company-empty-text {
    margin-top: 18rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.company-empty-desc {
    margin-top: 8rpx;
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}

/* ===== 跟进时间线 ===== */
.timeline-item {
    display: flex;
    gap: 20rpx;
}

.timeline-track {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 26rpx;
}

.timeline-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 6rpx var(--color-primary-soft);
    flex-shrink: 0;
}

.timeline-line {
    flex: 1;
    width: 2rpx;
    min-height: 60rpx;
    background: var(--color-border-light);
}

.timeline-item:last-child .timeline-line {
    display: none;
}

.timeline-content {
    flex: 1;
    min-width: 0;
    padding-bottom: 28rpx;
}

.timeline-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding-top: 18rpx;
}

.timeline-type {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-primary);
}

.timeline-time {
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

.timeline-text {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--color-text);
}

.timeline-result {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    line-height: 1.6;
    color: var(--color-text-secondary);
}

.followup-empty {
    padding: 44rpx 0 8rpx;
    text-align: center;
}

.followup-empty-text {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.add-followup {
    margin-top: 20rpx;
    height: 80rpx;
    border-radius: 40rpx;
    border: 1rpx dashed var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-followup-text {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-primary);
}

/* ===== 底部操作栏 ===== */
.page-bottom-space {
    height: 40rpx;
}

.bottom-bar {
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

.bottom-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
}

.bottom-btn.primary {
    background: var(--color-primary);
    color: var(--color-btn-text);
    box-shadow: var(--shadow-glow);
}

.bottom-btn.ghost {
    background: var(--color-surface-soft);
    color: var(--color-primary);
    border: 1rpx solid var(--color-primary);
}
</style>