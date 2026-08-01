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
      <!-- 新建按钮已改为右下角悬浮按钮 -->
      <view class="create-btn" v-show="false" @tap="openCreateDialog">
        <text class="create-icon">+</text>
        <text class="create-text">新建</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索知识库..." placeholder-class="field-placeholder" v-model="searchKeyword" @input="handleSearch" />
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <view class="kb-list">
        <view
          class="kb-card"
          v-for="item in kbList"
          :key="item.id"
          @tap="goToDetail(item.id)"
          @longpress="showCardActions(item)"
        >
          <view class="kb-cover" :class="item.coverClass">
            <text class="kb-icon">{{ item.icon || '📚' }}</text>
          </view>
          <view class="kb-body">
            <text class="kb-name">{{ item.name }}</text>
            <text class="kb-desc">{{ item.description || '暂无描述' }}</text>
            <view class="kb-meta">
              <text class="kb-stats">{{ item.docCount || 0 }}篇文档</text>
              <text class="kb-visibility">{{ item.visibility === 1 ? '公开' : '私密' }}</text>
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

    <!-- 创建/编辑知识库弹窗 -->
    <view class="modal-overlay" :class="{ active: showDialog }" @tap="closeDialog">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">{{ editingKb ? '编辑知识库' : '新建知识库' }}</text>

        <view class="form-card">
          <view class="fgs-full">
            <text class="fg-label">📝 名称 <text class="required">*</text></text>
            <view class="fg-input-wrap">
              <input v-model="form.name" class="fg-input" maxlength="30" placeholder="如：前端技术笔记" placeholder-class="field-placeholder" />
            </view>
          </view>

          <view class="fgs-full">
            <text class="fg-label">📖 描述</text>
            <view class="fg-input-wrap">
              <textarea v-model="form.description" class="fg-textarea" maxlength="200" placeholder="简要描述知识库内容..." placeholder-class="field-placeholder" />
            </view>
          </view>

          <view class="fgs-full">
            <text class="fg-label">🎨 图标</text>
            <view class="icon-row">
              <view
                v-for="icon in iconOptions"
                :key="icon"
                class="icon-chip"
                :class="{ active: form.icon === icon }"
                @tap="form.icon = icon"
              >
                <text class="icon-chip-text">{{ icon }}</text>
              </view>
            </view>
          </view>

          <view class="fgs-full">
            <text class="fg-label">👁️ 可见性</text>
            <view class="toggle-row">
              <view class="toggle-opt" :class="{ active: form.visibility === 0 }" @tap="form.visibility = 0">
                🔒 私密
              </view>
              <view class="toggle-opt" :class="{ active: form.visibility === 1 }" @tap="form.visibility = 1">
                🌐 公开
              </view>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-secondary" @tap="closeDialog">取消</view>
          <view class="btn-primary" @tap="handleSave">
            <text class="btn-text">{{ submitting ? '保存中...' : '保存' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="fab" @tap="openCreateDialog">
      <text class="fab-icon">+</text>
    </view>

    <PremiumBottomNav active="knowledge" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { switchTabCompat } from '@/utils/util'
import PremiumBottomNav from '@/components/PremiumBottomNav.vue'
import { getKnowledgeBaseList, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from '@/api/knowledge'

const router = useRouter()

const kbList = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const showDialog = ref(false)
const submitting = ref(false)
const editingKb = ref<any>(null)

const form = ref({
  name: '',
  description: '',
  icon: '📚',
  visibility: 0 as 0 | 1
})

const iconOptions = ['📚', '📖', '💡', '🔧', '🎯', '💻', '🧠', '📝', '🎨', '🔬', '📊', '🌍']

const loadData = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeBaseList({
      pageNum: 1,
      pageSize: 20,
      name: searchKeyword.value || undefined
    })
    kbList.value = res?.records || res?.data?.records || []
  } catch (e) {
    console.error('加载知识库列表失败', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  switchTabCompat('/pages/index/index')
}

const goToDetail = (id: number) => {
  router.navigateTo(`/pages/knowledge/detail/index?id=${id}`)
}

const openCreateDialog = () => {
  editingKb.value = null
  form.value = { name: '', description: '', icon: '📚', visibility: 0 }
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingKb.value = null
}

const showCardActions = (item: any) => {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: (res) => {
      if (res.tapIndex === 0) {
        editingKb.value = item
        form.value = {
          name: item.name || '',
          description: item.description || '',
          icon: item.icon || '📚',
          visibility: item.visibility ?? 0
        }
        showDialog.value = true
      } else if (res.tapIndex === 1) {
        confirmDelete(item)
      }
    }
  })
}

const confirmDelete = (item: any) => {
  uni.showModal({
    title: '删除知识库',
    content: `确定要删除「${item.name}」吗？删除后不可恢复。`,
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteKnowledgeBase(item.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadData()
        } catch (e) {
          console.error('删除失败', e)
        }
      }
    }
  })
}

const handleSave = async () => {
  if (submitting.value) return
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入知识库名称', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    if (editingKb.value) {
      await updateKnowledgeBase({ id: editingKb.value.id, ...form.value })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      await addKnowledgeBase({ ...form.value })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    closeDialog()
    loadData()
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
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
  background: var(--color-bg-app, #F8FAF9);
  padding-bottom: 200rpx;
}

/* 浮动添加按钮 */
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

.header {
  background: var(--color-surface, #fff);
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid var(--color-border-light, #DEE0E3);

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

    &:active { background: var(--color-surface-soft, #F1F5F2); }

    .back-icon {
      font-size: 48rpx;
      color: var(--color-text, #1F2329);
    }
  }

  .header-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: var(--color-primary, #25B864);
    color: var(--color-btn-text, #fff);
    padding: 16rpx 32rpx;
    border-radius: 16rpx;

    &:active { opacity: 0.9; }
    .create-icon { font-size: 32rpx; font-weight: 600; }
    .create-text { font-size: 28rpx; font-weight: 500; }
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

.kb-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.kb-card {
  background: var(--color-surface, #fff);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04));
  border: 1rpx solid var(--color-border-light, transparent);

  &:active { opacity: 0.9; }
}

.kb-cover {
  width: 100%;
  height: 200rpx;
  background: var(--color-primary-soft, linear-gradient(135deg, #E8F8EF 0%, #D4F2E1 100%));
  display: flex;
  align-items: center;
  justify-content: center;

  &.tech { background: linear-gradient(135deg, #E8F4FD 0%, #D1ECFA 100%); }
  &.product { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); }
  &.note { background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); }

  .kb-icon { font-size: 80rpx; }
}

.kb-body { padding: 28rpx 32rpx; }

.kb-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-text, #1F2329);
  margin-bottom: 8rpx;
  display: block;
}

.kb-desc {
  font-size: 26rpx;
  color: var(--color-text-secondary, #646A73);
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

.kb-stats { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }

.kb-visibility {
  font-size: 22rpx;
  color: var(--color-primary, #25B864);
  background: var(--color-primary-soft, #E8F8EF);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
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

/* ===== 弹窗样式 (打卡表单风格) ===== */
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

  &:focus-within {
    border-color: var(--color-primary, #25B864);
  }
}

.fg-input {
  height: 82rpx;
  font-size: 30rpx;
  color: var(--color-text, #1F2329);
}

.fg-textarea {
  width: 100%;
  min-height: 160rpx;
  font-size: 30rpx;
  line-height: 1.55;
  color: var(--color-text, #1F2329);
  padding: 20rpx 0;
}

.field-placeholder {
  color: var(--color-text-tertiary, #C0C4CC);
}

.icon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.icon-chip {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: var(--color-surface, #fff);
  border: 2rpx solid var(--color-border-light, #E8E9EB);

  &.active {
    border-color: var(--color-primary, #25B864);
    background: var(--color-primary-soft, #E8F8EF);
  }

  .icon-chip-text { font-size: 40rpx; }
}

.toggle-row {
  display: flex;
  gap: 16rpx;
}

.toggle-opt {
  flex: 1;
  height: 82rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
  background: var(--color-surface, #fff);
  border: 2rpx solid var(--color-border-light, #E8E9EB);
  color: var(--color-text-secondary, #646A73);

  &.active {
    border-color: var(--color-primary, #25B864);
    background: var(--color-primary-soft, #E8F8EF);
    color: var(--color-primary, #25B864);
  }
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
</style>
