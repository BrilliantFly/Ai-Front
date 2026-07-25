<template>
  <view class="memo-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <text class="header-title">小记</text>
      <view class="header-btn" @tap="openCreateModal">
        <text class="plus-icon">+</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索小记..." placeholder-class="field-placeholder" v-model="searchKeyword" @input="handleSearch" />
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="memo-list">
        <view class="memo-card" v-for="item in memoList" :key="item.id" @longpress="showCardActions(item)">
          <view class="memo-tags" v-if="item.tags">
            <text class="memo-tag" v-for="tag in parseTags(item.tags)" :key="tag">{{ tag }}</text>
          </view>
          <text class="memo-text">{{ item.content }}</text>
          <view class="memo-footer">
            <text class="memo-time">{{ formatTime(item.createTime) }}</text>
            <view class="memo-actions">
              <view class="memo-action" @tap.stop="openEditModal(item)">
                <text class="action-icon">✏️</text>
              </view>
              <view class="memo-action" @tap.stop="confirmDelete(item.id)">
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
    <view class="fab" @tap="openCreateModal">
      <text class="fab-icon">+</text>
    </view>

    <!-- 新建/编辑小记弹窗 -->
    <view class="modal-overlay" :class="{ active: showModal }" @tap="closeModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">{{ editingId ? '编辑小记' : '新建小记' }}</text>

        <view class="form-card">
          <view class="fgs-full">
            <text class="fg-label">📝 内容 <text class="required">*</text></text>
            <view class="fg-input-wrap">
              <textarea
                v-model="newContent"
                class="fg-textarea"
                placeholder="记录你的想法..."
                placeholder-class="field-placeholder"
                :maxlength="5000"
              />
            </view>
            <text class="char-count">{{ newContent.length }}/5000</text>
          </view>

          <view class="fgs-full">
            <text class="fg-label">🏷️ 标签</text>
            <view class="fg-input-wrap">
              <input
                v-model="newTags"
                class="fg-input"
                placeholder="多个标签用逗号分隔，如：工作,灵感"
                placeholder-class="field-placeholder"
              />
            </view>
            <view class="tag-preview" v-if="newTags">
              <text class="tag-chip" v-for="tag in parseTags(newTags)" :key="tag">{{ tag }}</text>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-secondary" @tap="closeModal">取消</view>
          <view class="btn-primary" @tap="handlePublish">
            <text class="btn-text">{{ submitting ? '发布中...' : (editingId ? '更新' : '发布') }}</text>
          </view>
        </view>
      </view>
    </view>

    <PremiumBottomNav active="article" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getQuickNoteList, addQuickNote, updateQuickNote, deleteQuickNote } from '@/api/knowledge'

const memoList = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const newContent = ref('')
const newTags = ref('')
const editingId = ref(0)
const submitting = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getQuickNoteList({
      pageNum: 1,
      pageSize: 50,
      content: searchKeyword.value || undefined
    })
    memoList.value = res?.records || res?.data?.records || []
  } catch (e) {
    console.error('加载小记列表失败', e)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingId.value = 0
  newContent.value = ''
  newTags.value = ''
  showModal.value = true
}

const openEditModal = (item: any) => {
  editingId.value = item.id
  newContent.value = item.content || ''
  newTags.value = item.tags || ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = 0
  newContent.value = ''
  newTags.value = ''
}

const handlePublish = async () => {
  if (submitting.value) return
  if (!newContent.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const payload = { content: newContent.value.trim(), tags: newTags.value.trim() }
    if (editingId.value > 0) {
      await updateQuickNote({ id: editingId.value, ...payload })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      await addQuickNote(payload)
      uni.showToast({ title: '发布成功', icon: 'success' })
    }
    closeModal()
    loadData()
  } catch (e) {
    console.error('操作失败', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const showCardActions = (item: any) => {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: (res) => {
      if (res.tapIndex === 0) {
        openEditModal(item)
      } else if (res.tapIndex === 1) {
        confirmDelete(item.id)
      }
    }
  })
}

const confirmDelete = (id: number) => {
  uni.showModal({
    title: '删除小记',
    content: '确定要删除这条小记吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteQuickNote(id)
          uni.showToast({ title: '已删除', icon: 'success' })
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
  return tags.split(',').map(t => t.trim()).filter(t => t)
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
.memo-page {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
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
  background: var(--color-surface, rgba(255,255,255,0.92));
  backdrop-filter: blur(24rpx);
  border-bottom: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));

  .header-title {
    font-size: 34rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
  }

  .header-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;

    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }

    .plus-icon {
      font-size: 44rpx;
      color: var(--color-text, #1F2329);
      font-weight: 300;
    }
  }
}

.search-bar {
  margin: 24rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--color-surface, #fff);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));

  .search-icon { font-size: 32rpx; color: var(--color-text-tertiary, #C9CDD4); }
  .search-input { flex: 1; font-size: 28rpx; color: var(--color-text, #1F2329); }
}

.content { padding: 0 32rpx; }

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.memo-card {
  background: var(--color-surface, #fff);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));
  border: 1rpx solid var(--color-border-light, transparent);

  &:active { box-shadow: var(--shadow-md, 0 4rpx 16rpx rgba(0,0,0,0.08)); }
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
  background: var(--color-primary-soft, #E8F8EF);
  color: var(--color-primary, #25B864);
}

.memo-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: var(--color-text, #1F2329);
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

.memo-time { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }

.memo-actions { display: flex; gap: 8rpx; }

.memo-action {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;

  &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
  .action-icon { font-size: 32rpx; }
}

.fab {
  position: fixed;
  bottom: 200rpx;
  right: 40rpx;
  width: 96rpx;
  height: 96rpx;
  background: var(--color-primary, #25B864);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.4);
  z-index: 90;

  &:active { transform: scale(0.92); }
  .fab-icon { font-size: 48rpx; color: var(--color-btn-text, #fff); font-weight: 600; }
}

/* ===== 弹窗 (打卡表单风格) ===== */
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
  max-height: 80vh;
  overflow-y: auto;
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

.form-card {
  background: var(--color-surface-soft, #F8FAF9);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  margin-bottom: 32rpx;
}

.fgs-full {
  margin-bottom: 28rpx;
  &:last-child { margin-bottom: 0; }
}

.fg-label {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text, #1F2329);
  margin-bottom: 12rpx;
  display: block;
}

.required { color: #ef4444; }

.fg-input-wrap {
  background: var(--color-surface, #fff);
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  border-radius: 18rpx;
  padding: 0 24rpx;

  &:focus-within { border-color: var(--color-primary, #25B864); }
}

.fg-input {
  height: 82rpx;
  font-size: 30rpx;
  color: var(--color-text, #1F2329);
}

.fg-textarea {
  width: 100%;
  min-height: 240rpx;
  font-size: 30rpx;
  line-height: 1.55;
  color: var(--color-text, #1F2329);
  padding: 20rpx 0;
}

.field-placeholder { color: var(--color-text-tertiary, #C0C4CC); }

.char-count {
  font-size: 22rpx;
  color: var(--color-text-tertiary, #8F959E);
  text-align: right;
  display: block;
  margin-top: 8rpx;
}

.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.tag-chip {
  font-size: 22rpx;
  padding: 6rpx 18rpx;
  border-radius: 8rpx;
  background: var(--color-primary-soft, #E8F8EF);
  color: var(--color-primary, #25B864);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 20rpx;
}

.btn-secondary {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-soft, #F1F5F2);
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-secondary, #646A73);

  &:active { opacity: 0.8; }
}

.btn-primary {
  flex: 1.2;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25B864), #1DA05A));
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3);

  &:active { opacity: 0.9; transform: scale(0.98); }

  .btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-btn-text, #fff);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;

  .empty-icon { font-size: 120rpx; margin-bottom: 32rpx; }
  .empty-text { font-size: 32rpx; font-weight: 600; color: var(--color-text, #1F2329); margin-bottom: 16rpx; }
  .empty-hint { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
}
</style>
