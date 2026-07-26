<template>
  <view class="document-view">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">{{ doc.title || '文档详情' }}</text>
      </view>
      <view class="header-right">
        <view class="history-btn" @tap="goToVersionHistory">
          <text class="history-icon">📋</text>
        </view>
        <view class="edit-btn" @tap="goToEdit">
          <text class="edit-icon">✏️</text>
        </view>
        <view class="share-btn" @tap="handleShare">
          <text class="share-icon">↗</text>
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
        <text class="meta-item" v-if="doc.version">v{{ doc.version }}</text>
      </view>
      
      <!-- 标签 -->
      <view class="article-tags" v-if="doc.tags">
        <text class="tag-chip" v-for="tag in parseTags(doc.tags)" :key="tag">{{ tag }}</text>
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

    <!-- 评论区域 -->
    <view class="comment-section" v-if="doc.id">
      <view class="section-header">
        <text class="section-title">💬 评论 ({{ comments.length }})</text>
      </view>
      
      <!-- 评论输入框 -->
      <view class="comment-input-bar">
        <input 
          class="comment-input" 
          v-model="newComment" 
          placeholder="写下你的评论..." 
          placeholder-class="field-placeholder"
          @confirm="submitComment"
        />
        <view class="comment-send" @tap="submitComment" :class="{ disabled: !newComment.trim() }">
          <text class="send-text">发送</text>
        </view>
      </view>
      
      <!-- 评论列表 -->
      <view class="comment-list">
        <view class="comment-item" v-for="c in comments" :key="c.id">
          <view class="comment-avatar">
            <text class="avatar-text">{{ (c.userName || '匿名').charAt(0) }}</text>
          </view>
          <view class="comment-body">
            <view class="comment-header">
              <text class="comment-user">{{ c.userName || '匿名' }}</text>
              <text class="comment-time">{{ formatTime(c.createTime) }}</text>
            </view>
            <text class="comment-content">{{ c.content }}</text>
          </view>
        </view>
        <view class="empty-comment" v-if="comments.length === 0">
          <text class="empty-hint">暂无评论，来发表第一条评论吧</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer" v-if="doc.id">
      <view class="footer-left">
        <view class="footer-action" @tap="toggleLikeHandler">
          <text class="footer-action-icon">{{ doc.isLiked ? '❤️' : '🤍' }}</text>
          <text class="footer-action-text" :class="{ active: doc.isLiked }">{{ doc.likeCount || 0 }}</text>
        </view>
        <view class="footer-action" @tap="toggleFavoriteHandler">
          <text class="footer-action-icon">{{ doc.isFavorited ? '⭐' : '☆' }}</text>
          <text class="footer-action-text" :class="{ active: doc.isFavorited }">{{ doc.favoriteCount || 0 }}</text>
        </view>
        <view class="footer-action" @tap="scrollToComments">
          <text class="footer-action-icon">💬</text>
          <text class="footer-action-text">{{ doc.commentCount || 0 }}</text>
        </view>
      </view>
      <view class="footer-right">
        <text class="footer-info">{{ wordCount }}字</text>
        <view class="footer-edit-btn" @tap="goToEdit">
          <text class="footer-edit-text">编辑</text>
        </view>
      </view>
    </view>

    <!-- 分享弹窗 -->
    <view class="modal-overlay" :class="{ active: showShareModal }" @tap="closeShareModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">分享文档</text>
        <view class="share-options">
          <view class="share-option" @tap="copyShareLink">
            <text class="share-opt-icon">🔗</text>
            <text class="share-opt-text">复制链接</text>
          </view>
          <view class="share-option" @tap="generateShareToken">
            <text class="share-opt-icon">📤</text>
            <text class="share-opt-text">生成分享令牌</text>
          </view>
        </view>
        <view class="share-result" v-if="shareLink">
          <text class="share-link-text">{{ shareLink }}</text>
          <view class="share-copy-btn" @tap="copyShareLink">
            <text class="share-copy-text">复制</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { 
  getDocument, 
  getCommentList, 
  addComment, 
  toggleLike, 
  toggleFavorite, 
  createShare, 
  getLikeStatus, 
  getFavoriteStatus 
} from '@/api/knowledge'

const router = useRouter()

const docId = ref(0)
const doc = ref<any>({})
const loading = ref(true)
const comments = ref<any[]>([])
const newComment = ref('')
const showShareModal = ref(false)
const shareLink = ref('')

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
    
    // 加载评论
    loadComments()
    
    // 检查点赞/收藏状态
    checkInteractions()
  } catch (e) {
    console.error('加载文档失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  try {
    const res = await getCommentList({ documentId: docId.value, pageNum: 1, pageSize: 50 })
    comments.value = res?.data?.records || res?.records || []
  } catch (e) {
    console.error('加载评论失败', e)
  }
}

const checkInteractions = async () => {
  try {
    const likeRes = await getLikeStatus(docId.value)
    doc.value.isLiked = likeRes?.data || false
    
    const favRes = await getFavoriteStatus(docId.value)
    doc.value.isFavorited = favRes?.data || false
  } catch (e) {
    // 静默失败
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  try {
    await addComment({ documentId: docId.value, content: newComment.value.trim() })
    uni.showToast({ title: '评论成功', icon: 'success' })
    newComment.value = ''
    loadComments()
    // 更新评论计数
    doc.value.commentCount = (doc.value.commentCount || 0) + 1
  } catch (e) {
    uni.showToast({ title: '评论失败', icon: 'none' })
  }
}

const toggleLikeHandler = async () => {
  try {
    const res = await toggleLike(docId.value)
    if (res?.data) {
      doc.value.isLiked = true
      doc.value.likeCount = (doc.value.likeCount || 0) + 1
    } else {
      doc.value.isLiked = false
      doc.value.likeCount = Math.max(0, (doc.value.likeCount || 0) - 1)
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const toggleFavoriteHandler = async () => {
  try {
    const res = await toggleFavorite(docId.value)
    if (res?.data) {
      doc.value.isFavorited = true
      doc.value.favoriteCount = (doc.value.favoriteCount || 0) + 1
    } else {
      doc.value.isFavorited = false
      doc.value.favoriteCount = Math.max(0, (doc.value.favoriteCount || 0) - 1)
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleShare = () => {
  showShareModal.value = true
  shareLink.value = ''
}

const closeShareModal = () => {
  showShareModal.value = false
}

const generateShareToken = async () => {
  try {
    const res = await createShare({ documentId: docId.value, expireDays: 7 })
    if (res?.data) {
      shareLink.value = `https://know.example.com/share/${res.data}`
      uni.showToast({ title: '分享链接已生成', icon: 'success' })
    }
  } catch (e) {
    uni.showToast({ title: '生成失败', icon: 'none' })
  }
}

const copyShareLink = () => {
  if (!shareLink.value) {
    generateShareToken()
    return
  }
  uni.setClipboardData({
    data: shareLink.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' })
  })
}

const scrollToComments = () => {
  uni.pageScrollTo({ selector: '.comment-section', duration: 300 })
}

const goBack = () => {
  uni.navigateBack()
}

const goToEdit = () => {
  router.navigateTo(`/pages/knowledge/document-edit/index?id=${docId.value}`)
}

const goToVersionHistory = () => {
  router.navigateTo(`/pages/knowledge/version-history/index?documentId=${docId.value}`)
}

const parseTags = (tags: string) => {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

const formatDate = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
    docId.value = Number(options.id)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.document-view {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
  padding-bottom: 140rpx;
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

  .header-right { display: flex; align-items: center; gap: 8rpx; }

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

  .edit-btn, .share-btn, .history-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;

    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .edit-icon, .share-icon { font-size: 32rpx; }
  }

  .share-btn { background: var(--color-primary, #25B864); border-radius: 12rpx; }
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
  margin-bottom: 16rpx;

  .meta-item {
    font-size: 24rpx;
    color: var(--color-text-tertiary, #8F959E);
  }
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.tag-chip {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
  background: var(--color-primary-soft, #E8F8EF);
  color: var(--color-primary, #25B864);
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

  :deep(rich-text) { display: block; }
  :deep(img) { max-width: 100%; height: auto; border-radius: 12rpx; margin: 16rpx 0; }
  :deep(p) { margin-bottom: 16rpx; }
  :deep(pre) { background: var(--color-surface-soft, #F5F6F7); padding: 24rpx; border-radius: 12rpx; overflow-x: auto; font-size: 26rpx; line-height: 1.6; margin: 16rpx 0; }
  :deep(code) { background: var(--color-surface-soft, #F5F6F7); padding: 4rpx 8rpx; border-radius: 6rpx; font-size: 28rpx; }
  :deep(blockquote) { border-left: 6rpx solid var(--color-primary, #25B864); padding-left: 24rpx; margin: 16rpx 0; color: var(--color-text-tertiary, #8F959E); }
  :deep(h1), :deep(h2), :deep(h3) { font-weight: 700; margin: 32rpx 0 16rpx; color: var(--color-text, #1F2329); }
  :deep(h1) { font-size: 40rpx; }
  :deep(h2) { font-size: 36rpx; }
  :deep(h3) { font-size: 32rpx; }
  :deep(ul), :deep(ol) { padding-left: 40rpx; margin: 16rpx 0; }
  :deep(li) { margin-bottom: 8rpx; }
}

/* ===== 评论区域 ===== */
.comment-section {
  background: var(--color-surface, #fff);
  margin: 24rpx;
  border-radius: 24rpx;
  padding: 24rpx 32rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 8rpx rgba(0,0,0,0.04));
}

.section-header {
  margin-bottom: 20rpx;
  .section-title { font-size: 30rpx; font-weight: 600; color: var(--color-text, #1F2329); }
}

.comment-input-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
  align-items: center;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  background: var(--color-surface-soft, #F5F6F7);
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: var(--color-text, #1F2329);
}

.comment-send {
  padding: 16rpx 24rpx;
  background: var(--color-primary, #25B864);
  border-radius: 20rpx;
  flex-shrink: 0;
  
  &.disabled { opacity: 0.4; }
  &:active { opacity: 0.8; }
  .send-text { font-size: 26rpx; color: #fff; font-weight: 500; }
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.comment-item {
  display: flex;
  gap: 16rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F2);
  &:last-child { border-bottom: none; padding-bottom: 0; }
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--color-primary-soft, #E8F8EF);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .avatar-text { font-size: 28rpx; color: var(--color-primary, #25B864); font-weight: 600; }
}

.comment-body { flex: 1; min-width: 0; }

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
  .comment-user { font-size: 26rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .comment-time { font-size: 22rpx; color: var(--color-text-tertiary, #8F959E); }
}

.comment-content {
  font-size: 28rpx;
  line-height: 1.5;
  color: var(--color-text-secondary, #4E5969);
  word-break: break-all;
}

.empty-comment {
  padding: 32rpx 0;
  text-align: center;
  .empty-hint { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
}

/* ===== 底部操作栏 ===== */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 108rpx;
  background: var(--color-surface, rgba(255,255,255,0.95));
  backdrop-filter: blur(24rpx);
  border-top: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  z-index: 100;

  .footer-left {
    display: flex;
    gap: 32rpx;
  }

  .footer-action {
    display: flex;
    align-items: center;
    gap: 6rpx;
    &:active { opacity: 0.7; }
    .footer-action-icon { font-size: 36rpx; }
    .footer-action-text { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); &.active { color: var(--color-primary, #25B864); } }
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .footer-info { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
  }

  .footer-edit-btn {
    padding: 12rpx 24rpx;
    background: var(--color-primary, #25B864);
    border-radius: 12rpx;
    &:active { opacity: 0.8; }
    .footer-edit-text { font-size: 26rpx; color: #fff; font-weight: 500; }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  .loading-text { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); }
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

/* ===== 分享弹窗 ===== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: none;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  &.active { display: flex; }
}

.modal {
  background: var(--color-surface, #fff);
  width: 100%;
  max-width: 750rpx;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 32rpx 48rpx;
  max-height: 50vh;
}

.modal-handle {
  width: 64rpx;
  height: 8rpx;
  background: var(--color-border, #E8E9EB);
  border-radius: 4rpx;
  margin: 0 auto 24rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-text, #1F2329);
  display: block;
  margin-bottom: 32rpx;
  text-align: center;
}

.share-options {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.share-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 16rpx;
  background: var(--color-surface-soft, #F8FAF9);
  border-radius: 20rpx;
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  
  &:active { background: var(--color-primary-soft, #E8F8EF); }
  .share-opt-icon { font-size: 48rpx; }
  .share-opt-text { font-size: 24rpx; color: var(--color-text, #1F2329); font-weight: 500; }
}

.share-result {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--color-surface-soft, #F5F6F7);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.share-link-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-text-secondary, #646A73);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-copy-btn {
  padding: 8rpx 20rpx;
  background: var(--color-primary, #25B864);
  border-radius: 8rpx;
  flex-shrink: 0;
  .share-copy-text { font-size: 24rpx; color: #fff; }
}

.field-placeholder { color: var(--color-text-tertiary, #C9CDD4); }
</style>
