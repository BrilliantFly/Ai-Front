<template>
  <view class="document-edit">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">‹</text>
        </view>
        <text class="header-title">{{ docTitle || '新建文档' }}</text>
      </view>
      <view class="header-right">
        <view class="icon-btn" @tap="handleMore">
          <text class="dots-icon">⋯</text>
        </view>
      </view>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="tool-group">
        <view class="tool-btn" @tap="execCmd('bold')">
          <text class="tool-icon tool-bold">B</text>
        </view>
        <view class="tool-btn" @tap="execCmd('italic')">
          <text class="tool-icon tool-italic">I</text>
        </view>
        <view class="tool-btn" @tap="execCmd('underline')">
          <text class="tool-icon tool-underline">U</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="execCmd('heading', 'h1')">
          <text class="tool-icon">H1</text>
        </view>
        <view class="tool-btn" @tap="execCmd('heading', 'h2')">
          <text class="tool-icon">H2</text>
        </view>
        <view class="tool-btn" @tap="execCmd('heading', 'h3')">
          <text class="tool-icon">H3</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="execCmd('list', 'unordered')">
          <text class="tool-icon">•≡</text>
        </view>
        <view class="tool-btn" @tap="execCmd('list', 'ordered')">
          <text class="tool-icon">1≡</text>
        </view>
        <view class="tool-btn" @tap="execCmd('blockquote')">
          <text class="tool-icon">❝</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="insertLink">
          <text class="tool-icon">🔗</text>
        </view>
        <view class="tool-btn" @tap="insertCode">
          <text class="tool-icon">&lt;/&gt;</text>
        </view>
        <view class="tool-btn" @tap="chooseImage">
          <text class="tool-icon">🖼️</text>
        </view>
      </view>
    </view>

    <!-- 编辑器区域 -->
    <view class="editor">
      <input class="editor-title" v-model="docTitle" placeholder="请输入标题" placeholder-class="field-placeholder" />
      <view class="editor-divider"></view>
      <textarea
        class="editor-body"
        v-model="docContent"
        placeholder="开始写作..."
        placeholder-class="field-placeholder"
        :maxlength="50000"
        auto-height
      />
    </view>

    <!-- 文档设置区 -->
    <view class="settings-section">
      <!-- 目录选择 -->
      <view class="setting-row" @tap="showDirPicker">
        <text class="setting-label">📁 所属目录</text>
        <view class="setting-value">
          <text class="setting-text">{{ selectedDirName || '未分配目录' }}</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>

      <!-- 标签选择 -->
      <view class="setting-row" @tap="showTagPicker">
        <text class="setting-label">🏷️ 标签</text>
        <view class="setting-value">
          <view class="selected-tags" v-if="selectedTags.length > 0">
            <text class="selected-tag" v-for="t in selectedTags" :key="t.id">{{ t.name }}</text>
          </view>
          <text class="setting-text" v-else>选择标签</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>

      <!-- 可见性 -->
      <view class="setting-row">
        <text class="setting-label">👁️ 可见性</text>
        <view class="setting-value">
          <view class="visibility-toggle">
            <view class="vis-opt" :class="{ active: docVisibility === 0 }" @tap="docVisibility = 0">私密</view>
            <view class="vis-opt" :class="{ active: docVisibility === 1 }" @tap="docVisibility = 1">公开</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部状态栏 -->
    <view class="footer">
      <view class="footer-stat">
        <text class="stat-text">{{ wordCount }}字</text>
        <text class="stat-text" v-if="lastSaved">· 已保存 {{ formatTime(lastSaved) }}</text>
      </view>
      <view class="footer-right">
        <text class="footer-save" @tap="handleSave">{{ saving ? '保存中...' : '保存' }}</text>
      </view>
    </view>

    <!-- 目录选择弹窗 -->
    <view class="modal-overlay" :class="{ active: showDirModal }" @tap="closeDirModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">选择目录</text>
        <view class="picker-list">
          <view class="picker-item" :class="{ active: selectedDirId === 0 }" @tap="selectDir(0, '未分配目录')">
            <text class="picker-text">未分配目录</text>
            <text class="picker-check" v-if="selectedDirId === 0">✓</text>
          </view>
          <view v-for="dir in flatDirs" :key="dir.id" class="picker-item" :class="{ active: selectedDirId === dir.id }" @tap="selectDir(dir.id, dir.name)">
            <text class="picker-text" :style="{ paddingLeft: (dir.depth * 40 + 24) + 'rpx' }">{{ dir.name }}</text>
            <text class="picker-check" v-if="selectedDirId === dir.id">✓</text>
          </view>
        </view>
        <view class="form-actions">
          <view class="btn-primary" @tap="closeDirModal">
            <text class="btn-text">确定</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 标签选择弹窗 -->
    <view class="modal-overlay" :class="{ active: showTagModal }" @tap="closeTagModal">
      <view class="modal" @tap.stop>
        <view class="modal-handle"></view>
        <text class="modal-title">选择标签</text>
        <view class="picker-list">
          <view 
            v-for="tag in availableTags" 
            :key="tag.id" 
            class="picker-item tag-item" 
            :class="{ active: isTagSelected(tag.id) }"
            @tap="toggleTag(tag)"
          >
            <text class="picker-text">{{ tag.name }}</text>
            <view class="tag-color-dot" :style="{ background: tag.color || '#25B864' }"></view>
            <text class="picker-check" v-if="isTagSelected(tag.id)">✓</text>
          </view>
        </view>
        <view class="form-actions">
          <view class="btn-primary" @tap="closeTagModal">
            <text class="btn-text">确定 ({{ selectedTags.length }})</text>
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
  getDocument, addDocument, updateDocument, deleteDocument, 
  getDirectoryTree, getTagList, uploadImage 
} from '@/api/knowledge'

const router = useRouter()

const docId = ref(0)
const kbId = ref(0)
const docTitle = ref('')
const docContent = ref('')
const docVisibility = ref(0 as 0 | 1)
const saving = ref(false)
const lastSaved = ref(0)

// 目录相关
const showDirModal = ref(false)
const selectedDirId = ref(0)
const selectedDirName = ref('未分配目录')
const treeData = ref<any[]>([])

// 标签相关
const showTagModal = ref(false)
const availableTags = ref<any[]>([])
const selectedTags = ref<any[]>([])

const flatDirs = computed(() => {
  const result: any[] = []
  const walk = (dirs: any[], depth: number) => {
    for (const dir of dirs) {
      result.push({ id: dir.id, name: dir.name, depth })
      if (dir.children && dir.children.length > 0) {
        walk(dir.children, depth + 1)
      }
    }
  }
  walk(treeData.value, 0)
  return result
})

const wordCount = computed(() => {
  return (docContent.value || '').replace(/\s/g, '').length
})

const loadData = async () => {
  // 加载目录树
  if (kbId.value) {
    try {
      const dirRes = await getDirectoryTree(kbId.value)
      treeData.value = dirRes?.data || dirRes || []
    } catch (e) {
      console.error('加载目录失败', e)
    }
  }

  // 加载标签列表
  try {
    const tagRes = await getTagList({ pageNum: 1, pageSize: 100 })
    availableTags.value = tagRes?.data?.records || tagRes?.records || []
  } catch (e) {
    console.error('加载标签失败', e)
  }

  // 加载文档
  if (docId.value) {
    try {
      const res = await getDocument(docId.value)
      const doc = res?.data || res || {}
      docTitle.value = doc.title || ''
      docContent.value = doc.content || ''
      docVisibility.value = doc.visibility ?? 0
      kbId.value = doc.knowledgeBaseId || kbId.value
      selectedDirId.value = doc.directoryId || 0
      selectedDirName.value = doc.directoryName || '未分配目录'
      if (doc.tags) {
        const tagNames = doc.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        selectedTags.value = tagNames.map((name: string) => ({ id: 0, name }))
      }
    } catch (e) {
      console.error('加载文档失败', e)
    }
  }
}

const goBack = () => {
  if (docTitle.value || docContent.value) {
    handleSave().then(() => uni.navigateBack())
  } else {
    uni.navigateBack()
  }
}

const execCmd = (command: string, value?: string) => {
  const markers: Record<string, string> = {
    bold: '**加粗文本**',
    italic: '*斜体文本*',
    underline: '<u>下划线文本</u>',
    h1: '\n# 标题\n',
    h2: '\n## 标题\n',
    h3: '\n### 标题\n',
    blockquote: '\n> 引用文本\n',
    'list-unordered': '\n- 列表项\n',
    'list-ordered': '\n1. 列表项\n'
  }
  const key = value ? `${command}-${value}` : command
  if (markers[key]) {
    docContent.value += markers[key]
  }
}

const insertLink = () => {
  uni.showModal({
    title: '插入链接',
    editable: true,
    placeholderText: '请输入链接文字',
    success: (res) => {
      if (res.confirm && res.content) {
        const text = res.content
        uni.showModal({
          title: '链接地址',
          editable: true,
          placeholderText: '请输入URL',
          success: (r) => {
            if (r.confirm && r.content) {
              docContent.value += `[${text}](${r.content})`
            }
          }
        })
      }
    }
  })
}

const insertCode = () => {
  docContent.value += '\n```\n代码\n```\n'
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      try {
        const filePath = res.tempFilePaths[0]
        // 上传图片获取URL
        const uploadRes = await uploadImage(filePath)
        if (uploadRes?.data) {
          docContent.value += `\n![图片](${uploadRes.data})\n`
          uni.showToast({ title: '图片已插入', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    }
  })
}

// 目录选择
const showDirPicker = () => { showDirModal.value = true }
const closeDirModal = () => { showDirModal.value = false }
const selectDir = (id: number, name: string) => {
  selectedDirId.value = id
  selectedDirName.value = name
}

// 标签选择
const showTagPicker = () => { showTagModal.value = true }
const closeTagModal = () => { showTagModal.value = false }

const isTagSelected = (tagId: number) => {
  return selectedTags.value.some(t => t.id === tagId)
}

const toggleTag = (tag: any) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push({ id: tag.id, name: tag.name })
  }
}

const handleMore = () => {
  const actions = ['保存']
  if (docId.value) {
    actions.push('删除文档')
  }
  uni.showActionSheet({
    itemList: actions,
    success: (res) => {
      if (res.tapIndex === 0) {
        handleSave()
      } else if (res.tapIndex === 1 && docId.value) {
        confirmDelete()
      }
    }
  })
}

const confirmDelete = () => {
  uni.showModal({
    title: '删除文档',
    content: '确定要删除这篇文档吗？不可恢复。',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteDocument(docId.value)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 500)
        } catch (e) {
          console.error('删除失败', e)
        }
      }
    }
  })
}

const handleSave = async () => {
  if (saving.value) return
  if (!docTitle.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const tagsStr = selectedTags.value.map(t => t.name).join(',')
    const data: any = {
      title: docTitle.value.trim(),
      content: docContent.value,
      knowledgeBaseId: kbId.value,
      contentType: 'richtext',
      visibility: docVisibility.value,
      directoryId: selectedDirId.value || undefined,
      tags: tagsStr || undefined
    }
    if (docId.value) {
      data.id = docId.value
      await updateDocument(data)
    } else {
      const res = await addDocument(data)
      if (res?.data) docId.value = res.data
    }
    lastSaved.value = Date.now()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60 * 60 * 1000) return '刚刚'
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

onLoad((options) => {
  if (options?.id) docId.value = Number(options.id)
  if (options?.kbId) kbId.value = Number(options.kbId)
  loadData()
})
</script>

<style scoped lang="scss">
.document-edit {
  min-height: 100vh;
  background: var(--color-surface, #fff);
  padding-bottom: 112rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(96rpx + var(--status-bar-height));
  padding: var(--status-bar-height) 16rpx 0;
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

  .header-right { display: flex; align-items: center; gap: 4rpx; }

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

  .icon-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    flex-shrink: 0;

    &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
    .dots-icon { font-size: 44rpx; color: var(--color-text, #1F2329); font-weight: 700; }
  }
}

.toolbar {
  position: sticky;
  top: 96rpx;
  z-index: 90;
  background: var(--color-surface-soft, #FAFBFA);
  padding: 12rpx 16rpx;
  display: flex;
  gap: 4rpx;
  overflow-x: auto;
  border-bottom: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));

  &::-webkit-scrollbar { display: none; }
}

.tool-group {
  display: flex;
  gap: 4rpx;
  padding-right: 12rpx;
  margin-right: 12rpx;
  border-right: 1rpx solid var(--color-border, #E8E9EB);

  &:last-child { border-right: none; margin-right: 0; padding-right: 0; }
}

.tool-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  flex-shrink: 0;

  &:active { background: var(--color-primary-soft, #E8F8EF); }
}

.tool-icon {
  font-size: 28rpx;
  color: var(--color-text, #1F2329);
  font-weight: 600;
}

.tool-bold { font-weight: 800; }
.tool-italic { font-style: italic; }
.tool-underline { text-decoration: underline; }

.editor {
  padding: 48rpx 32rpx;
  min-height: 400rpx;
}

.editor-title {
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 24rpx;
  outline: none;
  border: none;
  width: 100%;
  color: var(--color-text, #1F2329);
}

.editor-divider {
  height: 1rpx;
  background: var(--color-border-light, #E8E9EB);
  margin-bottom: 32rpx;
}

.editor-body {
  width: 100%;
  min-height: 800rpx;
  font-size: 32rpx;
  line-height: 1.8;
  color: var(--color-text, #1F2329);
}

.field-placeholder { color: var(--color-text-tertiary, #C9CDD4); }

/* ===== 文档设置区 ===== */
.settings-section {
  background: var(--color-surface-soft, #F8FAF9);
  margin: 24rpx 32rpx;
  border-radius: 20rpx;
  padding: 8rpx 0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid var(--color-border-light, #E8E9EB);
  
  &:last-child { border-bottom: none; }
  &:active { background: var(--color-surface, rgba(255,255,255,0.5)); }

  .setting-label {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
  }

  .setting-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .setting-text {
    font-size: 26rpx;
    color: var(--color-text-tertiary, #8F959E);
  }

  .setting-arrow {
    font-size: 28rpx;
    color: var(--color-text-tertiary, #C9CDD4);
  }
}

.selected-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.selected-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: var(--color-primary-soft, #E8F8EF);
  color: var(--color-primary, #25B864);
}

.visibility-toggle {
  display: flex;
  gap: 8rpx;
  background: var(--color-surface, #fff);
  border-radius: 12rpx;
  padding: 4rpx;
  border: 1rpx solid var(--color-border-light, #E8E9EB);
}

.vis-opt {
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: var(--color-text-secondary, #646A73);
  
  &.active {
    background: var(--color-primary, #25B864);
    color: #fff;
  }
}

/* ===== 底部状态栏 ===== */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 96rpx;
  background: var(--color-surface, rgba(255,255,255,0.95));
  backdrop-filter: blur(24rpx);
  border-top: 1rpx solid var(--color-border-light, rgba(0,0,0,0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  z-index: 100;

  .footer-stat {
    display: flex;
    align-items: center;
    gap: 8rpx;
    .stat-text { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
  }

  .footer-right { display: flex; align-items: center; }

  .footer-save {
    font-size: 28rpx;
    color: var(--color-primary, #25B864);
    font-weight: 600;
    padding: 12rpx 24rpx;
    border-radius: 12rpx;

    &:active { background: var(--color-primary-soft, #E8F8EF); }
  }
}

/* ===== 弹窗 ===== */
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
  max-height: 60vh;
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
  margin-bottom: 24rpx;
  text-align: center;
}

.picker-list {
  margin-bottom: 24rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 16rpx;
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F2);
  
  &:last-child { border-bottom: none; }
  &:active { background: var(--color-surface-soft, #F8FAF9); }
  
  &.active {
    background: var(--color-primary-soft, #E8F8EF);
  }

  .picker-text { font-size: 28rpx; color: var(--color-text, #1F2329); }
  .picker-check { font-size: 28rpx; color: var(--color-primary, #25B864); font-weight: 600; }
}

.tag-item {
  .tag-color-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    margin-left: auto;
    margin-right: 12rpx;
  }
}

.form-actions { display: flex; gap: 20rpx; }
.btn-primary {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #25B864), #1DA05A));
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3);
  &:active { opacity: 0.9; transform: scale(0.98); }
  .btn-text { font-size: 30rpx; font-weight: 600; color: var(--color-btn-text, #fff); }
}
</style>
