<template>
    <view class="followup-page">
        <!-- hero 渐变页头 -->
        <view class="hero-card">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-main">
                    <text class="hero-title">添加跟进</text>
                    <text class="hero-sub">记录本次沟通内容，规划下次跟进计划</text>
                </view>
            </view>
        </view>

        <!-- 表单主体 -->
        <view class="form-body">
            <!-- 跟进方式 -->
            <view class="form-field">
                <view class="field-label-row">
                    <text class="field-label">跟进方式</text>
                </view>
                <view class="type-chips">
                    <view
                        v-for="t in typeOptions"
                        :key="t"
                        class="type-chip"
                        :class="{ active: type === t }"
                        @tap="type = t"
                    >
                        <text class="type-chip-text">{{ t }}</text>
                    </view>
                </view>
            </view>

            <!-- 跟进内容 -->
            <view class="form-field">
                <view class="field-label-row">
                    <text class="field-label">跟进内容</text>
                    <text class="required-mark">*</text>
                </view>
                <textarea
                    v-model="content"
                    class="field-textarea"
                    placeholder="请输入本次跟进内容（必填）"
                    placeholder-class="field-placeholder"
                    :maxlength="500"
                />
            </view>

            <!-- 跟进结果 -->
            <view class="form-field">
                <view class="field-label-row">
                    <text class="field-label">跟进结果</text>
                </view>
                <textarea
                    v-model="result"
                    class="field-textarea"
                    placeholder="请输入沟通结果、客户意向、异议点等（选填）"
                    placeholder-class="field-placeholder"
                    :maxlength="500"
                />
            </view>

            <!-- 下次跟进时间 -->
            <view class="form-field">
                <view class="field-label-row">
                    <text class="field-label">下次跟进时间</text>
                    <text v-if="nextTimeDate" class="next-time-clear" @tap="clearNextTime">清除</text>
                </view>
                <picker
                    mode="date"
                    :value="nextTimeDate"
                    :start="today"
                    :end="maxDate"
                    @change="onNextTimeChange"
                >
                    <view class="field-select" hover-class="field-select-hover">
                        <text
                            class="field-select-value"
                            :class="{ placeholder: !nextTimeDate }"
                        >{{ nextTimeDate || '不设置（选填）' }}</text>
                        <text class="field-select-arrow">›</text>
                    </view>
                </picker>
            </view>

            <view class="form-bottom-space"></view>
        </view>

        <!-- 底部操作栏（中文按钮） -->
        <view class="form-bottom-bar">
            <view class="form-btn cancel" @tap="goBack">取消</view>
            <view class="form-btn primary" :class="{ disabled: saving }" @tap="submit">
                {{ saving ? '保存中…' : '保存' }}
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { createFollowup } from '@/api/customer'

const router = useRouter()

const customerId = ref(0)

/* ---------- 表单 ---------- */
const typeOptions = ['电话', '微信', '拜访', '邮件', '其他']
const type = ref('电话')
const content = ref('')
const result = ref('')
const nextTime = ref(0)
const nextTimeDate = ref('')

const saving = ref(false)

const pad = (n: number) => String(n).padStart(2, '0')
const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()
const maxDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 3)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

/** picker 返回 yyyy-mm-dd，转当日 00:00:00 的毫秒时间戳（与 PC 端 nextTime 格式一致） */
const onNextTimeChange = (e: any) => {
    const dateStr = String(e?.detail?.value || '')
    if (!dateStr) return
    nextTimeDate.value = dateStr
    const parts = dateStr.split('-').map(Number)
    nextTime.value = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0).getTime()
}

const clearNextTime = () => {
    nextTimeDate.value = ''
    nextTime.value = 0
}

/* ---------- 提交 ---------- */
const submit = async () => {
    if (saving.value) return
    const text = content.value.trim()
    if (!customerId.value) {
        uni.showToast({ title: '客户参数缺失', icon: 'none' })
        return
    }
    if (!text) {
        uni.showToast({ title: '请填写跟进内容', icon: 'none' })
        return
    }

    saving.value = true
    try {
        await createFollowup({
            customerId: customerId.value,
            type: type.value,
            content: text,
            result: result.value.trim() || undefined,
            nextTime: nextTime.value || undefined
        })
        uni.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => router.navigateBack(), 600)
    } catch (error) {
        console.error('保存跟进失败', error)
        uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
        saving.value = false
    }
}

const goBack = () => {
    router.navigateBack()
}

onLoad((options) => {
    customerId.value = Number(options?.customerId || 0)
})
</script>

<style scoped lang="scss">
.followup-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 180rpx;
}

/* ===== hero 页头（参考欢迎语：渐变 + 装饰圆环） ===== */
.hero-card {
    position: relative;
    overflow: hidden;
    padding: 56rpx 40rpx 64rpx;
    background: var(--gradient-primary);

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

.hero-main {
    flex: 1;
    min-width: 0;
}

.hero-title {
    display: block;
    font-size: 42rpx;
    font-weight: 700;
    line-height: 1.25;
    color: var(--color-btn-text);
    margin-bottom: 10rpx;
}

.hero-sub {
    display: block;
    font-size: 24rpx;
    color: var(--color-btn-text);
    opacity: 0.85;
}

/* ===== 表单主体 ===== */
.form-body {
    margin: -28rpx 24rpx 0;
    padding: 8rpx 32rpx 20rpx;
    border-radius: 28rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    position: relative;
    z-index: 2;
}

.form-field {
    padding: 24rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);

    &:last-child {
        border-bottom: none;
    }
}

.field-label-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;
}

.field-label {
    font-size: 26rpx;
    color: var(--color-text-secondary);
}

.required-mark {
    font-size: 26rpx;
    color: var(--color-danger-rgb);
}

/* ===== 跟进方式 chips ===== */
.type-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.type-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 60rpx;
    padding: 0 30rpx;
    border-radius: 30rpx;
    background: var(--color-surface-soft);
    border: 1rpx solid var(--color-border);
    transition: all 0.2s ease;
}

.type-chip-text {
    font-size: 26rpx;
    color: var(--color-text-secondary);
}

.type-chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-glow);

    .type-chip-text {
        color: var(--color-btn-text);
        font-weight: 600;
    }
}

/* ===== 输入区 ===== */
.field-textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx 24rpx;
    box-sizing: border-box;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
    border: 1rpx solid var(--color-border);
    font-size: 28rpx;
    line-height: 1.6;
    color: var(--color-text);
}

.field-placeholder {
    color: var(--color-text-tertiary);
}

.field-select {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 88rpx;
    padding: 0 24rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);
    border: 1rpx solid var(--color-border);

    &-hover {
        background: var(--color-surface-hover);
    }
}

.field-select-value {
    font-size: 28rpx;
    color: var(--color-text);

    &.placeholder {
        color: var(--color-text-tertiary);
    }
}

.field-select-arrow {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
    line-height: 1;
}

.next-time-clear {
    margin-left: auto;
    font-size: 24rpx;
    color: var(--color-primary);
    padding: 4rpx 8rpx;
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

.form-btn.primary.disabled {
    opacity: 0.6;
}
</style>