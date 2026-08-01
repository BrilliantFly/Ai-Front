<template>
  <view class="memo-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">小记</text>
      </view>
      <view class="header-actions">
        <view class="header-btn" @tap="openFilterModal">
          <text class="filter-icon">☰</text>
        </view>
        <view class="header-btn" @tap="openCreateModal">
          <text class="plus-icon">+</text>
        </view>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索小记..." placeholder-class="field-placeholder" v-model="searchKeyword" @input="handleSearch" />
    </view>

    <!-- 分类筛选 -->
    <view class="filter-bar">
      <view class="filter-chip" :class="{ active: activeFilter === 'all' }" @tap="activeFilter = 'all'">全部</view>
      <view class="filter-chip" :class="{ active: activeFilter === 'active' }" @tap="activeFilter = 'active'">未归档</view>
      <view class="filter-chip" :class="{ active: activeFilter === 'archived' }" @tap="activeFilter = 'archived'">已归档</view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="memo-list">
        <view class="swipe-wrap" v-for="item in filteredList" :key="item.id">
          <!-- 左滑操作按钮(绝对定位) -->
          <view class="swipe-actions">
            <view class="swipe-action action-archive" @tap.stop="toggleArchive(item)">
              <text class="sa-icon">📦</text>
              <text class="sa-label">{{ item.isArchived ? '取消归档' : '归档' }}</text>
            </view>
            <view class="swipe-action action-edit" @tap.stop="openEditModal(item)">
              <text class="sa-icon">✏️</text>
              <text class="sa-label">编辑</text>
            </view>
            <view class="swipe-action action-delete" @tap.stop="confirmDelete(item.id)">
              <text class="sa-icon">🗑️</text>
              <text class="sa-label">删除</text>
            </view>
          </view>
          <!-- 卡片内容(跟随滑动) -->
          <view
            class="swipe-content"
            :style="swipeStyle(item.id)"
            @touchstart="onSwipeStart($event, item.id)"
            @touchmove="onSwipeMove($event, item.id)"
            @touchend="onSwipeEnd($event, item.id)"
            @longpress="showCardActions(item)"
          >
            <view class="memo-card">
              <view class="memo-tags" v-if="item.tags">
                <text class="memo-tag" v-for="tag in parseTags(item.tags)" :key="tag">{{ tag }}</text>
              </view>
              <text class="memo-text">{{ item.content }}</text>
              <view class="memo-footer">
                <text class="memo-time">{{ formatTime(item.createTime) }}</text>
                <view class="memo-actions">
                  <text v-if="!item.isArchived" class="action-btn" @tap.stop="toggleArchive(item)">📦</text>
                  <text class="action-btn" @tap.stop="openEditModal(item)">✏️</text>
                  <text class="action-btn" @tap.stop="confirmDelete(item.id)">🗑️</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="filteredList.length === 0 && !loading">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无小记</text>
        <text class="empty-hint">点击右上角按钮创建第一条小记</text>
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
            <!-- 已有标签选择 -->
            <view class="existing-tags" v-if="availableTags.length > 0">
              <text class="existing-tags-label">从已有标签中选择：</text>
              <view class="tag-picker">
                <view
                  class="pick-tag"
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :class="{ selected: selectedTagIds.includes(tag.id) }"
                  @tap="toggleExistingTag(tag)"
                >
                  <text class="pick-tag-dot" :style="{ background: tag.color || '#25B864' }"></text>
                  <text class="pick-tag-name">{{ tag.name }}</text>
                </view>
              </view>
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
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getQuickNoteList, addQuickNote, updateQuickNote, deleteQuickNote, toggleArchiveQuickNote, getTagAll } from '@/api/knowledge'

const memoList = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const newContent = ref('')
const newTags = ref('')
const editingId = ref(0)
const submitting = ref(false)
const activeFilter = ref<'all' | 'active' | 'archived'>('all')

// ===== 左滑状态 =====
const SWIPE_THRESHOLD = 42
const SWIPE_MAX = 210
const swipeOffsets = ref<Record<number, { startX: number; currentX: number; translateX: number }>>({})
const openSwipeId = ref<number | null>(null)

const closeSwipe = (id: number) => {
  if (swipeOffsets.value[id]) swipeOffsets.value[id].translateX = 0
  if (openSwipeId.value === id) openSwipeId.value = null
}

const onSwipeStart = (e: any, id: number) => {
  const touch = e.touches[0]
  if (openSwipeId.value !== null && openSwipeId.value !== id) closeSwipe(openSwipeId.value)
  swipeOffsets.value[id] = {
    startX: touch.clientX,
    currentX: touch.clientX,
    translateX: openSwipeId.value === id ? -SWIPE_MAX : 0
  }
}

const onSwipeMove = (e: any, id: number) => {
  const data = swipeOffsets.value[id]
  if (!data) return
  const touch = e.touches[0]
  let targetX = data.translateX + (touch.clientX - data.currentX)
  targetX = Math.max(-SWIPE_MAX, Math.min(0, targetX))
  data.translateX = targetX
  data.currentX = touch.clientX
}

const onSwipeEnd = (e: any, id: number) => {
  const data = swipeOffsets.value[id]
  if (!data) return
  if (Math.abs(data.translateX) > SWIPE_THRESHOLD) {
    openSwipeId.value = id
    data.translateX = -SWIPE_MAX
  } else {
    closeSwipe(id)
  }
}

const swipeStyle = (id: number) => {
  const data = swipeOffsets.value[id]
  const x = data ? data.translateX : openSwipeId.value === id ? -SWIPE_MAX : 0
  return `transform: translateX(${x}px); transition: transform 0.25s cubic-bezier(.22,1,.36,1);`
}

// ===== 本地归档状态（后端部署完成前用本地存储兜底） =====
const ARCHIVE_KEY = 'memo_archived_ids'
const getLocalArchivedIds = (): Set<number> => {
  try {
    const raw = uni.getStorageSync(ARCHIVE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}
const saveLocalArchivedId = (id: number, archived: boolean) => {
  const set = getLocalArchivedIds()
  if (archived) set.add(id)
  else set.delete(id)
  uni.setStorageSync(ARCHIVE_KEY, JSON.stringify([...set]))
}

// ===== 标签选择状态 =====
const availableTags = ref<any[]>([])
const selectedTagIds = ref<number[]>([])

const loadTags = async () => {
  try {
    const res = await getTagAll()
    const records = res?.records || res?.data?.records || []
    availableTags.value = records || []
  } catch (e) {
    console.error('加载标签失败', e)
  }
}

const toggleExistingTag = (tag: any) => {
  const idx = selectedTagIds.value.indexOf(tag.id)
  if (idx > -1) {
    selectedTagIds.value.splice(idx, 1)
  } else {
    selectedTagIds.value.push(tag.id)
  }
  // 同步更新输入框文本（显示标签名称，逗号分隔）
  const names = selectedTagIds.value
    .map(id => availableTags.value.find(t => t.id === id))
    .filter(Boolean)
    .map(t => t!.name)
  newTags.value = names.join(',')
}

const filteredList = computed(() => {
  let list = memoList.value
  if (activeFilter.value === 'active') {
    list = list.filter((item: any) => !item.isArchived)
  } else if (activeFilter.value === 'archived') {
    list = list.filter((item: any) => item.isArchived)
  }
  return list
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getQuickNoteList({
      pageNum: 1,
      pageSize: 100,
      content: searchKeyword.value || undefined
    })
    const raw = res?.records || res?.data?.records || []
    const localArchived = getLocalArchivedIds()
    memoList.value = raw.map((item: any) => ({
      ...item,
      // 优先用本地归档状态（后端部署恢复后，本地状态会和后端一致）
      isArchived: localArchived.has(item.id) || (item.isArchived ? true : false)
    }))
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
  selectedTagIds.value = []
  showModal.value = true
  loadTags()
}

const openEditModal = (item: any) => {
  editingId.value = item.id
  newContent.value = item.content || ''
  newTags.value = item.tags || ''
  // 从已有标签中匹配选中状态
  selectedTagIds.value = []
  if (item.tags) {
    const tagNames = item.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    for (const name of tagNames) {
      const found = availableTags.value.find(t => t.name === name)
      if (found) selectedTagIds.value.push(found.id)
    }
  }
  showModal.value = true
  loadTags()
}

const closeModal = () => {
  showModal.value = false
  editingId.value = 0
  newContent.value = ''
  newTags.value = ''
  selectedTagIds.value = []
}

const handlePublish = async () => {
  if (submitting.value) return
  if (!newContent.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const payload: any = { content: newContent.value.trim(), tags: normalizeTags(newTags.value) }
    if (editingId.value > 0) {
      // 编辑时保留现有归档状态
      const existing = memoList.value.find(m => m.id === editingId.value)
      if (existing) payload.isArchived = existing.isArchived
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

const toggleArchive = async (item: any) => {
  const newState = !item.isArchived
  // 保存到本地存储（即使后端没部署，刷新页面也不丢失）
  saveLocalArchivedId(item.id, newState)
  // 立即更新 UI
  item.isArchived = newState
  uni.showToast({ title: newState ? '已归档' : '已取消归档', icon: 'success' })
  closeSwipe(item.id)
  // 触发响应式
  memoList.value = memoList.value.slice()
  // 静默同步到后端（失败不影响前端）
  updateQuickNote({ id: item.id, isArchived: newState ? 1 : 0 }).catch(e => {
    console.error('归档同步失败', e)
  })
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const openFilterModal = () => {
  uni.showActionSheet({
    itemList: ['全部小记', '未归档', '已归档'],
    success: (res) => {
      if (res.tapIndex === 0) activeFilter.value = 'all'
      else if (res.tapIndex === 1) activeFilter.value = 'active'
      else if (res.tapIndex === 2) activeFilter.value = 'archived'
    }
  })
}

const showCardActions = (item: any) => {
  uni.showActionSheet({
    itemList: ['编辑', item.isArchived ? '取消归档' : '归档', '删除'],
    success: (res) => {
      if (res.tapIndex === 0) {
        openEditModal(item)
      } else if (res.tapIndex === 1) {
        toggleArchive(item)
      } else if (res.tapIndex === 2) {
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
          // 清理本地归档状态
          saveLocalArchivedId(id, false)
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
  // 同时支持中文逗号和英文逗号
  return tags.replace(/，/g, ',').split(',').map(t => t.trim()).filter(t => t)
}

// 统一标签分隔符（发布时转成英文逗号）
const normalizeTags = (tags: string) => {
  return tags.replace(/，/g, ',').split(',').map(t => t.trim()).filter(t => t).join(',')
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

  .header-left { display: flex; align-items: center; gap: 8rpx; }

  .back-btn {
    width: 72rpx; height: 72rpx;
    display: flex; align-items: center; justify-content: center;
    border-radius: 16rpx;
    margin-left: -16rpx;
    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .back-icon { font-size: 44rpx; line-height: 1; color: var(--color-text, #1F2329); }
  }

  .header-title { font-size: 34rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .header-actions { display: flex; gap: 8rpx; }

  .header-btn {
    width: 72rpx; height: 72rpx;
    display: flex; align-items: center; justify-content: center;
    border-radius: 16rpx;
    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .filter-icon, .plus-icon { font-size: 40rpx; color: var(--color-text, #1F2329); }
  }
}

.search-bar {
  margin: 24rpx 32rpx;
  display: flex; align-items: center; gap: 16rpx;
  background: var(--color-surface, #fff);
  border-radius: 20rpx; padding: 20rpx 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));
  .search-icon { font-size: 32rpx; color: var(--color-text-tertiary, #C9CDD4); }
  .search-input { flex: 1; font-size: 28rpx; color: var(--color-text, #1F2329); }
}

.filter-bar {
  display: flex; gap: 12rpx; padding: 0 32rpx; margin-bottom: 24rpx;
}

.filter-chip {
  padding: 8rpx 24rpx; border-radius: 16rpx; font-size: 24rpx;
  background: var(--color-surface, #fff);
  color: var(--color-text-secondary, #646A73);
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  &.active { background: var(--color-primary, #25B864); color: #fff; border-color: var(--color-primary, #25B864); }
}

.content { padding: 0 32rpx; }

.memo-list { display: flex; flex-direction: column; gap: 20rpx; }

/* ===== 左滑 ===== */
.swipe-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 24rpx;
}
.swipe-actions {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: row;
}
.swipe-action {
  width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}
.swipe-action .sa-icon { font-size: 36rpx; line-height: 1; }
.swipe-action .sa-label { font-size: 22rpx; line-height: 1; }
.swipe-action.action-archive { background: linear-gradient(135deg, #25B864, #1DA05A); }
.swipe-action.action-edit { background: linear-gradient(135deg, #ff8700, #e07800); }
.swipe-action.action-delete { background: linear-gradient(135deg, #8e8e93, #6c6c70); }
.swipe-content {
  position: relative;
  z-index: 2;
  background: transparent;
}

.memo-card {
  background: var(--color-surface, #fff);
  padding: 32rpx;
  border-radius: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));
  border: 1rpx solid var(--color-border-light, transparent);
  &:active { box-shadow: var(--shadow-md, 0 4rpx 16rpx rgba(0,0,0,0.08)); }
}

.memo-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }
.memo-tag { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 8rpx; font-weight: 500; background: var(--color-primary-soft, #E8F8EF); color: var(--color-primary, #25B864); }

.memo-text {
  font-size: 30rpx; line-height: 1.6;
  color: var(--color-text, #1F2329);
  display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical;
  overflow: hidden; margin-bottom: 24rpx;
}

.memo-footer { display: flex; align-items: center; justify-content: space-between; }
.memo-time { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
.memo-actions { display: flex; gap: 4rpx; }
.action-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; border-radius: 10rpx; font-size: 28rpx; &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); } }

.fab {
  position: fixed; bottom: 200rpx; right: 40rpx;
  width: 96rpx; height: 96rpx;
  background: var(--color-primary, #25B864); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.4); z-index: 90;
  &:active { transform: scale(0.92); }
  .fab-icon { font-size: 48rpx; color: var(--color-btn-text, #fff); font-weight: 600; }
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: none; align-items: flex-end; justify-content: center; z-index: 200;
  &.active { display: flex; }
}
.modal {
  background: var(--color-surface, #fff); width: 100%; max-width: 750rpx;
  border-radius: 32rpx 32rpx 0 0; padding: 24rpx 32rpx 48rpx;
  max-height: 80vh; overflow-y: auto;
}
.modal-handle { width: 64rpx; height: 8rpx; background: var(--color-border, #E8E9EB); border-radius: 4rpx; margin: 0 auto 24rpx; }
.modal-title { font-size: 34rpx; font-weight: 700; color: var(--color-text, #1F2329); display: block; margin-bottom: 32rpx; text-align: center; }
.form-card { background: var(--color-surface-soft, #F8FAF9); border-radius: 24rpx; padding: 24rpx; border: 1rpx solid var(--color-border-light, #E8E9EB); margin-bottom: 32rpx; }
.fgs-full { margin-bottom: 28rpx; &:last-child { margin-bottom: 0; } }
.fg-label { font-size: 26rpx; font-weight: 700; color: var(--color-text, #1F2329); margin-bottom: 12rpx; display: block; }
.required { color: #ef4444; }
.fg-input-wrap { background: var(--color-surface, #fff); border: 1rpx solid var(--color-border-light, #E8E9EB); border-radius: 18rpx; padding: 0 24rpx; &:focus-within { border-color: var(--color-primary, #25B864); } }
.fg-input { height: 82rpx; font-size: 30rpx; color: var(--color-text, #1F2329); }
.fg-textarea { width: 100%; min-height: 240rpx; font-size: 30rpx; line-height: 1.55; color: var(--color-text, #1F2329); padding: 20rpx 0; }
.field-placeholder { color: var(--color-text-tertiary, #C0C4CC); }
.char-count { font-size: 22rpx; color: var(--color-text-tertiary, #8F959E); text-align: right; display: block; margin-top: 8rpx; }
.tag-preview { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.tag-chip { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 8rpx; background: var(--color-primary-soft, #E8F8EF); color: var(--color-primary, #25B864); font-weight: 500; }
.form-actions { display: flex; gap: 20rpx; }
.btn-secondary { flex: 1; height: 88rpx; display: flex; align-items: center; justify-content: center; background: var(--color-surface-soft, #F1F5F2); border-radius: 20rpx; font-size: 30rpx; font-weight: 600; color: var(--color-text-secondary, #646A73); &:active { opacity: 0.8; } }
.btn-primary { flex: 1.2; height: 88rpx; display: flex; align-items: center; justify-content: center; background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25B864), #1DA05A)); border-radius: 20rpx; box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3); &:active { opacity: 0.9; transform: scale(0.98); } .btn-text { font-size: 30rpx; font-weight: 600; color: var(--color-btn-text, #fff); } }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 200rpx 0; .empty-icon { font-size: 120rpx; margin-bottom: 32rpx; } .empty-text { font-size: 32rpx; font-weight: 600; color: var(--color-text, #1F2329); margin-bottom: 16rpx; } .empty-hint { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); } }

/* ===== 标签选择器 ===== */
.existing-tags { margin-top: 20rpx; }
.existing-tags-label { font-size: 24rpx; color: var(--color-text-secondary, #646A73); display: block; margin-bottom: 12rpx; }
.tag-picker { display: flex; flex-wrap: wrap; gap: 12rpx; }
.pick-tag {
  display: flex; align-items: center; gap: 8rpx;
  padding: 8rpx 18rpx; border-radius: 12rpx;
  font-size: 24rpx; font-weight: 500;
  background: var(--color-surface, #fff);
  border: 1rpx solid var(--color-border-light, #E8E9EB);
  color: var(--color-text-secondary, #646A73);
  &:active { opacity: 0.7; }
}
.pick-tag.selected {
  background: var(--color-primary-soft, #E8F8EF);
  border-color: var(--color-primary, #25B864);
  color: var(--color-primary, #25B864);
}
.pick-tag-dot { width: 12rpx; height: 12rpx; border-radius: 50%; flex-shrink: 0; }
.pick-tag-name { line-height: 1; }
</style>
