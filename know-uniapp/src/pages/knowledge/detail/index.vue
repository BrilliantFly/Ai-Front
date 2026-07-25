<template>
  <view class="knowledge-detail">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">{{ kbInfo.name || '知识库详情' }}</text>
      </view>
      <view class="header-right">
        <view class="icon-btn" @tap="handleSearch">
          <text class="iconfont">🔍</text>
        </view>
        <view class="icon-btn" @tap="handleMore">
          <text class="iconfont">⋯</text>
        </view>
      </view>
    </view>

    <!-- 封面区域 -->
    <view class="cover" :class="kbInfo.coverClass">
      <text class="cover-icon">{{ kbInfo.icon || '📚' }}</text>
    </view>

    <!-- 知识库信息 -->
    <view class="kb-info">
      <text class="kb-name">{{ kbInfo.name }}</text>
      <text class="kb-desc">{{ kbInfo.description }}</text>
      <view class="kb-meta">
        <text class="kb-meta-item">📄 {{ kbInfo.docCount || 0 }} 篇文档</text>
        <text class="kb-meta-item">📅 {{ formatDate(kbInfo.createTime) }} 创建</text>
      </view>
    </view>

    <!-- 目录区域 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📁 目录</text>
      </view>
      <view class="dir-list">
        <view class="dir-item" v-for="dir in directories" :key="dir.id">
          <view class="dir-row" @tap="toggleDir(dir.id)">
            <text class="dir-arrow" :class="{ expanded: expandedDirs.includes(dir.id) }">›</text>
            <text class="dir-icon">📁</text>
            <text class="dir-name">{{ dir.name }}</text>
            <text class="dir-count">{{ dir.docCount || 0 }} 篇</text>
          </view>
          <view class="dir-children" v-if="expandedDirs.includes(dir.id)">
            <view class="dir-child" v-for="doc in getDocsByDir(dir.id)" :key="doc.id" @tap="goToDocument(doc.id)">
              <text class="child-icon">📄</text>
              <text class="child-name">{{ doc.title }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 文档区域 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📝 文档</text>
      </view>
      <view class="doc-list">
        <view class="doc-item" v-for="doc in documents" :key="doc.id" @tap="goToDocument(doc.id)">
          <view class="doc-icon">📄</view>
          <view class="doc-body">
            <text class="doc-title">{{ doc.title }}</text>
            <text class="doc-sub">{{ formatTime(doc.createTime) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动创建按钮 -->
    <view class="fab" @tap="handleCreateDoc">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { getKnowledgeBase, getDirectoryTree, getDocumentList } from '@/api/knowledge'

const router = useRouter()

const kbId = ref(0)
const kbInfo = ref<any>({})
const directories = ref<any[]>([])
const documents = ref<any[]>([])
const expandedDirs = ref<number[]>([])

const loadData = async () => {
  try {
    // 加载知识库信息
    const kbRes = await getKnowledgeBase(kbId.value)
    kbInfo.value = kbRes?.data || {}
    
    // 加载目录树
    const dirRes = await getDirectoryTree(kbId.value)
    directories.value = dirRes?.data || []
    
    // 加载文档列表
    const docRes = await getDocumentList({ 
      knowledgeBaseId: kbId.value, 
      pageNum: 1, 
      pageSize: 50 
    })
    documents.value = docRes?.data?.records || []
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const goBack = () => {
  uni.navigateBack()
}

const goToDocument = (id: number) => {
  router.navigateTo(`/pages/knowledge/document-edit/index?id=${id}`)
}

const handleCreateDoc = () => {
  router.navigateTo(`/pages/knowledge/document-edit/index?kbId=${kbId.value}`)
}

const handleSearch = () => {
  // TODO: 搜索功能
}

const handleMore = () => {
  // TODO: 更多操作
}

const toggleDir = (dirId: number) => {
  const index = expandedDirs.value.indexOf(dirId)
  if (index > -1) {
    expandedDirs.value.splice(index, 1)
  } else {
    expandedDirs.value.push(dirId)
  }
}

const getDocsByDir = (dirId: number) => {
  return documents.value.filter(doc => doc.directoryId === dirId)
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

onLoad((options) => {
  if (options?.id) {
    kbId.value = Number(options.id)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.knowledge-detail {
  min-height: 100vh;
  background: #F8FAF9;
  padding-bottom: 200rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24rpx);
  padding: 24rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid rgba(0,0,0,0.06);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    min-width: 0;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  
  .back-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    
    &:active {
      background: rgba(0,0,0,0.04);
    }
    
    .back-icon {
      font-size: 48rpx;
      color: #1F2329;
    }
  }
  
  .header-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1F2329;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .icon-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    
    &:active {
      background: rgba(0,0,0,0.04);
    }
    
    .iconfont {
      font-size: 40rpx;
    }
  }
}

.cover {
  width: 100%;
  height: 320rpx;
  background: linear-gradient(135deg, #25B864 0%, #1DA05A 40%, #147A43 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .cover-icon {
    font-size: 120rpx;
  }
}

.kb-info {
  padding: 32rpx;
  background: #fff;
  margin: 0 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  position: relative;
  margin-top: -16rpx;
  
  .kb-name {
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2329;
    margin-bottom: 8rpx;
    display: block;
  }
  
  .kb-desc {
    font-size: 28rpx;
    color: #646A73;
    line-height: 1.5;
    margin-bottom: 24rpx;
    display: block;
  }
  
  .kb-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx 32rpx;
  }
  
  .kb-meta-item {
    font-size: 24rpx;
    color: #8F959E;
  }
}

.section {
  margin: 24rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 32rpx 32rpx 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2329;
}

.dir-list {
  .dir-item {
    border-bottom: 1rpx solid #F1F5F2;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .dir-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    cursor: pointer;
    
    &:active {
      background: #F8FAF9;
    }
  }
  
  .dir-arrow {
    font-size: 28rpx;
    color: #8F959E;
    transition: transform 0.2s;
    transform: rotate(-90deg);
    
    &.expanded {
      transform: rotate(0deg);
    }
  }
  
  .dir-icon {
    font-size: 36rpx;
  }
  
  .dir-name {
    flex: 1;
    font-size: 28rpx;
    font-weight: 500;
    color: #1F2329;
  }
  
  .dir-count {
    font-size: 24rpx;
    color: #8F959E;
  }
  
  .dir-children {
    padding-left: 48rpx;
  }
  
  .dir-child {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 32rpx;
    
    &:active {
      background: #F8FAF9;
    }
    
    .child-icon {
      font-size: 32rpx;
    }
    
    .child-name {
      font-size: 26rpx;
      color: #646A73;
    }
  }
}

.doc-list {
  .doc-item {
    display: flex;
    align-items: center;
    padding: 28rpx 32rpx;
    border-bottom: 1rpx solid #F1F5F2;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background: #F8FAF9;
    }
  }
  
  .doc-icon {
    width: 72rpx;
    height: 72rpx;
    background: #F1F5F2;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    margin-right: 24rpx;
    flex-shrink: 0;
  }
  
  .doc-body {
    flex: 1;
    min-width: 0;
  }
  
  .doc-title {
    font-size: 30rpx;
    font-weight: 500;
    color: #1F2329;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  
  .doc-sub {
    font-size: 24rpx;
    color: #8F959E;
    margin-top: 4rpx;
    display: block;
  }
}

.fab {
  position: fixed;
  bottom: 200rpx;
  right: 40rpx;
  width: 96rpx;
  height: 96rpx;
  background: #25B864;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.4);
  
  &:active {
    transform: scale(0.92);
  }
  
  .fab-icon {
    font-size: 48rpx;
    color: #fff;
    font-weight: 600;
  }
}
</style>
