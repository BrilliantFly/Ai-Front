<template>
  <view class="file-preview">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="header-title">{{ file.originalName || '文件预览' }}</text>
      <view class="header-right" v-if="file.documentId">
        <view class="doc-btn" @tap="goToDocument">
          <text class="doc-icon">📄</text>
        </view>
      </view>
      <view class="placeholder" v-else></view>
    </view>

    <!-- 文件信息 -->
    <view class="info-bar" v-if="file.id">
      <text class="info-tag" :class="'tag-' + file.fileExt">{{ file.fileExt }}</text>
      <text class="info-text">{{ formatFileSize(file.fileSize) }}</text>
      <text class="info-text">{{ formatTime(file.createTime) }}</text>
      <text class="info-status" :class="'status-' + file.parseStatus">
        {{ getParseStatusText(file.parseStatus) }}
      </text>
    </view>

    <!-- 解析失败提示 -->
    <view class="error-bar" v-if="file.parseError">
      <text class="error-text">解析失败: {{ file.parseError }}</text>
      <view class="retry-btn" @tap="handleParse">
        <text class="retry-text">重新解析</text>
      </view>
    </view>

    <!-- 预览内容 -->
    <view class="preview-area" v-if="file.id">
      <!-- Markdown 渲染 -->
      <view v-if="isMarkdown" class="md-render">
        <!-- H5/App 用 web-view iframe 渲染 marked.js -->
        <!-- #ifdef H5 || APP-PLUS -->
        <web-view :src="mdIframeSrc" v-if="mdIframeSrc"></web-view>
        <!-- #endif -->
        <!-- 小程序用 rich-text 渲染转换后的 HTML -->
        <!-- #ifdef MP-WEIXIN -->
        <rich-text :nodes="renderedHtml" class="md-rich-text"></rich-text>
        <!-- #endif -->
      </view>

      <!-- HTML 渲染 -->
      <view v-else class="html-render">
        <!-- #ifdef H5 || APP-PLUS -->
        <web-view :src="htmlIframeSrc" v-if="htmlIframeSrc"></web-view>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <rich-text :nodes="file.fileContent" class="html-rich-text"></rich-text>
        <!-- #endif -->
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-else-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📄</text>
      <text class="empty-text">文件不存在或已删除</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getUploadedFile, parseUploadedFile } from '@/api/knowledge'

const fileId = ref(0)
const file = ref<any>({})
const loading = ref(true)
const renderedHtml = ref('')

const isMarkdown = computed(() => {
  const ext = file.value.fileExt
  return ext === 'md' || ext === 'markdown'
})

// H5/App: 用 data URI 渲染 HTML 内容
const htmlIframeSrc = computed(() => {
  if (!file.value.fileContent) return ''
  // #ifdef H5 || APP-PLUS
  const encoded = encodeURIComponent(file.value.fileContent)
  return `data:text/html;charset=utf-8,${encoded}`
  // #endif
  // #ifndef H5 || APP-PLUS
  return ''
  // #endif
})

// H5/App: Markdown 用 iframe + marked.js CDN 渲染
const mdIframeSrc = computed(() => {
  if (!file.value.fileContent) return ''
  // #ifdef H5 || APP-PLUS
  const mdContent = file.value.fileContent.replace(/`/g, '\\`')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:16px;line-height:1.6;color:#333;}pre{background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto;}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;}blockquote{border-left:4px solid #25B864;margin:0;padding-left:16px;color:#666;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}img{max-width:100%;}</style><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script></head><body><div id="content"></div><script>document.getElementById('content').innerHTML=marked.parse(\`${mdContent}\`);<\/script></body></html>`
  const encoded = encodeURIComponent(html)
  return `data:text/html;charset=utf-8,${encoded}`
  // #endif
  // #ifndef H5 || APP-PLUS
  return ''
  // #endif
})

const loadData = async () => {
  if (!fileId.value) return
  loading.value = true
  try {
    const res = await getUploadedFile(fileId.value)
    file.value = res?.data || res || {}
    // 小程序端需要将 Markdown 转为 HTML
    // #ifdef MP-WEIXIN
    if (isMarkdown.value) {
      renderedHtml.value = simpleMarkdownToHtml(file.value.fileContent)
    }
    // #endif
  } catch (e) {
    console.error('加载文件失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const handleParse = async () => {
  try {
    uni.showLoading({ title: '解析中...' })
    await parseUploadedFile(fileId.value)
    uni.hideLoading()
    uni.showToast({ title: '解析成功', icon: 'success' })
    loadData()
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e || '解析失败', icon: 'none' })
  }
}

const goToDocument = () => {
  uni.navigateTo({ url: `/pages/knowledge/document-view/index?id=${file.value.documentId}` })
}

const goBack = () => {
  uni.navigateBack()
}

// 小程序端简易 Markdown 转 HTML (仅处理基础语法)
const simpleMarkdownToHtml = (md: string) => {
  if (!md) return ''
  let html = md
  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 标题
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  // 引用
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
  // 无序列表
  html = html.replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>')
  // 有序列表
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
  // 分割线
  html = html.replace(/^---$/gm, '<hr/>')
  // 换行
  html = html.replace(/\n/g, '<br/>')
  return html
}

const getParseStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '待解析', 1: '成功', 2: '失败' }
  return map[status] || '未知'
}

const formatFileSize = (size: number) => {
  if (!size) return '0 B'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onLoad((options) => {
  if (options?.id) {
    fileId.value = Number(options.id)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.file-preview {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
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
    flex: 1;
    font-size: 30rpx;
    font-weight: 500;
    color: var(--color-text, #1F2329);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }
  .header-right {
    .doc-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      &:active { background: var(--color-surface-soft, rgba(0,0,0,0.04)); }
      .doc-icon { font-size: 32rpx; }
    }
  }
  .placeholder { width: 72rpx; }
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  background: var(--color-surface, #fff);
  border-bottom: 1rpx solid var(--color-border-light, #F1F5F2);
  .info-tag {
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-weight: 600;
    text-transform: uppercase;
    &.tag-html, &.tag-htm { background: #E8F3FF; color: #1677ff; }
    &.tag-md, &.tag-markdown { background: #FFF7E8; color: #fa8c16; }
  }
  .info-text { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); }
  .info-status {
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-weight: 500;
    &.status-0 { background: #F5F6F7; color: #8F959E; }
    &.status-1 { background: var(--color-primary-soft, #E8F8EF); color: var(--color-primary, #25B864); }
    &.status-2 { background: #FFF1F0; color: #ff4d4f; }
  }
}

.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: #FFF1F0;
  border-bottom: 1rpx solid #FFCCC7;
  .error-text { font-size: 26rpx; color: #ff4d4f; flex: 1; }
  .retry-btn {
    padding: 10rpx 24rpx;
    background: var(--color-primary, #25B864);
    border-radius: 12rpx;
    &:active { opacity: 0.8; }
    .retry-text { font-size: 24rpx; color: #fff; font-weight: 500; }
  }
}

.preview-area {
  padding: 24rpx;
  min-height: 400rpx;
}

.md-render, .html-render {
  background: var(--color-surface, #fff);
  border-radius: 16rpx;
  padding: 16rpx;
  min-height: 400rpx;
}

// #ifdef MP-WEIXIN
.md-rich-text, .html-rich-text {
  font-size: 30rpx;
  line-height: 1.8;
  color: var(--color-text-secondary, #4E5969);
  word-break: break-all;
}
// #endif

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  .loading-text, .empty-text { font-size: 28rpx; color: var(--color-text-tertiary, #8F959E); }
  .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
}
</style>
