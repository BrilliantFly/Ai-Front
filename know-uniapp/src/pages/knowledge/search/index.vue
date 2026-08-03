<template>
  <view class="search-page">
    <!-- 顶部搜索栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="search-input-wrap">
        <text class="search-prefix">🔍</text>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="搜索文档、小记..." 
          placeholder-class="ph"
          confirm-type="search"
          @confirm="doSearch"
          focus
        />
        <text v-if="keyword" class="search-clear" @tap="clearKeyword">✕</text>
      </view>
    </view>

    <!-- 搜索历史 (无关键词时) -->
    <view class="history-section" v-if="!keyword && historyList.length > 0">
      <view class="section-header">
        <text class="section-title">搜索历史</text>
        <text class="section-action" @tap="clearHistory">清除</text>
      </view>
      <view class="history-tags">
        <text class="history-tag" v-for="h in historyList" :key="h.id" @tap="selectHistory(h.keyword)">
          {{ h.keyword }}
        </text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="content" v-if="keyword">
      <view class="result-tabs">
        <view class="tab-item" :class="{ active: activeTab === 'all' }" @tap="activeTab = 'all'">
          <text class="tab-text">全部</text>
        </view>
        <view class="tab-item" :class="{ active: activeTab === 'document' }" @tap="activeTab = 'document'">
          <text class="tab-text">文档</text>
        </view>
        <view class="tab-item" :class="{ active: activeTab === 'memo' }" @tap="activeTab = 'memo'">
          <text class="tab-text">小记</text>
        </view>
      </view>

      <view class="result-list" v-if="filteredResults.length > 0">
        <view 
          class="result-item" 
          v-for="item in filteredResults" 
          :key="item.id" 
          @tap="openResult(item)"
        >
          <view class="result-icon">
            <text>{{ item.type === 'document' ? '📄' : '📝' }}</text>
          </view>
          <view class="result-body">
            <text class="result-title">{{ highlightMatch(item.title || item.content) }}</text>
            <text class="result-preview" v-if="item.content">{{ highlightMatch(truncateContent(item.content)) }}</text>
            <text class="result-meta">{{ item.type === 'document' ? '文档' : '小记' }} · {{ formatTime(item.createTime) }}</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="searched && filteredResults.length === 0">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到相关结果</text>
      </view>

      <view class="loading-state" v-if="loading">
        <text class="loading-text">搜索中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { switchTabCompat } from '@/utils/util'
import { searchAll, getSearchHistory, clearSearchHistory } from '@/api/knowledge'

const router = useRouter()

const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const activeTab = ref<'all' | 'document' | 'memo'>('all')
const searchResults = ref<any[]>([])
const historyList = ref<any[]>([])

const filteredResults = computed(() => {
  if (activeTab.value === 'all') return searchResults.value
  return searchResults.value.filter(item => item.type === activeTab.value)
})

const loadHistory = async () => {
  try {
    const res = await getSearchHistory(10)
    historyList.value = res?.data || res?.records || []
  } catch (e) {
    console.error('加载搜索历史失败', e)
  }
}

const doSearch = async () => {
  if (!keyword.value.trim()) return
  searched.value = true
  loading.value = true
  try {
    const res = await searchAll(keyword.value.trim())
    searchResults.value = res?.data || res?.records || []
  } catch (e) {
    console.error('搜索失败', e)
  } finally {
    loading.value = false
  }
}

const clearKeyword = () => {
  keyword.value = ''
  searched.value = false
  searchResults.value = []
}

const selectHistory = (kw: string) => {
  keyword.value = kw
  doSearch()
}

const clearHistory = async () => {
  try {
    await clearSearchHistory()
    historyList.value = []
    uni.showToast({ title: '已清除', icon: 'success' })
  } catch (e) {
    console.error('清除失败', e)
  }
}

const openResult = (item: any) => {
  if (item.type === 'document') {
    router.navigateTo(`/pages/knowledge/document-view/index?id=${item.id}`)
  } else {
    // 对于小记，跳转到memo tab
    switchTabCompat('/pages/knowledge/memo/index')
  }
}

const truncateContent = (text: string) => {
  if (!text) return ''
  return text.replace(/<[^>]+>/g, '').substring(0, 100)
}

const highlightMatch = (text: string) => {
  return text
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

const goBack = () => uni.navigateBack()

onLoad(() => {
  loadHistory()
})
</script>

<style scoped lang="scss">
.search-page {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
}

.header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: calc(16rpx + var(--status-bar-height)) 24rpx 16rpx;
  background: var(--color-surface, #fff);
  border-bottom: 1rpx solid var(--color-border-light, #DEE0E3);

  .back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    &:active { background: var(--color-surface-soft, #F1F5F2); }
    .back-icon { font-size: 48rpx; color: var(--color-text, #1F2329); }
  }

  .search-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    background: var(--color-surface-soft, #F1F5F2);
    border-radius: 36rpx;
    padding: 0 24rpx;
    gap: 12rpx;

    .search-prefix { font-size: 28rpx; }
    .search-input { flex: 1; height: 72rpx; font-size: 28rpx; color: var(--color-text, #1F2329); }
    .search-clear { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); padding: 8rpx; }
  }
}

.ph { color: var(--color-text-tertiary, #C9CDD4); }

.history-section {
  padding: 24rpx 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .section-title { font-size: 28rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .section-action { font-size: 24rpx; color: var(--color-primary, #25B864); }
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.history-tag {
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  background: var(--color-surface, #fff);
  border-radius: 16rpx;
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  color: var(--color-text-secondary, #646A73);

  &:active { background: var(--color-primary-soft, #E8F8EF); }
}

.content {
  padding: 0 32rpx;
}

.result-tabs {
  display: flex;
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding: 12rpx 0;
  background: var(--color-surface-soft, #F1F5F2);
  border-radius: 16rpx;
  margin-top: 16rpx;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12rpx 0;
    border-radius: 12rpx;

    &.active { background: var(--color-surface, #fff); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
    .tab-text { font-size: 26rpx; font-weight: 500; color: var(--color-text, #1F2329); }
  }
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 200rpx;
}

.result-item {
  display: flex;
  gap: 16rpx;
  background: var(--color-surface, #fff);
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));

  &:active { opacity: 0.9; }

  .result-icon { font-size: 40rpx; flex-shrink: 0; }

  .result-body { flex: 1; min-width: 0; }

  .result-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8rpx;
  }

  .result-preview {
    font-size: 24rpx;
    color: var(--color-text-secondary, #646A73);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8rpx;
  }

  .result-meta {
    font-size: 22rpx;
    color: var(--color-text-tertiary, #8F959E);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
  .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .empty-text { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); }
}

.loading-state {
  text-align: center;
  padding: 40rpx 0;
  .loading-text { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
}
</style>
