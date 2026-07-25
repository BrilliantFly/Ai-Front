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
        <view class="kb-pill" @tap="selectKB">
          <text class="pill-icon">📍</text>
          <text class="pill-text">{{ kbName || '选择知识库' }}</text>
        </view>
        <view class="icon-btn" @tap="handleShare">
          <text class="iconfont">📤</text>
        </view>
        <view class="icon-btn" @tap="handleMore">
          <text class="iconfont">⋯</text>
        </view>
      </view>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="tool-group">
        <view class="tool-btn" @tap="execCommand('bold')">
          <text class="tool-icon">B</text>
        </view>
        <view class="tool-btn" @tap="execCommand('italic')">
          <text class="tool-icon" style="font-style: italic">I</text>
        </view>
        <view class="tool-btn" @tap="execCommand('underline')">
          <text class="tool-icon" style="text-decoration: underline">U</text>
        </view>
        <view class="tool-btn" @tap="execCommand('strikethrough')">
          <text class="tool-icon" style="text-decoration: line-through">S</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="execCommand('formatBlock', 'h1')">
          <text class="tool-icon">H1</text>
        </view>
        <view class="tool-btn" @tap="execCommand('formatBlock', 'h2')">
          <text class="tool-icon">H2</text>
        </view>
        <view class="tool-btn" @tap="execCommand('formatBlock', 'h3')">
          <text class="tool-icon">H3</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="execCommand('formatBlock', 'blockquote')">
          <text class="tool-icon">❝</text>
        </view>
        <view class="tool-btn" @tap="execCommand('insertUnorderedList')">
          <text class="tool-icon">•≡</text>
        </view>
        <view class="tool-btn" @tap="execCommand('insertOrderedList')">
          <text class="tool-icon">1≡</text>
        </view>
      </view>
      <view class="tool-group">
        <view class="tool-btn" @tap="insertImage">
          <text class="tool-icon">🖼️</text>
        </view>
        <view class="tool-btn" @tap="insertLink">
          <text class="tool-icon">🔗</text>
        </view>
        <view class="tool-btn" @tap="insertTable">
          <text class="tool-icon">📊</text>
        </view>
        <view class="tool-btn" @tap="insertCode">
          <text class="tool-icon">&lt;/&gt;</text>
        </view>
      </view>
    </view>

    <!-- 编辑器区域 -->
    <view class="editor">
      <input class="editor-title" v-model="docTitle" placeholder="请输入标题" />
      <view class="editor-body" :contenteditable="true" ref="editorRef" @input="handleInput"></view>
    </view>

    <!-- 底部状态栏 -->
    <view class="footer">
      <view class="footer-stat">
        <text class="stat-icon">📄</text>
        <text class="stat-text">{{ wordCount }}字 · 最后编辑 {{ lastEditTime }}</text>
      </view>
      <text class="footer-save" @tap="handleSave">{{ saving ? '保存中...' : '已保存' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import { getDocument, addDocument, updateDocument } from '@/api/knowledge'

const router = useRouter()

const docId = ref(0)
const kbId = ref(0)
const kbName = ref('')
const docTitle = ref('')
const docContent = ref('')
const wordCount = ref(0)
const lastEditTime = ref('刚刚')
const saving = ref(false)
const editorRef = ref()

const loadData = async () => {
  if (docId.value) {
    try {
      const res = await getDocument(docId.value)
      const doc = res?.data || {}
      docTitle.value = doc.title || ''
      docContent.value = doc.content || ''
      kbId.value = doc.knowledgeBaseId || 0
      // 设置编辑器内容
      if (editorRef.value) {
        editorRef.value.innerHTML = docContent.value
      }
      updateWordCount()
    } catch (e) {
      console.error('加载文档失败', e)
    }
  }
}

const goBack = () => {
  uni.navigateBack()
}

const selectKB = () => {
  // TODO: 选择知识库
}

const handleShare = () => {
  // TODO: 分享功能
}

const handleMore = () => {
  // TODO: 更多操作
}

const execCommand = (command: string, value?: string) => {
  // TODO: 使用 uni-app editor 组件的命令
  console.log('execCommand', command, value)
}

const insertImage = () => {
  // TODO: 插入图片
}

const insertLink = () => {
  // TODO: 插入链接
}

const insertTable = () => {
  // TODO: 插入表格
}

const insertCode = () => {
  // TODO: 插入代码块
}

const handleInput = (e: any) => {
  docContent.value = e.detail?.html || ''
  updateWordCount()
}

const updateWordCount = () => {
  const text = editorRef.value?.innerText || ''
  wordCount.value = text.replace(/\s/g, '').length
}

const handleSave = async () => {
  if (saving.value) return
  saving.value = true
  
  try {
    const data = {
      id: docId.value || undefined,
      title: docTitle.value,
      content: docContent.value,
      knowledgeBaseId: kbId.value,
      contentType: 'richtext'
    }
    
    if (docId.value) {
      await updateDocument(data)
    } else {
      const res = await addDocument(data)
      if (res?.data) {
        docId.value = res.data
      }
    }
    
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((options) => {
  if (options?.id) {
    docId.value = Number(options.id)
  }
  if (options?.kbId) {
    kbId.value = Number(options.kbId)
  }
  loadData()
})
</script>

<style scoped lang="scss">
.document-edit {
  min-height: 100vh;
  background: #fff;
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
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(24rpx);
  border-bottom: 1rpx solid rgba(0,0,0,0.06);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    min-width: 0;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  
  .back-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    
    &:active {
      background: rgba(0,0,0,0.04);
    }
    
    .back-icon {
      font-size: 48rpx;
      color: #1F2329;
    }
  }
  
  .header-title {
    font-size: 30rpx;
    font-weight: 500;
    color: #1F2329;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  
  .kb-pill {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 20rpx;
    background: #F1F5F2;
    border-radius: 32rpx;
    font-size: 24rpx;
    color: #646A73;
    font-weight: 500;
    flex-shrink: 0;
    
    &:active {
      background: #E8F8EF;
      color: #25B864;
    }
  }
  
  .icon-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    flex-shrink: 0;
    
    &:active {
      background: rgba(0,0,0,0.04);
    }
    
    .iconfont {
      font-size: 40rpx;
    }
  }
}

.toolbar {
  position: sticky;
  top: 96rpx;
  z-index: 90;
  background: #FAFBFA;
  padding: 12rpx 16rpx;
  display: flex;
  gap: 4rpx;
  overflow-x: auto;
  border-bottom: 1rpx solid rgba(0,0,0,0.06);
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.tool-group {
  display: flex;
  gap: 4rpx;
  padding-right: 12rpx;
  margin-right: 12rpx;
  border-right: 1rpx solid #E8E9EB;
  
  &:last-child {
    border-right: none;
    margin-right: 0;
    padding-right: 0;
  }
}

.tool-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 12rpx;
  cursor: pointer;
  flex-shrink: 0;
  
  &:active {
    background: rgba(0,0,0,0.04);
  }
  
  &.active {
    background: #E8F8EF;
  }
}

.tool-icon {
  font-size: 28rpx;
  color: #1F2329;
  font-weight: 600;
}

.editor {
  padding: 48rpx 32rpx;
  min-height: calc(100vh - 400rpx);
}

.editor-title {
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 40rpx;
  outline: none;
  border: none;
  width: 100%;
  color: #1F2329;
}

.editor-body {
  font-size: 32rpx;
  line-height: 1.8;
  outline: none;
  min-height: 800rpx;
  color: #1F2329;
  
  &:empty:before {
    content: "开始写作...";
    color: #C9CDD4;
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 96rpx;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(24rpx);
  border-top: 1rpx solid rgba(0,0,0,0.06);
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
  
  .stat-icon {
    font-size: 28rpx;
  }
  
  .stat-text {
    font-size: 24rpx;
    color: #8F959E;
  }
}

.footer-save {
  font-size: 24rpx;
  color: #25B864;
  font-weight: 500;
}
</style>
