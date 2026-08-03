<template>
  <view class="version-page">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="header-title">版本历史</text>
      <view class="header-right"></view>
    </view>

    <!-- 版本列表 -->
    <view class="content">
      <view class="version-list">
        <view class="version-item" v-for="v in versions" :key="v.id">
          <view class="version-timeline">
            <view class="timeline-dot"></view>
            <view class="timeline-line"></view>
          </view>
          <view class="version-body" @tap="previewVersion(v)">
            <view class="version-header">
              <text class="version-number">v{{ v.versionNumber }}</text>
              <text class="version-time">{{ formatTime(v.createTime) }}</text>
            </view>
            <text class="version-desc">{{ v.description || '无描述' }}</text>
            <view class="version-actions">
              <view class="version-btn restore-btn" @tap.stop="handleRestore(v)">
                <text class="restore-text">还原</text>
              </view>
              <view class="version-btn" @tap.stop="handlePreview(v)">
                <text class="preview-text">预览</text>
              </view>
            </view>
          </view>
        </view>
        <view class="empty-state" v-if="versions.length === 0 && !loading">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无版本记录</text>
          <text class="empty-hint">每次保存文档都会自动创建版本快照</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getVersionList, restoreVersion } from '@/api/knowledge'

const versions = ref<any[]>([])
const loading = ref(false)
const docId = ref(0)

const loadData = async () => {
  if (!docId.value) return
  loading.value = true
  try {
    const res = await getVersionList(docId.value)
    versions.value = res?.data || res?.records || []
  } catch (e) {
    console.error('加载版本列表失败', e)
  } finally {
    loading.value = false
  }
}

const handleRestore = async (v: any) => {
  uni.showModal({
    title: '还原版本',
    content: `确定要还原到 v${v.versionNumber} 吗？当前内容将被替换。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await restoreVersion(v.id)
          uni.showToast({ title: '已还原', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 500)
        } catch (e) {
          uni.showToast({ title: '还原失败', icon: 'none' })
        }
      }
    }
  })
}

const handlePreview = (v: any) => {
  uni.navigateTo({
    url: `/pages/knowledge/document-view/index?id=${v.documentId}`
  })
}

const previewVersion = (v: any) => {
  handlePreview(v)
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const goBack = () => uni.navigateBack()

onLoad((options) => {
  if (options?.documentId) {
    docId.value = Number(options.documentId)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.version-page {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(96rpx + var(--status-bar-height));
  padding: var(--status-bar-height) 16rpx 0;
  background: var(--color-surface, #fff);
  border-bottom: 1rpx solid var(--color-border-light, #DEE0E3);

  .back-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    &:active { background: var(--color-surface-soft, #F1F5F2); }
    .back-icon { font-size: 48rpx; color: var(--color-text, #1F2329); }
  }

  .header-title { font-size: 34rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .header-right { width: 72rpx; }
}

.content { padding: 32rpx; }

.version-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.version-item {
  display: flex;
  gap: 24rpx;
}

.version-timeline {
  width: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;

  .timeline-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background: var(--color-primary, #25B864);
    margin-top: 16rpx;
    flex-shrink: 0;
  }

  .timeline-line {
    width: 2rpx;
    flex: 1;
    background: var(--color-border-light, #E8E9EB);
    min-height: 40rpx;
  }
}

.version-body {
  flex: 1;
  background: var(--color-surface, #fff);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));

  &:active { opacity: 0.9; }
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;

  .version-number {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--color-primary, #25B864);
  }

  .version-time {
    font-size: 22rpx;
    color: var(--color-text-tertiary, #8F959E);
  }
}

.version-desc {
  font-size: 26rpx;
  color: var(--color-text-secondary, #646A73);
  margin-bottom: 16rpx;
  display: block;
}

.version-actions {
  display: flex;
  gap: 12rpx;
}

.version-btn {
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  font-size: 22rpx;
  font-weight: 500;
  color: var(--color-text-secondary, #646A73);
  &:active { background: var(--color-surface-soft, #F1F5F2); }

  &.restore-btn {
    background: var(--color-primary, #25B864);
    border-color: var(--color-primary, #25B864);
    color: #fff;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;

  .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .empty-text { font-size: 28rpx; font-weight: 600; color: var(--color-text, #1F2329); margin-bottom: 8rpx; }
  .empty-hint { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
}
</style>
