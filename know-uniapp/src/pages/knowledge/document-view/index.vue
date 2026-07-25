<template>
  <view class="document-view">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">文档详情</text>
      </view>
      <view class="header-right">
        <view class="edit-btn" @tap="goToEdit">
          <text class="edit-icon">✏️</text>
          <text class="edit-text">编辑</text>
        </view>
      </view>
    </view>

    <!-- 文档内容区域 -->
    <view class="article" v-if="doc.id">
      <!-- 标题 -->
      <text class="article-title">{{ doc.title }}</text>
      
      <!-- 元信息 -->
      <view class="article-meta">
        <text class="meta-item">📅 {{ formatDate(doc.createTime) }}</text>
        <text class="meta-item" v-if="doc.viewCount">👀 {{ doc.viewCount }}次浏览</text>
      </view>
      
      <!-- 分割线 -->
      <view class="divider"></view>
      
      <!-- 正文内容 -->
      <view class="article-content">
        <rich-text :nodes="doc.content || ''" />
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-else-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📄</text>
      <text class="empty-text">文档不存在或已删除</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer" v-if="doc.id">
      <view class="footer-left">
        <text class="footer-info">{{ wordCount }}字</text>
      </view>
      <view class="footer-right">
        <view class="footer-btn" @tap="goToEdit">
          <text class="footer-btn-text">编辑文档</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { getDocument } from '@/api/knowledge'

const router = useRouter()

const docId = ref(0)
const doc = ref<any>({})
const loading = ref(true)

const wordCount = computed(() => {
  const text = (doc.value.content || '').replace(/<[^>]+>/g, '').replace(/\s/g, '')
  return text.length
})

const loadData = async () => {
  if (!docId.value) return
  loading.value = true
  try {
    const res = await getDocument(docId.value)
    doc.value = res?.data || res || {}
  } catch (e) {
    console.error('加载文档失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const goToEdit = () => {
  router.navigateTo(`/pages/knowledge/document-edit/index?id=${docId.value}`)
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

onLoad((options) => {
  if (options?.id) {
    docId.value = Number(options.id)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.document-view {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
  padding-bottom: 120rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding: 0 16rpx;
  background: var(--color-surface, rgba(255,255,255,0.95));
  backdrop-filter: blur(24rpx);
  border-bottom: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));

  .header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    min-width: 0;
  }

  .header-right { display: flex; align-items: center; gap: 4rpx; }

  .back-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;

    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .back-icon { font-size: 48rpx; color: var(--color-text, #1F2329); }
  }

  .header-title {
    font-size: 30rpx;
    font-weight: 500;
    color: var(--color-text, #1F2329);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 12rpx 20rpx;
    background: var(--color-primary, #25B864);
    border-radius: 12rpx;

    &:active { opacity: 0.8; }
    .edit-icon { font-size: 28rpx; }
    .edit-text { font-size: 26rpx; color: #fff; font-weight: 500; }
  }
}

.article {
  background: var(--color-surface, #fff);
  margin: 24rpx 24rpx 0;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 8rpx rgba(0,0,0,0.04));
}

.article-title {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-text, #1F2329);
  margin-bottom: 24rpx;
  display: block;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-bottom: 24rpx;

  .meta-item {
    font-size: 24rpx;
    color: var(--color-text-tertiary, #8F959E);
  }
}

.divider {
  height: 1rpx;
  background: var(--color-border-light, #E8E9EB);
  margin-bottom: 32rpx;
}

.article-content {
  font-size: 30rpx;
  line-height: 1.8;
  color: var(--color-text-secondary, #4E5969);
  word-break: break-all;

  :deep(rich-text) {
    display: block;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 12rpx;
    margin: 16rpx 0;
  }

  :deep(p) {
    margin-bottom: 16rpx;
  }

  :deep(pre) {
    background: var(--color-surface-soft, #F5F6F7);
    padding: 24rpx;
    border-radius: 12rpx;
    overflow-x: auto;
    font-size: 26rpx;
    line-height: 1.6;
    margin: 16rpx 0;
  }

  :deep(code) {
    background: var(--color-surface-soft, #F5F6F7);
    padding: 4rpx 8rpx;
    border-radius: 6rpx;
    font-size: 28rpx;
  }

  :deep(blockquote) {
    border-left: 6rpx solid var(--color-primary, #25B864);
    padding-left: 24rpx;
    margin: 16rpx 0;
    color: var(--color-text-tertiary, #8F959E);
  }

  :deep(h1), :deep(h2), :deep(h3) {
    font-weight: 700;
    margin: 32rpx 0 16rpx;
    color: var(--color-text, #1F2329);
  }

  :deep(h1) { font-size: 40rpx; }
  :deep(h2) { font-size: 36rpx; }
  :deep(h3) { font-size: 32rpx; }

  :deep(ul), :deep(ol) {
    padding-left: 40rpx;
    margin: 16rpx 0;
  }

  :deep(li) {
    margin-bottom: 8rpx;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;

  .loading-text {
    font-size: 28rpx;
    color: var(--color-text-tertiary, #8F959E);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;

  .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .empty-text { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 96rpx;
  background: var(--color-surface, rgba(255,255,255,0.95));
  backdrop-filter: blur(24rpx);
  border-top: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  z-index: 100;

  .footer-left {
    .footer-info { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
  }

  .footer-right {
    .footer-btn {
      padding: 16rpx 32rpx;
      background: var(--color-primary, #25B864);
      border-radius: 12rpx;

      &:active { opacity: 0.8; }
      .footer-btn-text { font-size: 28rpx; color: #fff; font-weight: 500; }
    }
  }
}
</style>
