<template>
  <view class="slogan-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">✨ 首页标语</text>
      </view>
    </view>

    <!-- 副标题提示 -->
    <view class="intro-bar">
      <text class="intro-text">标语将在首页 hero 区按排序定时轮播展示，数字越小越靠前</text>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="slogan-list">
        <view class="swipe-wrap" v-for="item in sloganList" :key="item.id">
          <!-- 左滑操作按钮(绝对定位) -->
          <view class="swipe-actions">
            <view class="swipe-action action-toggle" @tap.stop="toggleStatus(item)">
              <text class="sa-icon">{{ item.status === 1 ? '⏸' : '▶️' }}</text>
              <text class="sa-label">{{ item.status === 1 ? '停用' : '启用' }}</text>
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
            @tap.stop="handleCardTap(item)"
            @longpress="showCardActions(item)"
          >
            <view class="slogan-card" :class="{ disabled: item.status !== 1 }">
              <view class="card-top">
                <text class="card-emoji">{{ item.emoji || '✨' }}</text>
                <view class="status-chip" :class="{ active: item.status === 1 }">
                  <text class="status-text">{{ item.status === 1 ? '启用' : '停用' }}</text>
                </view>
              </view>
              <text class="card-content">{{ item.content }}</text>
              <view class="card-footer">
                <text class="card-time">永久有效</text>
                <text class="card-sort" v-if="item.sort != null">排序 {{ item.sort }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="sloganList.length === 0 && !loading">
        <text class="empty-icon">✨</text>
        <text class="empty-text">暂无标语</text>
        <text class="empty-hint">点击右下角按钮创建第一条标语</text>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="fab" @tap="openCreateModal">
      <text class="fab-icon">+</text>
    </view>

    <!-- 新建/编辑标语弹窗 -->
    <view class="modal-overlay" :class="{ active: showModal }" @tap="closeModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">{{ editingId ? '编辑标语' : '新建标语' }}</text>

        <view class="form-card">
          <view class="fgs-full">
            <text class="fg-label">📝 标语内容 <text class="required">*</text></text>
            <view class="fg-input-wrap">
              <textarea
                v-model="formContent"
                class="fg-textarea"
                placeholder="输入标语内容，如：努力是光，坚持是路"
                placeholder-class="field-placeholder"
                :maxlength="100"
              />
            </view>
            <text class="char-count">{{ formContent.length }}/100</text>
          </view>

          <view class="fgs-full">
            <text class="fg-label">✨ 表情符号</text>
            <view class="fg-input-wrap">
              <input
                v-model="formEmoji"
                class="fg-input"
                placeholder="如：✨ 🎯 🔥（可留空）"
                placeholder-class="field-placeholder"
                :maxlength="10"
              />
            </view>
            <view class="emoji-quick-row">
              <view
                class="emoji-quick"
                :class="{ selected: formEmoji === e }"
                v-for="e in emojiQuickOptions"
                :key="e"
                @tap="formEmoji = e"
              >
                <text>{{ e }}</text>
              </view>
            </view>
            <view class="emoji-preview" v-if="formEmoji">
              <text class="emoji-preview-label">预览：</text>
              <text class="emoji-preview-icon">{{ formEmoji }}</text>
            </view>
          </view>

          <view class="fgs-full">
            <text class="fg-label">🔢 排序</text>
            <view class="fg-input-wrap">
              <input
                v-model="formSort"
                class="fg-input"
                type="number"
                placeholder="数字越小越靠前"
                placeholder-class="field-placeholder"
              />
            </view>
          </view>

          <view class="fgs-full fgs-row">
            <view class="fg-copy">
              <text class="fg-label">状态</text>
              <text class="field-help">{{ formStatus === 1 ? '启用后首页将展示' : '停用后首页不展示' }}</text>
            </view>
            <switch :checked="formStatus === 1" color="#25B864" @change="onStatusChange" />
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-secondary" @tap="closeModal">取消</view>
          <view class="btn-primary" @tap="handleSave">
            <text class="btn-text">{{ submitting ? '保存中...' : (editingId ? '更新' : '保存') }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { switchTabCompat } from '@/utils/util'
import { getSloganPage, addSlogan, updateSlogan, deleteSlogan } from '@/api/plan/slogan'

const sloganList = ref<any[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(0)
const submitting = ref(false)

// 快捷表情（与 vue 管理端一致）
const emojiQuickOptions = ['✨', '🚀', '🌱', '⭐', '🔥', '💪', '🌈', '🎯', '📝', '☀️']

// ===== 表单状态 =====
const formContent = ref('')
const formEmoji = ref('')
const formSort = ref('')
const formStatus = ref(1)

// ===== 左滑状态 =====
const SWIPE_THRESHOLD = 42
const SWIPE_MAX = 210
const swipeOffsets = ref<Record<number, { startX: number; currentX: number; translateX: number }>>({})
const openSwipeId = ref<number | null>(null)
// 最近一次滑动结束时间，用于避免滑动后误触卡片 tap 进入编辑
let lastSwipeAt = 0

const handleCardTap = (item: any) => {
  if (Date.now() - lastSwipeAt < 350) return
  openEditModal(item)
}

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
  lastSwipeAt = Date.now()
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

// ===== 数据加载 =====
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getSloganPage({ pageNum: 1, pageSize: 100 })
    sloganList.value = res?.records || res?.data?.records || []
  } catch (e) {
    console.error('加载标语列表失败', e)
  } finally {
    loading.value = false
  }
}

// ===== 弹窗 =====
const openCreateModal = () => {
  editingId.value = 0
  formContent.value = ''
  formEmoji.value = ''
  formSort.value = ''
  formStatus.value = 1
  showModal.value = true
}

const openEditModal = (item: any) => {
  editingId.value = item.id
  formContent.value = item.content || ''
  formEmoji.value = item.emoji || ''
  formSort.value = item.sort != null ? String(item.sort) : ''
  formStatus.value = item.status === 1 ? 1 : 0
  closeSwipe(item.id)
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = 0
  formContent.value = ''
  formEmoji.value = ''
  formSort.value = ''
  formStatus.value = 1
}

const onStatusChange = (e: any) => {
  formStatus.value = e.detail.value ? 1 : 0
}

// ===== 保存 =====
const handleSave = async () => {
  if (submitting.value) return
  if (!formContent.value.trim()) {
    uni.showToast({ title: '请输入标语内容', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const payload: any = {
      content: formContent.value.trim(),
      emoji: formEmoji.value.trim(),
      sort: formSort.value ? Number(formSort.value) : 0,
      status: formStatus.value
    }
    if (editingId.value > 0) {
      payload.id = editingId.value
      await updateSlogan(payload)
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      await addSlogan(payload)
      uni.showToast({ title: '保存成功', icon: 'success' })
    }
    closeModal()
    loadData()
  } catch (e) {
    console.error('保存标语失败', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ===== 启用/停用 =====
const toggleStatus = async (item: any) => {
  const newStatus = item.status === 1 ? 0 : 1
  item.status = newStatus
  closeSwipe(item.id)
  sloganList.value = sloganList.value.slice()
  uni.showToast({ title: newStatus === 1 ? '已启用' : '已停用', icon: 'success' })
  updateSlogan({ id: item.id, status: newStatus }).catch((e: any) => {
    console.error('状态同步失败', e)
  })
}

// ===== 其他操作 =====
const showCardActions = (item: any) => {
  uni.showActionSheet({
    itemList: ['编辑', item.status === 1 ? '停用' : '启用', '删除'],
    success: (res) => {
      if (res.tapIndex === 0) {
        openEditModal(item)
      } else if (res.tapIndex === 1) {
        toggleStatus(item)
      } else if (res.tapIndex === 2) {
        confirmDelete(item.id)
      }
    }
  })
}

const confirmDelete = (id: number) => {
  uni.showModal({
    title: '删除标语',
    content: '确定要删除这条标语吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteSlogan(id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadData()
        } catch (e) {
          console.error('删除失败', e)
        }
      }
    }
  })
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    switchTabCompat('/pages/index/index')
  }
}

onShow(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.slogan-page {
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
  background: var(--color-surface, rgba(255, 255, 255, 0.92));
  backdrop-filter: blur(24rpx);
  border-bottom: 1rpx solid var(--color-border-light, rgba(0, 0, 0, 0.06));

  /* #ifdef APP-PLUS */
  height: calc(96rpx + var(--status-bar-height));
  padding: var(--status-bar-height) 32rpx 0;
  /* #endif */

  .header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .back-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    margin-left: -16rpx;
    &:active {
      background: var(--color-surface-soft, rgba(0, 0, 0, 0.04));
    }
    .back-icon {
      font-size: 44rpx;
      line-height: 1;
      color: var(--color-text, #1F2329);
    }
  }

  .header-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
  }
}

.intro-bar {
  margin: 24rpx 32rpx 0;
  padding: 20rpx 24rpx;
  background: var(--color-primary-soft, #E8F8EF);
  border-radius: 16rpx;
  .intro-text {
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-primary, #25B864);
  }
}

.content {
  padding: 24rpx 32rpx 0;
}

.slogan-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* ===== 左滑 ===== */
.swipe-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 24rpx;
}
.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
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
.swipe-action .sa-icon {
  font-size: 36rpx;
  line-height: 1;
}
.swipe-action .sa-label {
  font-size: 22rpx;
  line-height: 1;
}
.swipe-action.action-toggle {
  background: linear-gradient(135deg, #25b864, #1da05a);
}
.swipe-action.action-edit {
  background: linear-gradient(135deg, #ff8700, #e07800);
}
.swipe-action.action-delete {
  background: linear-gradient(135deg, #8e8e93, #6c6c70);
}
.swipe-content {
  position: relative;
  z-index: 2;
  background: transparent;
}

/* ===== 标语卡片 ===== */
.slogan-card {
  background: var(--color-surface, #fff);
  padding: 28rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0, 0, 0, 0.04));
  border: 1rpx solid var(--color-border-light, transparent);
  &:active {
    box-shadow: var(--shadow-md, 0 4rpx 16rpx rgba(0, 0, 0, 0.08));
  }
  &.disabled {
    opacity: 0.6;
  }
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.card-emoji {
  font-size: 44rpx;
  line-height: 1;
}
.status-chip {
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 500;
  background: var(--color-surface-soft, #F1F5F2);
  color: var(--color-text-tertiary, #8F959E);
  &.active {
    background: var(--color-primary-soft, #E8F8EF);
    color: var(--color-primary, #25B864);
  }
  .status-text {
    line-height: 1;
  }
}

.card-content {
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.5;
  color: var(--color-text, #1F2329);
  display: block;
  margin-bottom: 20rpx;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-time {
  font-size: 24rpx;
  color: var(--color-text-tertiary, #8F959E);
}
.card-sort {
  font-size: 24rpx;
  color: var(--color-text-tertiary, #C0C4CC);
}

/* ===== FAB ===== */
.fab {
  position: fixed;
  bottom: 200rpx;
  right: 40rpx;
  width: 96rpx;
  height: 96rpx;
  background: var(--color-primary, #25b864);
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
    color: var(--color-btn-text, #fff);
    font-weight: 600;
  }
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: none;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  &.active {
    display: flex;
  }
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
  background: var(--color-border, #e8e9eb);
  border-radius: 4rpx;
  margin: 0 auto 24rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--color-text, #1f2329);
  display: block;
  margin-bottom: 32rpx;
  text-align: center;
}
.form-card {
  background: var(--color-surface-soft, #f8faf9);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1rpx solid var(--color-border-light, #e8e9eb);
  margin-bottom: 32rpx;
}
.fgs-full {
  margin-bottom: 28rpx;
  &:last-child {
    margin-bottom: 0;
  }
}
.fgs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fg-copy {
  flex: 1;
}
.fg-label {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-text, #1f2329);
  margin-bottom: 12rpx;
  display: block;
}
.required {
  color: #ef4444;
}
.field-help {
  font-size: 22rpx;
  color: var(--color-text-tertiary, #8f959e);
  display: block;
  margin-top: 8rpx;
}
.fg-input-wrap {
  background: var(--color-surface, #fff);
  border: 1rpx solid var(--color-border-light, #e8e9eb);
  border-radius: 18rpx;
  padding: 0 24rpx;
  &:focus-within {
    border-color: var(--color-primary, #25b864);
  }
}
.fg-input {
  height: 82rpx;
  font-size: 30rpx;
  color: var(--color-text, #1f2329);
}
.fg-textarea {
  width: 100%;
  min-height: 200rpx;
  font-size: 30rpx;
  line-height: 1.55;
  color: var(--color-text, #1f2329);
  padding: 20rpx 0;
}
.field-placeholder {
  color: var(--color-text-tertiary, #c0c4cc);
}
.char-count {
  font-size: 22rpx;
  color: var(--color-text-tertiary, #8f959e);
  text-align: right;
  display: block;
  margin-top: 8rpx;
}

/* ===== 表情预览 ===== */
.emoji-preview {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}
.emoji-preview-label {
  font-size: 24rpx;
  color: var(--color-text-secondary, #646a73);
}
.emoji-preview-icon {
  font-size: 44rpx;
  line-height: 1;
}

/* ===== 表情快捷选择 ===== */
.emoji-quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}
.emoji-quick {
  width: 76rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-soft, #f1f5f2);
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  font-size: 40rpx;
  line-height: 1;
  &.selected {
    background: var(--color-primary-soft, #e8f8ef);
    border-color: var(--color-primary, #25b864);
  }
}

/* ===== 底部按钮 ===== */
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
  background: var(--color-surface-soft, #f1f5f2);
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-secondary, #646a73);
  &:active {
    opacity: 0.8;
  }
}
.btn-primary {
  flex: 1.2;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25b864), #1da05a));
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3);
  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
  .btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-btn-text, #fff);
  }
}

/* ===== 空状态 ===== */
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
    color: var(--color-text, #1f2329);
    margin-bottom: 16rpx;
  }
  .empty-hint {
    font-size: 26rpx;
    color: var(--color-text-tertiary, #8f959e);
  }
}
</style>
