<template>
  <view class="knowledge-list">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">我的知识库</text>
      </view>
      <view class="create-btn" @tap="handleCreate">
        <text class="create-icon">+</text>
        <text class="create-text">新建</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索知识库..." v-model="searchKeyword" @input="handleSearch" />
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="kb-list">
        <view class="kb-card" v-for="item in kbList" :key="item.id" @tap="goToDetail(item.id)">
          <view class="kb-cover" :class="item.coverClass">
            <text class="kb-icon">{{ item.icon || '📚' }}</text>
          </view>
          <view class="kb-body">
            <text class="kb-name">{{ item.name }}</text>
            <text class="kb-desc">{{ item.description }}</text>
            <view class="kb-meta">
              <text class="kb-stats">{{ item.docCount }}篇文档</text>
              <text class="kb-visibility">{{ item.visibility === 'public' ? '公开' : '私密' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="kbList.length === 0 && !loading">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无知识库</text>
        <text class="empty-hint">点击右上角"新建"创建第一个知识库</text>
      </view>
    </view>

    <PremiumBottomNav active="knowledge" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getKnowledgeBaseList } from '@/api/knowledge'

const router = useRouter()

const kbList = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeBaseList({ 
      pageNum: 1, 
      pageSize: 20,
      name: searchKeyword.value || undefined
    })
    kbList.value = res?.data?.records || []
  } catch (e) {
    console.error('加载知识库列表失败', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const goToDetail = (id: number) => {
  router.navigateTo(`/pages/knowledge/detail/index?id=${id}`)
}

const handleCreate = () => {
  // TODO: 打开创建知识库弹窗
  uni.showToast({ title: '创建知识库', icon: 'none' })
}

const handleSearch = () => {
  loadData()
}

onShow(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.knowledge-list {
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
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
  }
  
  .back-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    
    &:active {
      background: #F1F5F2;
    }
    
    .back-icon {
      font-size: 48rpx;
      color: #1F2329;
    }
  }
  
  .header-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1F2329;
  }
  
  .create-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: #25B864;
    color: #fff;
    padding: 16rpx 32rpx;
    border-radius: 16rpx;
    
    &:active {
      opacity: 0.9;
    }
    
    .create-icon {
      font-size: 32rpx;
      font-weight: 600;
    }
    
    .create-text {
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.search-bar {
  margin: 24rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  
  .search-icon {
    font-size: 32rpx;
    color: #C9CDD4;
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
  height: 200rpx;
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
  
  &.note {
    background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
  }
  
  &.project {
    background: linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%);
  }
  
  .kb-icon {
    font-size: 80rpx;
  }
}

.kb-body {
  padding: 28rpx 32rpx;
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
  margin-bottom: 20rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  display: block;
  line-height: 1.5;
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

.kb-visibility {
  font-size: 22rpx;
  color: #25B864;
  background: #E8F8EF;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 32rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #1F2329;
    margin-bottom: 16rpx;
  }
  
  .empty-hint {
    font-size: 26rpx;
    color: #8F959E;
  }
}
</style>
