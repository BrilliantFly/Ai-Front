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

    <!-- 底部状态栏 -->
    <view class="footer">
      <view class="footer-stat">
        <text class="stat-text">{{ wordCount }}字</text>
      </view>
      <view class="footer-right">
        <text class="footer-save" @tap="handleSave">{{ saving ? '保存中...' : '保存' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { getDocument, addDocument, updateDocument, deleteDocument } from '@/api/knowledge'

const router = useRouter()

const docId = ref(0)
const kbId = ref(0)
const docTitle = ref('')
const docContent = ref('')
const saving = ref(false)

const wordCount = computed(() => {
  return (docContent.value || '').replace(/\s/g, '').length
})

const loadData = async () => {
  if (docId.value) {
    try {
      const res = await getDocument(docId.value)
      const doc = res?.data || res || {}
      docTitle.value = doc.title || ''
      docContent.value = doc.content || ''
      kbId.value = doc.knowledgeBaseId || kbId.value
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
  // 文本模式下在光标位置插入标记
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
    const data: any = {
      title: docTitle.value.trim(),
      content: docContent.value,
      knowledgeBaseId: kbId.value,
      contentType: 'richtext'
    }
    if (docId.value) {
      data.id = docId.value
      await updateDocument(data)
    } else {
      const res = await addDocument(data)
      if (res?.data) docId.value = res.data
    }
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
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
  min-height: calc(100vh - 400rpx);
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
}

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
</style>
