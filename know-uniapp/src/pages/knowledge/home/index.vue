<template>
  <view class="knowledge-home">
    <!-- 顶部导航栏 -->
    <view class="header">
      <text class="logo">知识管理</text>
      <view class="header-actions">
        <view class="header-btn" @tap="handleSearch">
          <text class="iconfont">🔍</text>
        </view>
        <view class="header-btn" @tap="handleNotification">
          <text class="iconfont">🔔</text>
        </view>
        <view class="header-btn" @tap="handleProfile">
          <text class="iconfont">👤</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索知识库、文档..." />
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- Pin区域 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">📌 常用</text>
          <text class="section-more">管理 ›</text>
        </view>
        <view class="kb-list">
          <view class="kb-card" v-for="item in pinnedKBs" :key="item.id" @tap="goToDetail(item.id)">
            <view class="kb-cover" :class="item.coverClass">
              <text class="kb-icon">{{ item.icon || '📚' }}</text>
            </view>
            <view class="kb-body">
              <text class="kb-name">{{ item.name }}</text>
              <text class="kb-desc">{{ item.description }}</text>
              <view class="kb-meta">
                <text class="kb-stats">{{ item.docCount }}篇文档</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 最近小记 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">📝 最近小记</text>
          <text class="section-more" @tap="goToMemo">查看全部 ›</text>
        </view>
        <view class="memo-list">
          <view class="memo-card" v-for="item in recentNotes" :key="item.id" @tap="goToMemo">
            <text class="memo-content">{{ item.content }}</text>
            <view class="memo-footer">
              <text class="memo-time">{{ formatTime(item.createTime) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <PremiumBottomNav active="home" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getKnowledgeBaseList, getQuickNoteList } from '@/api/knowledge'

const router = useRouter()

const pinnedKBs = ref<any[]>([])
const recentNotes = ref<any[]>([])

const loadData = async () => {
  try {
    // 加载知识库列表
    const kbRes = await getKnowledgeBaseList({ pageNum: 1, pageSize: 5 })
    pinnedKBs.value = kbRes?.data?.records || []
    
    // 加载最近小记
    const noteRes = await getQuickNoteList({ pageNum: 1, pageSize: 3 })
    recentNotes.value = noteRes?.data?.records || []
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const goToDetail = (id: number) => {
  router.navigateTo(`/pages/knowledge/detail/index?id=${id}`)
}

const goToMemo = () => {
  uni.switchTab({ url: '/pages/knowledge/memo/index' })
}

const handleSearch = () => {
  router.navigateTo('/pages/search/index')
}

const handleNotification = () => {
  // TODO: 通知页面
}

const handleProfile = () => {
  uni.switchTab({ url: '/pages/user/user' })
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60 * 60 * 1000) return '刚刚'
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

onShow(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.knowledge-home {
  min-height: 100vh;
  background: #F8FAF9;
  padding-bottom: 200rpx;
}

.header {
  background: #fff;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #DEE0E3;
  
  .logo {
    font-size: 36rpx;
    font-weight: 600;
    color: #25B864;
  }
  
  .header-actions {
    display: flex;
    gap: 16rpx;
  }
  
  .header-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    
    &:active {
      background: #F1F5F2;
    }
    
    .iconfont {
      font-size: 40rpx;
    }
  }
}

.search-bar {
  margin: 24rpx 32rpx;
  background: #F1F5F2;
  border-radius: 44rpx;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  
  .search-icon {
    font-size: 36rpx;
    color: #8F959E;
  }
  
  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #1F2329;
  }
}

.content {
  padding: 0 32rpx;
}

.section {
  margin-bottom: 48rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1F2329;
}

.section-more {
  font-size: 28rpx;
  color: #25B864;
}

.kb-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.kb-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  
  &:active {
    opacity: 0.9;
  }
}

.kb-cover {
  width: 100%;
  height: 160rpx;
  background: linear-gradient(135deg, #E8F8EF 0%, #D4F2E1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.tech {
    background: linear-gradient(135deg, #E8F4FD 0%, #D1ECFA 100%);
  }
  
  &.product {
    background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  }
  
  .kb-icon {
    font-size: 64rpx;
  }
}

.kb-body {
  padding: 24rpx 32rpx;
}

.kb-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1F2329;
  margin-bottom: 8rpx;
  display: block;
}

.kb-desc {
  font-size: 26rpx;
  color: #646A73;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  display: block;
}

.kb-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kb-stats {
  font-size: 24rpx;
  color: #8F959E;
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.memo-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  
  &:active {
    opacity: 0.9;
  }
}

.memo-content {
  font-size: 28rpx;
  line-height: 1.6;
  color: #1F2329;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  display: block;
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memo-time {
  font-size: 24rpx;
  color: #8F959E;
}
</style>
