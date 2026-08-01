<template>
    <view class="snapshots-page">
        <!-- 顶部标题栏：含返回按钮 -->
        <view class="page-header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <view>
                    <text class="page-title">截图记录</text>
                </view>
            </view>
        </view>
        <view class="snapshots-list" v-if="snapshots.length > 0">
            <view
                class="snapshot-item"
                v-for="(item, index) in snapshots"
                :key="item.id"
                @tap="previewSnapshot(item)"
            >
                <image
                    :src="item.thumbnail || item.cloudUrl"
                    mode="aspectFill"
                    class="snapshot-image"
                />
                <view class="snapshot-info">
                    <text class="snapshot-time">{{ formatTime(item.captureTime) }}</text>
                    <text class="snapshot-device">设备: {{ getDeviceName(item.deviceId) }}</text>
                </view>
                <view class="snapshot-actions">
                    <view class="action-btn" @tap.stop="shareSnapshot(item)">📤</view>
                    <view class="action-btn delete" @tap.stop="deleteSnapshot(item)">🗑</view>
                </view>
            </view>
        </view>

        <view class="empty-state" v-else-if="!loading">
            <text class="empty-icon">📷</text>
            <text class="empty-text">暂无截图记录</text>
        </view>

        <page-status :status="loading ? 'loading' : 'normal'" />
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { switchTabCompat } from '@/utils/util'
import {
    getSnapshotPage,
    deleteSnapshot as apiDeleteSnapshot,
    type CameraSnapshot
} from '@/api/camera'

const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack()
    } else {
        switchTabCompat('/pages/index/index')
    }
}

const snapshots = ref<CameraSnapshot[]>([])
const loading = ref(false)
const deviceId = ref<number>(0)

onLoad((query: any) => {
    if (query.deviceId) {
        deviceId.value = parseInt(query.deviceId)
    }
    loadSnapshots()
})

async function loadSnapshots() {
    loading.value = true
    try {
        const result = (await getSnapshotPage({
            deviceId: deviceId.value || undefined,
            pageNum: 1,
            pageSize: 50
        })) as any
        snapshots.value = result.records || []
    } catch (e) {
        console.error('加载截图失败', e)
    } finally {
        loading.value = false
    }
}

function formatTime(timestamp?: number): string {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString()
}

function getDeviceName(deviceId?: number): string {
    return deviceId ? `设备${deviceId}` : '-'
}

function previewSnapshot(item: CameraSnapshot) {
    if (!item.filePath && !item.cloudUrl) return
    uni.previewImage({
        urls: [item.filePath || item.cloudUrl || '']
    })
}

async function deleteSnapshot(item: CameraSnapshot) {
    if (!item.id) return

    uni.showModal({
        title: '确认删除',
        content: '确定要删除这张截图吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await apiDeleteSnapshot(item.id!)
                    snapshots.value = snapshots.value.filter((s) => s.id !== item.id)
                    uni.showToast({ title: '删除成功', icon: 'success' })
                } catch (e) {
                    uni.showToast({ title: '删除失败', icon: 'none' })
                }
            }
        }
    })
}

function shareSnapshot(item: CameraSnapshot) {
    const url = item.cloudUrl || item.filePath
    if (url) {
        uni.share({
            provider: 'weixin',
            imageUrl: url
        })
    }
}
</script>

<style scoped lang="scss">
.snapshots-page {
    min-height: 100vh;
    background: var(--color-bg);
    padding: 24rpx;
}

.snapshots-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;

    .snapshot-item {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        overflow: hidden;

        .snapshot-image {
            width: 100%;
            height: 240rpx;
        }

        .snapshot-info {
            padding: 16rpx;

            .snapshot-time {
                display: block;
                font-size: 24rpx;
                color: var(--color-text);
                margin-bottom: 6rpx;
            }

            .snapshot-device {
                display: block;
                font-size: 22rpx;
                color: var(--color-text-tertiary);
            }
        }

        .snapshot-actions {
            display: flex;
            justify-content: flex-end;
            padding: 0 16rpx 16rpx;
            gap: 16rpx;

            .action-btn {
                width: 56rpx;
                height: 56rpx;
                background: var(--color-surface-soft);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24rpx;

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
    padding: 24rpx 40rpx 16rpx;
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
