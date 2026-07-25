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
        <view class="icon-btn" @tap="handleMore">
          <text class="dots-icon">⋯</text>
        </view>
      </view>
    </view>

    <!-- 封面区域 -->
    <view class="cover">
      <text class="cover-icon">{{ kbInfo.icon || '📚' }}</text>
    </view>

    <!-- 知识库信息 -->
    <view class="kb-info">
      <text class="kb-name">{{ kbInfo.name }}</text>
      <text class="kb-desc">{{ kbInfo.description || '暂无描述' }}</text>
      <view class="kb-meta">
        <text class="kb-meta-item">📄 {{ kbInfo.docCount || 0 }} 篇文档</text>
        <text class="kb-meta-item">📅 {{ formatDate(kbInfo.createTime) }} 创建</text>
      </view>
    </view>

    <!-- 目录区域（多级树） -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📁 目录</text>
        <view class="section-add" @tap="openAddDirDialog(0)">
          <text class="add-icon">+</text>
        </view>
      </view>
      <view class="dir-list">
        <template v-if="flatDirs.length > 0">
          <view v-for="item in flatDirs" :key="item.dir.id" class="dir-item">
            <view
              class="dir-row"
              :style="{ paddingLeft: (item.depth * 40 + 32) + 'rpx' }"
              @tap="toggleDir(item.dir.id)"
              @longpress="editDir(item.dir)"
            >
              <text v-if="item.hasChildren" class="dir-arrow" :class="{ expanded: expandedDirs.includes(item.dir.id) }">›</text>
              <text v-else class="dir-arrow-placeholder"></text>
              <text class="dir-icon">📁</text>
              <text class="dir-name">{{ item.dir.name }}</text>
              <view class="dir-action-btn" @tap.stop="openAddDirDialog(item.dir.id)">
                <text class="action-icon">+</text>
              </view>
            </view>
          </view>
        </template>
        <view class="empty-dir" v-else>
          <text class="empty-hint">暂无目录，点击 + 添加</text>
        </view>
      </view>
    </view>

    <!-- 文档区域 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📝 文档</text>
      </view>
      <view class="doc-list">
        <view class="doc-item" v-for="doc in documents" :key="doc.id" @tap="goToDocument(doc.id)" @longpress="showDocActions(doc)">
          <view class="doc-icon-box">📄</view>
          <view class="doc-body">
            <text class="doc-title">{{ doc.title }}</text>
            <text class="doc-sub">{{ formatTime(doc.createTime) }}</text>
          </view>
        </view>
        <view class="empty-dir" v-if="documents.length === 0">
          <text class="empty-hint">暂无文档</text>
        </view>
      </view>
    </view>

    <!-- 浮动创建按钮 -->
    <view class="fab" @tap="handleCreateDoc">
      <text class="fab-icon">+</text>
    </view>

    <!-- 目录弹窗 -->
    <view class="modal-overlay" :class="{ active: showDirModal }" @tap="closeDirModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">{{ editingDir ? '编辑目录' : '新建目录' }}</text>
        <view class="form-card">
          <view class="fgs-full">
            <text class="fg-label">📁 目录名称 <text class="required">*</text></text>
            <view class="fg-input-wrap">
              <input v-model="dirForm.name" class="fg-input" maxlength="30" placeholder="如：基础入门" placeholder-class="field-placeholder" />
            </view>
          </view>
          <view class="fgs-full" v-if="!editingDir">
            <text class="fg-label">📂 父目录</text>
            <view class="parent-dir-row" @tap="showParentDirPicker">
              <text class="parent-dir-text">{{ parentDirName || '根目录（无父级）' }}</text>
              <text class="parent-dir-arrow">›</text>
            </view>
          </view>
        </view>
        <view class="form-actions">
          <view class="btn-secondary" @tap="closeDirModal">取消</view>
          <view class="btn-primary" @tap="handleSaveDir">
            <text class="btn-text">保存</text>
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
import { getKnowledgeBase, getDirectoryTree, getDocumentList, addDirectory, updateDirectory, deleteDirectory, deleteDocument, deleteKnowledgeBase } from '@/api/knowledge'

const router = useRouter()

const kbId = ref(0)
const kbInfo = ref<any>({})
const treeData = ref<any[]>([])
const documents = ref<any[]>([])
const expandedDirs = ref<number[]>([])

// 目录弹窗
const showDirModal = ref(false)
const editingDir = ref<any>(null)
const dirForm = ref({ name: '', parentId: 0 })
const parentDirName = ref('')

const loadData = async () => {
  try {
    const kbRes = await getKnowledgeBase(kbId.value)
    kbInfo.value = kbRes?.data || kbRes || {}

    const dirRes = await getDirectoryTree(kbId.value)
    treeData.value = dirRes?.data || dirRes || []

    const docRes = await getDocumentList({
      knowledgeBaseId: kbId.value,
      pageNum: 1,
      pageSize: 200
    })
    documents.value = docRes?.data?.records || docRes?.records || []
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

// 将树形数据扁平化为带深度的列表（仅展开的节点显示子节点）
const flatDirs = computed(() => {
  const result: any[] = []
  const walk = (dirs: any[], depth: number) => {
    for (const dir of dirs) {
      const hasChildren = (dir.children && dir.children.length > 0)
      result.push({ dir, depth, hasChildren })
      if (hasChildren && expandedDirs.value.includes(dir.id)) {
        walk(dir.children, depth + 1)
      }
    }
  }
  walk(treeData.value, 0)
  return result
})

const goBack = () => uni.navigateBack()

const goToDocument = (id: number) => {
  router.navigateTo(`/pages/knowledge/document-edit/index?id=${id}`)
}

const handleCreateDoc = () => {
  router.navigateTo(`/pages/knowledge/document-edit/index?kbId=${kbId.value}`)
}

const handleMore = () => {
  uni.showActionSheet({
    itemList: ['编辑知识库', '删除知识库'],
    success: (res) => {
      if (res.tapIndex === 0) {
        router.navigateTo(`/pages/knowledge/document-edit/index?kbId=${kbId.value}&editKb=1`)
      } else if (res.tapIndex === 1) {
        confirmDeleteKB()
      }
    }
  })
}

const confirmDeleteKB = () => {
  uni.showModal({
    title: '删除知识库',
    content: `确定要删除「${kbInfo.value.name}」吗？所有目录和文档将一并删除，不可恢复。`,
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteKnowledgeBase(kbId.value)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 500)
        } catch (e) {
          console.error('删除失败', e)
        }
      }
    }
  })
}

// 目录 CRUD
const openAddDirDialog = (parentId: number) => {
  editingDir.value = null
  dirForm.value = { name: '', parentId }
  parentDirName.value = parentId === 0 ? '' : findDirName(treeData.value, parentId)
  showDirModal.value = true
}

const findDirName = (dirs: any[], id: number): string => {
  for (const d of dirs) {
    if (d.id === id) return d.name
    if (d.children && d.children.length > 0) {
      const found = findDirName(d.children, id)
      if (found) return found
    }
  }
  return ''
}

const editDir = (dir: any) => {
  editingDir.value = dir
  dirForm.value = { name: dir.name, parentId: dir.parentId || 0 }
  parentDirName.value = ''
  showDirModal.value = true
}

const closeDirModal = () => {
  showDirModal.value = false
  editingDir.value = null
  dirForm.value = { name: '', parentId: 0 }
  parentDirName.value = ''
}

const showParentDirPicker = () => {
  const options = ['根目录（无父级）', ...flatDirs.value.map(item => {
    return '  '.repeat(item.depth) + item.dir.name
  })]
  uni.showActionSheet({
    itemList: options,
    success: (res) => {
      if (res.tapIndex === 0) {
        dirForm.value.parentId = 0
        parentDirName.value = ''
      } else {
        const selected = flatDirs.value[res.tapIndex - 1]
        dirForm.value.parentId = selected.dir.id
        parentDirName.value = selected.dir.name
      }
    }
  })
}

const handleSaveDir = async () => {
  if (!dirForm.value.name.trim()) {
    uni.showToast({ title: '请输入目录名称', icon: 'none' })
    return
  }
  try {
    if (editingDir.value) {
      await updateDirectory({ id: editingDir.value.id, name: dirForm.value.name.trim() })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      await addDirectory({
        knowledgeBaseId: kbId.value,
        name: dirForm.value.name.trim(),
        parentId: dirForm.value.parentId || 0
      })
      uni.showToast({ title: '已创建', icon: 'success' })
    }
    closeDirModal()
    loadData()
  } catch (e) {
    console.error('保存目录失败', e)
  }
}

const toggleDir = (dirId: number) => {
  const index = expandedDirs.value.indexOf(dirId)
  if (index > -1) {
    expandedDirs.value.splice(index, 1)
  } else {
    expandedDirs.value.push(dirId)
  }
}

const showDocActions = (doc: any) => {
  uni.showActionSheet({
    itemList: ['删除文档'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '删除文档',
          content: `确定要删除「${doc.title}」吗？`,
          confirmColor: '#ef4444',
          success: async (r) => {
            if (r.confirm) {
              try {
                await deleteDocument(doc.id)
                uni.showToast({ title: '已删除', icon: 'success' })
                loadData()
              } catch (e) {
                console.error('删除文档失败', e)
              }
            }
          }
        })
      }
    }
  })
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
  background: var(--color-bg-app, #F8FAF9);
  padding-bottom: 200rpx;
}

.header {
  position: sticky; top: 0; z-index: 100;
  background: var(--color-surface, rgba(255,255,255,0.92)); backdrop-filter: blur(24rpx);
  padding: 24rpx 16rpx; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));

  .header-left { display: flex; align-items: center; gap: 8rpx; flex: 1; min-width: 0; }
  .header-right { display: flex; align-items: center; gap: 4rpx; }
  .back-btn {
    width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 16rpx;
    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .back-icon { font-size: 48rpx; color: var(--color-text, #1F2329); }
  }
  .header-title { font-size: 34rpx; font-weight: 600; color: var(--color-text, #1F2329); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .icon-btn {
    width: 72rpx; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 16rpx;
    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .dots-icon { font-size: 44rpx; color: var(--color-text, #1F2329); font-weight: 700; }
  }
}

.cover {
  width: 100%; height: 320rpx;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25B864) 0%, #1DA05A 40%, #147A43 100%));
  display: flex; align-items: center; justify-content: center;
  .cover-icon { font-size: 120rpx; }
}

.kb-info {
  padding: 32rpx; background: var(--color-surface, #fff); margin: 0 32rpx; border-radius: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04)); position: relative; margin-top: -16rpx;
  .kb-name { font-size: 40rpx; font-weight: 700; color: var(--color-text, #1F2329); margin-bottom: 8rpx; display: block; }
  .kb-desc { font-size: 28rpx; color: var(--color-text-secondary, #646A73); line-height: 1.5; margin-bottom: 24rpx; display: block; }
  .kb-meta { display: flex; flex-wrap: wrap; gap: 12rpx 32rpx; }
  .kb-meta-item { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
}

.section {
  margin: 24rpx 32rpx; background: var(--color-surface, #fff); border-radius: 24rpx;
  box-shadow: var(--shadow-sm, 0 2rpx 6rpx rgba(0,0,0,0.04)); overflow: hidden;
}

.section-header {
  display: flex; align-items: center; justify-content: space-between; padding: 28rpx 32rpx 16rpx;
  .section-title { font-size: 30rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .section-add {
    width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center;
    border-radius: 14rpx; background: var(--color-primary-soft, #E8F8EF);
    &:active { opacity: 0.7; }
    .add-icon { font-size: 36rpx; color: var(--color-primary, #25B864); font-weight: 600; }
  }
}

.dir-list { padding-bottom: 8rpx; }

.dir-item {
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F2);
  &:last-child { border-bottom: none; }
}

.dir-row {
  display: flex; align-items: center; gap: 12rpx; padding: 20rpx 32rpx;
  &:active { background: var(--color-surface-soft, #F8FAF9); }
}

.dir-arrow {
  font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); width: 32rpx; text-align: center;
  transition: transform 0.2s; transform: rotate(-90deg);
  &.expanded { transform: rotate(0deg); }
}

.dir-arrow-placeholder { width: 32rpx; }

.dir-icon { font-size: 36rpx; }

.dir-name { flex: 1; font-size: 28rpx; font-weight: 500; color: var(--color-text, #1F2329); }

.dir-action-btn {
  width: 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center;
  border-radius: 10rpx; background: var(--color-primary-soft, #E8F8EF);
  &:active { opacity: 0.7; }
  .action-icon { font-size: 28rpx; color: var(--color-primary, #25B864); font-weight: 700; }
}

.empty-dir {
  padding: 40rpx 32rpx; text-align: center;
  .empty-hint { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
}

.doc-list {
  .doc-item {
    display: flex; align-items: center; padding: 28rpx 32rpx;
    border-bottom: 1rpx solid var(--color-border-light, #F1F5F2);
    &:last-child { border-bottom: none; }
    &:active { background: var(--color-surface-soft, #F8FAF9); }
  }
  .doc-icon-box {
    width: 72rpx; height: 72rpx; background: var(--color-surface-soft, #F1F5F2); border-radius: 16rpx;
    display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 24rpx; flex-shrink: 0;
  }
  .doc-body { flex: 1; min-width: 0; }
  .doc-title { font-size: 30rpx; font-weight: 500; color: var(--color-text, #1F2329); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  .doc-sub { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); margin-top: 4rpx; display: block; }
}

.fab {
  position: fixed; bottom: 200rpx; right: 40rpx; width: 96rpx; height: 96rpx;
  background: var(--color-primary, #25B864); border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.4);
  &:active { transform: scale(0.92); }
  .fab-icon { font-size: 48rpx; color: var(--color-btn-text, #fff); font-weight: 600; }
}

/* 弹窗 */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
  display: none; align-items: flex-end; justify-content: center; z-index: 200;
  &.active { display: flex; }
}
.modal {
  background: var(--color-surface, #fff); width: 100%; max-width: 750rpx; border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 32rpx 48rpx; max-height: 80vh; overflow-y: auto;
}
.modal-handle { width: 64rpx; height: 8rpx; background: var(--color-border, #E8E9EB); border-radius: 4rpx; margin: 0 auto 24rpx; }
.modal-title { font-size: 34rpx; font-weight: 700; color: var(--color-text, #1F2329); display: block; margin-bottom: 32rpx; text-align: center; }
.form-card { background: var(--color-surface-soft, #F8FAF9); border-radius: 24rpx; padding: 24rpx; border: 1rpx solid var(--color-border-light, #E8E9EB); margin-bottom: 32rpx; }
.fgs-full { margin-bottom: 20rpx; &:last-child { margin-bottom: 0; } }
.fg-label { font-size: 26rpx; font-weight: 700; color: var(--color-text, #1F2329); margin-bottom: 12rpx; display: block; }
.required { color: #ef4444; }
.fg-input-wrap { background: var(--color-surface, #fff); border: 1rpx solid var(--color-border-light, #E8E9EB); border-radius: 18rpx; padding: 0 24rpx; &:focus-within { border-color: var(--color-primary, #25B864); } }
.fg-input { height: 82rpx; font-size: 30rpx; color: var(--color-text, #1F2329); }
.field-placeholder { color: var(--color-text-tertiary, #C0C4CC); }

.parent-dir-row {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--color-surface, #fff); border: 1rpx solid var(--color-border-light, #E8E9EB);
  border-radius: 18rpx; padding: 20rpx 24rpx; min-height: 82rpx;
  &:active { background: var(--color-surface-soft, #F8FAF9); }
  .parent-dir-text { font-size: 30rpx; color: var(--color-text, #1F2329); }
  .parent-dir-arrow { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); }
}

.form-actions { display: flex; gap: 20rpx; }
.btn-secondary { flex: 1; height: 88rpx; display: flex; align-items: center; justify-content: center; background: var(--color-surface-soft, #F1F5F2); border-radius: 20rpx; font-size: 30rpx; font-weight: 600; color: var(--color-text-secondary, #646A73); &:active { opacity: 0.8; } }
.btn-primary { flex: 1.2; height: 88rpx; display: flex; align-items: center; justify-content: center; background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25B864), #1DA05A)); border-radius: 20rpx; box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3); &:active { opacity: 0.9; transform: scale(0.98); } .btn-text { font-size: 30rpx; font-weight: 600; color: var(--color-btn-text, #fff); } }
</style>
