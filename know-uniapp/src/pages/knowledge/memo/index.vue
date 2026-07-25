<template>
  <view class="memo-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <text class="header-title">小记</text>
      <view class="header-btn" @tap="openModal">
        <text class="iconfont">+</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索小记..." v-model="searchKeyword" @input="handleSearch" />
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="memo-list">
        <view class="memo-card" v-for="item in memoList" :key="item.id">
          <view class="memo-tags" v-if="item.tags">
            <text class="memo-tag" v-for="tag in parseTags(item.tags)" :key="tag">{{ tag }}</text>
          </view>
          <text class="memo-text">{{ item.content }}</text>
          <view class="memo-footer">
            <text class="memo-time">{{ formatTime(item.createTime) }}</text>
            <view class="memo-actions">
              <view class="memo-action" @tap="handleEdit(item)">
                <text class="action-icon">✏️</text>
              </view>
              <view class="memo-action" @tap="handleDelete(item.id)">
                <text class="action-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="memoList.length === 0 && !loading">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无小记</text>
        <text class="empty-hint">点击右下角按钮创建第一条小记</text>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="fab" @tap="openModal">
      <text class="fab-icon">+</text>
    </view>

    <!-- 新建小记弹窗 -->
    <view class="modal-overlay" :class="{ active: showModal }" @tap="closeModal">
      <view class="modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">新建小记</text>
          <view class="modal-close" @tap="closeModal">
            <text class="close-icon">×</text>
          </view>
        </view>
        <textarea class="modal-textarea" v-model="newContent" placeholder="记录你的想法..." :maxlength="5000" />
        <view class="modal-footer">
          <view class="modal-tools">
            <view class="modal-tool" @tap="insertImage">
              <text class="tool-icon">🖼️</text>
            </view>
            <view class="modal-tool" @tap="insertLink">
              <text class="tool-icon">🔗</text>
            </view>
            <view class="modal-tool" @tap="insertCode">
              <text class="tool-icon">&lt;/&gt;</text>
            </view>
          </view>
          <view class="modal-btn" @tap="handlePublish">发布</view>
        </view>
      </view>
    </view>

    <PremiumBottomNav active="article" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getQuickNoteList, addQuickNote, deleteQuickNote } from '@/api/knowledge'

const router = useRouter()

const memoList = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const newContent = ref('')
const editingId = ref(0)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getQuickNoteList({ 
      pageNum: 1, 
      pageSize: 50,
      content: searchKeyword.value || undefined
    })
    memoList.value = res?.data?.records || []
  } catch (e) {
    console.error('加载小记列表失败', e)
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  showModal.value = true
  newContent.value = ''
  editingId.value = 0
}

const closeModal = () => {
  showModal.value = false
  newContent.value = ''
  editingId.value = 0
}

const handlePublish = async () => {
  if (!newContent.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  
  try {
    await addQuickNote({ content: newContent.value })
    uni.showToast({ title: '发布成功', icon: 'success' })
    closeModal()
    loadData()
  } catch (e) {
    console.error('发布失败', e)
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
}

const handleEdit = (item: any) => {
  editingId.value = item.id
  newContent.value = item.content
  showModal.value = true
}

const handleDelete = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条小记吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteQuickNote(id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          loadData()
        } catch (e) {
          console.error('删除失败', e)
        }
      }
    }
  })
}

const handleSearch = () => {
  loadData()
}

const parseTags = (tags: string) => {
  if (!tags) return []
  return tags.split(',').filter(t => t.trim())
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

const insertImage = () => {
  // TODO: 插入图片
}

const insertLink = () => {
  // TODO: 插入链接
}

const insertCode = () => {
  // TODO: 插入代码
}

onShow(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.memo-page {
  min-height: 100vh;
  background: #F8FAF9;
  padding-bottom: 200rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding: 0 32rpx;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(24rpx);
  border-bottom: 1rpx solid rgba(0,0,0,0.06);
  
  .header-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1F2329;
  }
  
  .header-btn {
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
      font-size: 44rpx;
      color: #1F2329;
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

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.memo-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  
  &:active {
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  }
}

.memo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.memo-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
  background: #E8F8EF;
  color: #25B864;
}

.memo-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: #1F2329;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.memo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.memo-time {
  font-size: 24rpx;
  color: #8F959E;
}

.memo-actions {
  display: flex;
  gap: 8rpx;
}

.memo-action {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  
  &:active {
    background: rgba(0,0,0,0.04);
  }
  
  .action-icon {
    font-size: 32rpx;
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
  z-index: 90;
  
  &:active {
    transform: scale(0.92);
  }
  
  .fab-icon {
    font-size: 48rpx;
    color: #fff;
    font-weight: 600;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: none;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  
  &.active {
    display: flex;
  }
}

.modal {
  background: #fff;
  width: 100%;
  max-width: 750rpx;
  border-radius: 32rpx 32rpx 0 0;
  padding: 48rpx 32rpx;
  max-height: 70vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
}

.modal-close {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  
  &:active {
    background: rgba(0,0,0,0.04);
  }
  
  .close-icon {
    font-size: 40rpx;
    color: #1F2329;
  }
}

.modal-textarea {
  width: 100%;
  min-height: 360rpx;
  border: 1rpx solid #E8E9EB;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 30rpx;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
  outline: none;
  color: #1F2329;
  
  &:focus {
    border-color: #25B864;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}

.modal-tools {
  display: flex;
  gap: 8rpx;
}

.modal-tool {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  
  &:active {
    background: rgba(0,0,0,0.04);
  }
  
  .tool-icon {
    font-size: 36rpx;
    color: #646A73;
  }
}

.modal-btn {
  background: #25B864;
  color: #fff;
  border: none;
  padding: 20rpx 48rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
  
  &:active {
    opacity: 0.85;
  }
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
