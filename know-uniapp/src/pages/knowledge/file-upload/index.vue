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
      <text v-if="kbList.length > 0" class="kb-tip">上传的 .html / .md / .pdf 将解析到该知识库</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section">
      <view class="upload-card" @tap="chooseFile">
        <text class="upload-icon">📤</text>
        <text class="upload-title">点击选择文件</text>
        <text class="upload-desc">支持 .html / .htm / .md / .markdown / .pdf</text>
        <text class="upload-limit">单个文件 ≤ 10MB（PDF≤10MB，文本≤5MB）</text>
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
    extension: ['.html', '.htm', '.md', '.markdown', '.pdf'],
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
    extension: ['html', 'htm', 'md', 'markdown', 'pdf'],
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
const ACCEPT_EXTS = ['.html', '.htm', '.md', '.markdown', '.pdf']

interface PickedFile {
  name: string
  path: string
}

// App 端无法使用 uni.chooseFile（仅支持 H5），改为调用系统文件选择器。
// 说明：旧实现用 plus.io 扫描 /storage/emulated/0/Download/，在未授予存储权限时会
// 触发原生 SecurityException 导致 App 崩溃；系统文件选择器（ACTION_GET_CONTENT）由
// 系统授予所选文件的访问权限，无需存储权限，最稳妥。
const chooseFileOnApp = async () => {
  const platform = uni.getSystemInfoSync().platform
  if (platform !== 'android') {
    uni.showToast({ title: 'iOS 端暂请使用网页版导入文件', icon: 'none', duration: 3000 })
    return
  }
  let picked: PickedFile | null = null
  try {
    picked = await pickDocumentAndroid()
  } catch (e) {
    console.error('App 端选择文件失败', e)
    uni.showToast({ title: '打开文件选择器失败', icon: 'none' })
    return
  }
  if (!picked) return // 用户取消或无结果，保持静默
  uploadSequentially([{ name: picked.name, path: picked.path }], 0)
}

// 调起 Android 系统文件选择器，返回所选文件
const pickDocumentAndroid = (): Promise<PickedFile | null> => {
  return new Promise((resolve) => {
    let settled = false
    const done = (v: PickedFile | null) => {
      if (settled) return
      settled = true
      resolve(v)
    }
    try {
      const main = plus.android.runtimeMainActivity()
      const Intent = plus.android.importClass('android.content.Intent')
      const intent = new Intent(Intent.ACTION_GET_CONTENT)
      intent.setType('*/*')
      intent.addCategory(Intent.CATEGORY_OPENABLE)
      const REQ_CODE = 10021

      main.onActivityResult = (requestCode: number, resultCode: number, data: any) => {
        if (requestCode !== REQ_CODE) return
        if (resultCode !== -1 || !data) {
          done(null) // 用户取消
          return
        }
        try {
          const uri = data.getData()
          if (!uri) {
            done(null)
            return
          }
          copyUriToAppDir(main, uri)
            .then(done)
            .catch((e: any) => {
              console.error('复制所选文件失败', e)
              done(null)
            })
        } catch (e) {
          console.error('读取所选文件失败', e)
          done(null)
        }
      }
      main.startActivityForResult(intent, REQ_CODE)
    } catch (e) {
      console.error('打开系统文件选择器失败', e)
      done(null)
    }
  })
}

// 将 content:// 指向的文件复制到应用私有目录 _doc/，返回可上传的路径
const copyUriToAppDir = (main: any, uri: any): Promise<PickedFile | null> => {
  return new Promise((resolve) => {
    try {
      const resolver = main.getContentResolver()

      // 1. 取原始文件名
      let displayName = ''
      try {
        const cursor = resolver.query(uri, null, null, null, null)
        if (cursor && cursor.moveToFirst()) {
          const idx = cursor.getColumnIndex('_display_name')
          if (idx >= 0) displayName = cursor.getString(idx) || ''
          cursor.close()
        }
      } catch (e) {
        /* 拿不到名字时用兜底名 */
      }

      let ext = ''
      const dot = displayName.lastIndexOf('.')
      if (dot > 0) ext = displayName.substring(dot).toLowerCase()
      if (ACCEPT_EXTS.indexOf(ext) < 0) ext = '.md'
      const base = (dot > 0 ? displayName.substring(0, dot) : displayName) || `import_${Date.now()}`
      const targetName = `${base}${ext}`

      // 2. 读取内容（PDF 为二进制，其他文本）
      const isPdf = ext === '.pdf'
      const inputStream = resolver.openInputStream(uri)
      if (!isPdf) {
        const InputStreamReader = plus.android.importClass('java.io.InputStreamReader')
        const BufferedReader = plus.android.importClass('java.io.BufferedReader')
        const reader = new BufferedReader(new InputStreamReader(inputStream, 'UTF-8'))
        let text = ''
        let line: any
        while ((line = reader.readLine()) !== null) {
          text += line + '\n'
        }
        reader.close()
        // 3. 写入 _doc/
        plus.io.resolveLocalFileSystemURL(
          '_doc/',
          (dirEntry: any) => {
            dirEntry.getFile(
              targetName,
              { create: true },
              (fileEntry: any) => {
                fileEntry.createWriter(
                  (writer: any) => {
                    writer.onwrite = () => resolve({ name: targetName, path: `_doc/${targetName}` })
                    writer.onerror = () => resolve(null)
                    writer.write(text)
                  },
                  () => resolve(null)
                )
              },
              () => resolve(null)
            )
          },
          () => resolve(null)
        )
      } else {
        // PDF 二进制复制：字节读写全部在 Java 层完成，避免 JS 处理二进制导致文件损坏
        const Byte = plus.android.importClass('java.lang.Byte')
        const ReflectArray = plus.android.importClass('java.lang.reflect.Array')
        const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
        let docDir = plus.io.convertLocalFileSystemURL('_doc/')
        if (docDir.indexOf('file://') === 0) docDir = docDir.substring(7)
        if (docDir.charAt(docDir.length - 1) !== '/') docDir += '/'
        const outputStream = new FileOutputStream(docDir + targetName)
        const buffer = ReflectArray.newInstance(Byte.TYPE, 8192)
        let len = 0
        while ((len = inputStream.read(buffer)) !== -1) {
          outputStream.write(buffer, 0, len)
        }
        outputStream.flush()
        outputStream.close()
        inputStream.close()
        resolve({ name: targetName, path: `_doc/${targetName}` })
      }
    } catch (e) {
      console.error('复制文件到应用目录失败', e)
      resolve(null)
    }
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
  // 文件大小校验：PDF<=10MB，文本类<=5MB
  const fileSize = file.size || 0
  const fileName = file.name || ''
  const ext = (fileName.substring(fileName.lastIndexOf('.')) || '').toLowerCase()
  if (ext === '.pdf') {
    if (fileSize > 10 * 1024 * 1024) {
      uni.showToast({ title: 'PDF 文件大小不能超过10MB', icon: 'none' })
      uploadSequentially(files, index + 1)
      return
    }
  } else {
    if (fileSize > 5 * 1024 * 1024) {
      uni.showToast({ title: fileName + ' 超过 5MB，暂不支持大文件', icon: 'none' })
      uploadSequentially(files, index + 1)
      return
    }
  }
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
    &.icon-pdf { background: #FFF1F0; }
    .icon-text { font-size: 22rpx; font-weight: 700; text-transform: uppercase;
      .icon-html &, .icon-htm & { color: #1677ff; }
      .icon-md &, .icon-markdown & { color: #fa8c16; }
      .icon-pdf & { color: #ff4d4f; }
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
