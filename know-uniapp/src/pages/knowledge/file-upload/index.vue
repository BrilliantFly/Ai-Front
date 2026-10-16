<template>
  <view class="file-upload">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="header-title">文件导入</text>
      <view class="placeholder"></view>
    </view>

    <!-- 目标知识库选择 -->
    <view class="kb-section">
      <text class="kb-label">目标知识库</text>
      <picker
        mode="selector"
        :range="kbNames"
        :value="kbIndex"
        :disabled="kbList.length === 0"
        @change="onKbChange"
      >
        <view class="kb-picker" :class="{ 'kb-picker-empty': kbList.length === 0 }">
          <text class="kb-picker-text">
            {{ kbList.length > 0 ? kbList[kbIndex]?.name : '暂无知识库，请先在「知识库」中创建' }}
          </text>
          <text v-if="kbList.length > 0" class="kb-picker-arrow">›</text>
        </view>
      </picker>
      <text v-if="kbList.length > 0" class="kb-tip">上传的 .html / .md 将解析到该知识库</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section">
      <view class="upload-card" @tap="chooseFile">
        <text class="upload-icon">📤</text>
        <text class="upload-title">点击选择文件</text>
        <text class="upload-desc">支持 .html / .htm / .md / .markdown</text>
        <text class="upload-limit">单个文件 ≤ 5MB</text>
      </view>
    </view>

    <!-- 上传进度 -->
    <view class="progress-section" v-if="uploading">
      <view class="progress-card">
        <text class="progress-text">正在上传: {{ currentFileName }}</text>
        <view class="progress-bar">
          <view class="progress-inner" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-percent">{{ progressPercent }}%</text>
      </view>
    </view>

    <!-- 上传结果 -->
    <view class="result-section" v-if="result">
      <view class="result-card">
        <text class="result-title">上传结果</text>
        <view class="result-summary">
          <text class="result-success">成功 {{ result.successCount }}</text>
          <text class="result-fail" v-if="result.failCount > 0">失败 {{ result.failCount }}</text>
        </view>
        <view class="result-list">
          <view class="result-item" v-for="(item, idx) in result.items" :key="idx">
            <text class="result-item-name">{{ item.originalName }}</text>
            <text class="result-item-status" :class="'status-' + item.parseStatus">
              {{ item.parseStatus === 1 ? '成功' : '失败' }}
            </text>
            <text class="result-item-error" v-if="item.parseError">{{ item.parseError }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 最近上传列表 -->
    <view class="history-section">
      <text class="section-title">最近上传</text>
      <view class="history-list" v-if="list.length > 0">
        <view class="history-item" v-for="item in list" :key="item.id" @tap="goPreview(item)">
          <view class="history-icon" :class="'icon-' + item.fileExt">
            <text class="icon-text">{{ item.fileExt }}</text>
          </view>
          <view class="history-info">
            <text class="history-name">{{ item.originalName }}</text>
            <text class="history-meta">{{ formatFileSize(item.fileSize) }} · {{ formatTime(item.createTime) }}</text>
          </view>
          <view class="history-status">
            <text class="status-tag" :class="'tag-' + item.parseStatus">
              {{ getParseStatusText(item.parseStatus) }}
            </text>
          </view>
        </view>
      </view>
      <view class="empty-hint" v-else>
        <text class="empty-icon">📄</text>
        <text class="empty-text">暂无上传记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { getUploadedFilePage, uploadKnowledgeFile, getKnowledgeBaseOptions } from '@/api/knowledge'

const uploading = ref(false)
const currentFileName = ref('')
const progressPercent = ref(0)
const result = ref<any>(null)
const list = ref<any[]>([])

// 目标知识库
const kbList = ref<any[]>([])
const kbNames = ref<string[]>([])
const kbIndex = ref(0)

const loadKnowledgeBases = async () => {
  try {
    const res: any = await getKnowledgeBaseOptions()
    const arr = Array.isArray(res) ? res : res?.records || []
    kbList.value = arr
    kbNames.value = arr.map((kb: any) => kb.name)
    if (kbIndex.value >= arr.length) kbIndex.value = 0
  } catch (e) {
    console.error('加载知识库列表失败', e)
  }
}

const onKbChange = (e: any) => {
  kbIndex.value = Number(e.detail.value)
}

const currentKbId = () => kbList.value[kbIndex.value]?.id as number | undefined

const chooseFile = () => {
  if (kbList.value.length === 0) {
    uni.showToast({ title: '请先在「知识库」中创建知识库', icon: 'none', duration: 2500 })
    return
  }
  // #ifdef H5
  uni.chooseFile({
    count: 9,
    extension: ['.html', '.htm', '.md', '.markdown'],
    success: (res) => {
      const tempFiles = res.tempFiles || []
      if (tempFiles.length === 0) return
      uploadSequentially(tempFiles, 0)
    },
    fail: () => {
      uni.showToast({ title: '选择文件失败', icon: 'none' })
    }
  })
  // #endif
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 9,
    type: 'file',
    extension: ['html', 'htm', 'md', 'markdown'],
    success: (res) => {
      const tempFiles = res.tempFiles || []
      if (tempFiles.length === 0) return
      uploadSequentially(tempFiles, 0)
    },
    fail: () => {
      uni.showToast({ title: '选择文件失败', icon: 'none' })
    }
  })
  // #endif
  // #ifdef APP-PLUS
  chooseFileOnApp()
  // #endif
}

// #ifdef APP-PLUS
const ACCEPT_EXTS = ['.html', '.htm', '.md', '.markdown']

interface AppFileItem {
  name: string
  url: string
}

// App 端无 uni.chooseFile，用 plus.io 扫描常用目录后通过 ActionSheet 选择
const chooseFileOnApp = async () => {
  try {
    uni.showLoading({ title: '扫描文件中...', mask: true })
    const files = await scanAppFiles()
    if (files.length === 0) {
      uni.showToast({
        title: '未找到可导入文件，请将 .html/.md 放入下载目录',
        icon: 'none',
        duration: 3000
      })
      return
    }
    const picked = await new Promise<AppFileItem | null>((resolve) => {
      uni.showActionSheet({
        itemList: files.map((f) => f.name),
        success: (res) => resolve(files[res.tapIndex]),
        fail: () => resolve(null)
      })
    })
    if (picked) {
      uploadSequentially([{ name: picked.name, path: picked.url }], 0)
    }
  } catch (e) {
    console.error('App 端选择文件失败', e)
    uni.showToast({ title: '选择文件失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const scanAppFiles = (): Promise<AppFileItem[]> => {
  const dirs = ['_downloads/', '_documents/', '/storage/emulated/0/Download/']
  return new Promise((resolve) => {
    const plusObj = (window as any).plus
    if (!plusObj?.io) {
      resolve([])
      return
    }
    const collected: AppFileItem[] = []
    const seen = new Set<string>()
    let pending = dirs.length
    const finish = () => {
      pending--
      if (pending === 0) resolve(collected.slice(0, 6))
    }
    dirs.forEach((dir) => {
      plusObj.io.resolveLocalFileSystemURL(
        dir,
        (entry: any) => {
          const reader = entry.createReader()
          const readAll = () => {
            reader.readEntries(
              (entries: any[]) => {
                if (!entries.length) {
                  finish()
                  return
                }
                entries
                  .filter(
                    (it) =>
                      it.isFile &&
                      ACCEPT_EXTS.some((ext) => it.name.toLowerCase().endsWith(ext))
                  )
                  .forEach((it) => {
                    const url = it.toURL()
                    if (!seen.has(url)) {
                      seen.add(url)
                      collected.push({ name: it.name, url })
                    }
                  })
                readAll()
              },
              () => finish()
            )
          }
          readAll()
        },
        () => finish()
      )
    })
  })
}
// #endif

const uploadSequentially = (files: any[], index: number) => {
  if (index >= files.length) {
    uploading.value = false
    progressPercent.value = 100
    loadHistory()
    return
  }
  const file = files[index]
  uploading.value = true
  currentFileName.value = file.name
  progressPercent.value = Math.round((index / files.length) * 100)

  const filePath = file.path || file.tempFilePath
  uploadKnowledgeFile(filePath, currentKbId())
    .then((res: any) => {
      const data = res?.data || res || {}
      if (data.successCount > 0) {
        if (!result.value) result.value = { successCount: 0, failCount: 0, items: [] }
        result.value.successCount += data.successCount || 0
        result.value.failCount += data.failCount || 0
        result.value.items.push(...(data.items || []))
      }
    })
    .catch((e) => {
      console.error('上传失败', e)
    })
    .finally(() => {
      uploadSequentially(files, index + 1)
    })
}

const loadHistory = async () => {
  try {
    const res = await getUploadedFilePage({ pageNum: 1, pageSize: 20 })
    const data = res?.data || res || {}
    list.value = data.records || []
  } catch (e) {
    console.error('加载历史失败', e)
  }
}

const goPreview = (item: any) => {
  uni.navigateTo({ url: `/pages/knowledge/file-preview/index?id=${item.id}` })
}

const goBack = () => {
  uni.navigateBack()
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
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  loadKnowledgeBases()
  loadHistory()
})

onPullDownRefresh(() => {
  Promise.all([loadKnowledgeBases(), loadHistory()]).finally(() => uni.stopPullDownRefresh())
})
</script>

<style scoped lang="scss">
.file-upload {
  min-height: 100vh;
  background: var(--color-bg-app, #F8FAF9);
  padding-bottom: 40rpx;
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
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text, #1F2329);
  }
  .placeholder { width: 72rpx; }
}

.kb-section {
  padding: 32rpx 24rpx 0;
  .kb-label {
    display: block;
    font-size: 26rpx;
    color: var(--color-text-secondary, #4E5969);
    margin-bottom: 12rpx;
  }
  .kb-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-surface, #fff);
    border-radius: 16rpx;
    padding: 24rpx 32rpx;
    &:active { background: var(--color-surface-soft, #F8FAF9); }
    &.kb-picker-empty .kb-picker-text { color: var(--color-text-tertiary, #8F959E); }
    .kb-picker-text {
      font-size: 28rpx;
      color: var(--color-text, #1F2329);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kb-picker-arrow {
      font-size: 40rpx;
      color: var(--color-text-tertiary, #C9CDD4);
      margin-left: 16rpx;
    }
  }
  .kb-tip {
    display: block;
    font-size: 22rpx;
    color: var(--color-text-tertiary, #8F959E);
    margin-top: 12rpx;
  }
}

.upload-section {
  padding: 32rpx 24rpx 16rpx;
}.upload-card {
  background: var(--color-surface, #fff);
  border-radius: 24rpx;
  padding: 60rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  border: 2rpx dashed var(--color-primary, #25B864);
  &:active { background: var(--color-primary-soft, #E8F8EF); }
  .upload-icon { font-size: 80rpx; }
  .upload-title { font-size: 32rpx; font-weight: 600; color: var(--color-text, #1F2329); }
  .upload-desc { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
  .upload-limit { font-size: 22rpx; color: var(--color-text-tertiary, #C9CDD4); }
}

.progress-section {
  padding: 0 24rpx 16rpx;
}
.progress-card {
  background: var(--color-surface, #fff);
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  .progress-text { font-size: 26rpx; color: var(--color-text-secondary, #4E5969); display: block; margin-bottom: 12rpx; }
  .progress-bar {
    height: 12rpx;
    background: var(--color-surface-soft, #F5F6F7);
    border-radius: 6rpx;
    overflow: hidden;
    .progress-inner {
      height: 100%;
      background: var(--color-primary, #25B864);
      border-radius: 6rpx;
      transition: width 0.3s;
    }
  }
  .progress-percent { font-size: 24rpx; color: var(--color-text-tertiary, #8F959E); margin-top: 8rpx; display: block; text-align: right; }
}

.result-section {
  padding: 0 24rpx 16rpx;
}
.result-card {
  background: var(--color-surface, #fff);
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  .result-title { font-size: 28rpx; font-weight: 600; color: var(--color-text, #1F2329); display: block; margin-bottom: 16rpx; }
  .result-summary { display: flex; gap: 24rpx; margin-bottom: 16rpx;
    .result-success { font-size: 26rpx; color: var(--color-primary, #25B864); font-weight: 600; }
    .result-fail { font-size: 26rpx; color: #ff4d4f; font-weight: 600; }
  }
  .result-list { display: flex; flex-direction: column; gap: 12rpx; }
  .result-item {
    padding: 16rpx;
    background: var(--color-surface-soft, #F8FAF9);
    border-radius: 12rpx;
    .result-item-name { font-size: 26rpx; color: var(--color-text, #1F2329); display: block; }
    .result-item-status { font-size: 22rpx; font-weight: 500;
      &.status-1 { color: var(--color-primary, #25B864); }
      &.status-2 { color: #ff4d4f; }
    }
    .result-item-error { font-size: 22rpx; color: #ff4d4f; display: block; margin-top: 4rpx; }
  }
}

.history-section {
  padding: 16rpx 24rpx;
  .section-title { font-size: 30rpx; font-weight: 600; color: var(--color-text, #1F2329); display: block; margin-bottom: 16rpx; }
}
.history-list { display: flex; flex-direction: column; gap: 16rpx; }
.history-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--color-surface, #fff);
  border-radius: 16rpx;
  padding: 24rpx;
  &:active { background: var(--color-surface-soft, #F8FAF9); }
  .history-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    &.icon-html, &.icon-htm { background: #E8F3FF; }
    &.icon-md, &.icon-markdown { background: #FFF7E8; }
    .icon-text { font-size: 22rpx; font-weight: 700; text-transform: uppercase;
      .icon-html &, .icon-htm & { color: #1677ff; }
      .icon-md &, .icon-markdown & { color: #fa8c16; }
    }
  }
  .history-info { flex: 1; min-width: 0;
    .history-name { font-size: 28rpx; color: var(--color-text, #1F2329); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .history-meta { font-size: 22rpx; color: var(--color-text-tertiary, #8F959E); margin-top: 4rpx; display: block; }
  }
  .history-status {
    .status-tag { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 8rpx;
      &.tag-0 { background: #F5F6F7; color: #8F959E; }
      &.tag-1 { background: var(--color-primary-soft, #E8F8EF); color: var(--color-primary, #25B864); }
      &.tag-2 { background: #FFF1F0; color: #ff4d4f; }
    }
  }
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  .empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
  .empty-text { font-size: 26rpx; color: var(--color-text-tertiary, #8F959E); }
}
</style>
