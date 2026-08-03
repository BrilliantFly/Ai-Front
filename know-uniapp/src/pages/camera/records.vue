<template>
    <view class="records-page">
        <!-- 顶部标题栏：含返回按钮 -->
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <view>
                    <text class="page-title">录像记录</text>
                </view>
            </view>
        </view>
        <view class="records-list" v-if="records.length > 0">
            <view
                class="record-item"
                v-for="item in records"
                :key="item.id"
                @tap="playRecord(item)"
            >
                <view class="record-icon">🎬</view>
                <view class="record-info">
                    <text class="record-name">{{ formatRecordName(item) }}</text>
                    <text class="record-time">{{ formatTime(item.startTime) }}</text>
                    <text class="record-duration">{{ formatDuration(item.duration) }}</text>
                </view>
                <view class="record-actions">
                    <view class="action-btn play" @tap.stop="playRecord(item)">▶️</view>
                    <view class="action-btn download" @tap.stop="downloadRecord(item)">📥</view>
                    <view class="action-btn delete" @tap.stop="deleteRecord(item)">🗑</view>
                </view>
            </view>
        </view>

        <view class="empty-state" v-else-if="!loading">
            <text class="empty-icon">🎬</text>
            <text class="empty-text">暂无录像记录</text>
        </view>

        <page-status :status="loading ? 'loading' : 'normal'" />
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { switchTabCompat } from '@/utils/util'
import {
    getRecordPage,
    deleteRecord as apiDeleteRecord,
    type CameraRecord,
    RecordType
} from '@/api/camera'

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack()
    } else {
        switchTabCompat('/pages/index/index')
    }
}

const records = ref<CameraRecord[]>([])
const loading = ref(false)
const deviceId = ref<number>(0)

onLoad((query: any) => {
    if (query.deviceId) {
        deviceId.value = parseInt(query.deviceId)
    }
    loadRecords()
})

async function loadRecords() {
    loading.value = true
    try {
        const result = (await getRecordPage({
            deviceId: deviceId.value || undefined,
            pageNum: 1,
            pageSize: 50
        })) as any
        records.value = result.records || []
    } catch (e) {
        console.error('加载录像失败', e)
    } finally {
        loading.value = false
    }
}

function formatRecordName(item: CameraRecord): string {
    const typeMap: Record<number, string> = {
        [RecordType.Manual]: '手动录制',
        [RecordType.Timed]: '定时���制',
        [RecordType.Motion]: '移动侦测'
    }
    return typeMap[item.recordType || 1] || '录像'
}

function formatTime(timestamp?: number): string {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString()
}

function formatDuration(seconds?: number): string {
    if (!seconds) return '0秒'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}小时${m}分`
    if (m > 0) return `${m}分${s}秒`
    return `${s}秒`
}

function playRecord(item: CameraRecord) {
    if (!item.filePath) {
        uni.showToast({ title: '文件路径不存在', icon: 'none' })
        return
    }
    uni.navigateTo({
        url: `/pages/camera/player?id=${item.deviceId}&record=${item.id}`
    })
}

async function downloadRecord(item: CameraRecord) {
    // 后端无真实录像文件，待流媒体服务器生成后再提供下载
    uni.showToast({ title: '录像文件待流媒体服务器生成', icon: 'none' })
}

async function deleteRecord(item: CameraRecord) {
    if (!item.id) return

    uni.showModal({
        title: '确认删除',
        content: '确定要删除这条录像吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await apiDeleteRecord(item.id!)
                    records.value = records.value.filter((r) => r.id !== item.id)
                    uni.showToast({ title: '删除成功', icon: 'success' })
                } catch (e) {
                    uni.showToast({ title: '删除失败', icon: 'none' })
                }
            }
        }
    })
}
</script>

<style scoped lang="scss">
.records-page {
    min-height: 100vh;
    background: var(--color-bg);
    padding: 24rpx;
}

.records-list {
    .record-item {
        display: flex;
        align-items: center;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        padding: 24rpx;
        margin-bottom: 24rpx;

        .record-icon {
            width: 80rpx;
            height: 80rpx;
            background: var(--color-primary-mist);
            border-radius: 12rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36rpx;
            margin-right: 20rpx;
        }

        .record-info {
            flex: 1;

            .record-name {
                display: block;
                font-size: 28rpx;
                color: var(--color-text);
                margin-bottom: 8rpx;
            }

            .record-time {
                display: block;
                font-size: 24rpx;
                color: var(--color-text-tertiary);
                margin-bottom: 6rpx;
            }

            .record-duration {
                display: block;
                font-size: 24rpx;
                color: var(--color-primary);
            }
        }

        .record-actions {
            display: flex;
            gap: 12rpx;

            .action-btn {
                width: 56rpx;
                height: 56rpx;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24rpx;

                &.play {
                    background: var(--color-primary-mist);
                }
                &.download {
                    background: var(--color-success-soft);
                }
                &.delete {
                    background: var(--color-danger-soft);
                }
            }
        }
    }
}

.empty-state {
    padding: 120rpx 0;
    text-align: center;

    .empty-icon {
        display: block;
        font-size: 100rpx;
        margin-bottom: 30rpx;
    }

    .empty-text {
        font-size: 28rpx;
        color: #999;
    }
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
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.2;
}

.page-subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: var(--color-text-secondary);
}
</style>
