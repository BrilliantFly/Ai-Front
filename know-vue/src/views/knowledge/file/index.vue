<template>
  <div class="knowledge-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="文件名">
          <a-input v-model:value="queryParams.originalName" placeholder="请输入文件名" allow-clear />
        </a-form-item>
        <a-form-item label="解析状态">
          <a-select v-model:value="queryParams.parseStatus" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="0">待解析</a-select-option>
            <a-select-option :value="1">成功</a-select-option>
            <a-select-option :value="2">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="fetchData">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 表格区域 -->
    <a-card :bordered="false" class="table-wrapper">
      <a-space class="table-toolbar">
        <a-select
          v-model:value="selectedKbId"
          placeholder="请选择知识库"
          style="width: 220px"
          :options="kbOptions"
          :loading="kbLoading"
          allow-clear
          show-search
          :filter-option="filterKbOption"
        />
        <a-upload
          multiple
          accept=".html,.htm,.md,.markdown,.pdf"
          :show-upload-list="false"
          :disabled="!selectedKbId"
          :custom-request="handleUpload"
        >
          <a-button type="primary" :disabled="!selectedKbId">
            <template #icon><UploadOutlined /></template>
            上传文件
          </a-button>
        </a-upload>
        <span v-if="kbOptions.length === 0" class="upload-tip">
          暂无知识库，请先到「知识库管理」创建后再上传
        </span>
        <span v-else class="upload-tip">
          支持 .html / .htm / .md / .markdown / .pdf，文本类 ≤ 5MB、PDF ≤ 10MB；上传后将解析到所选知识库
        </span>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fileExt'">
            <a-tag :color="getExtColor(record.fileExt)">{{ record.fileExt }}</a-tag>
          </template>
          <template v-if="column.key === 'parseStatus'">
            <a-tag :color="getParseStatusColor(record.parseStatus)">
              {{ getParseStatusText(record.parseStatus) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'fileSize'">
            {{ formatFileSize(record.fileSize) }}
          </template>
          <template v-if="column.key === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
              <a-button
                type="link"
                size="small"
                :disabled="record.parseStatus === 1"
                @click="handleParse(record)"
              >
                重新解析
              </a-button>
              <a-popconfirm title="确定删除该文件?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 预览弹窗 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewRecord?.originalName || '文件预览'"
      :width="900"
      :footer="null"
    >
      <div v-if="previewRecord" class="preview-content">
        <div class="preview-meta">
          <a-tag :color="getExtColor(previewRecord.fileExt)">{{ previewRecord.fileExt }}</a-tag>
          <span class="meta-text">大小: {{ formatFileSize(previewRecord.fileSize) }}</span>
          <span v-if="previewRecord.parseError" class="meta-error">解析失败: {{ previewRecord.parseError }}</span>
        </div>
        <!-- PDF 用 iframe 直接渲染(nginx /uploads 静态资源, 无鉴权) -->
        <div v-if="isPdf(previewRecord.fileExt)" class="pdf-preview-wrapper">
          <div class="pdf-toolbar">
            <a :href="pdfUrl(previewRecord)" target="_blank" rel="noopener">在新窗口打开</a>
          </div>
          <iframe :src="pdfUrl(previewRecord)" class="pdf-frame" frameborder="0" />
        </div>
        <!-- Markdown 用 md-editor-v3 预览 -->
        <div v-else-if="isMarkdown(previewRecord.fileExt)" class="md-preview-wrapper">
          <MdPreview :modelValue="previewRecord.fileContent" :theme="theme" />
        </div>
        <!-- HTML 直接渲染 -->
        <div v-else class="html-preview-wrapper" v-html="previewRecord.fileContent" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import {
  uploadKnowledgeFiles,
  getKnowledgeFilePage,
  getKnowledgeFile,
  parseKnowledgeFile,
  deleteKnowledgeFile,
  getKnowledgeBaseOptions
} from '@/api/knowledge'

const loading = ref(false)
const list = ref([])
const previewVisible = ref(false)
const previewRecord = ref<any>(null)
const theme = ref<'light' | 'dark'>('light')

// 知识库下拉
const kbLoading = ref(false)
const kbOptions = ref<{ label: string; value: number }[]>([])
const selectedKbId = ref<number | undefined>(undefined)

const queryParams = reactive({
  originalName: '',
  parseStatus: undefined as number | undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条`
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '文件名', dataIndex: 'originalName', key: 'originalName', ellipsis: true },
  { title: '类型', dataIndex: 'fileExt', key: 'fileExt', width: 100 },
  { title: '大小', dataIndex: 'fileSize', key: 'fileSize', width: 120 },
  { title: '解析状态', dataIndex: 'parseStatus', key: 'parseStatus', width: 120 },
  { title: '上传时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' as const }
]

const filterKbOption = (input: string, option: any) =>
  String(option?.label ?? '').toLowerCase().indexOf(input.toLowerCase()) >= 0

const fetchKnowledgeBases = async () => {
  kbLoading.value = true
  try {
    const res = await getKnowledgeBaseOptions()
    const arr = res?.data || res || []
    kbOptions.value = (Array.isArray(arr) ? arr : []).map((kb: any) => ({
      label: kb.name,
      value: kb.id
    }))
    // 默认选中第一个知识库，方便直接上传
    if (selectedKbId.value === undefined && kbOptions.value.length > 0) {
      selectedKbId.value = kbOptions.value[0].value
    }
  } catch (e: any) {
    console.error('获取知识库列表失败', e)
  } finally {
    kbLoading.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }
    if (queryParams.originalName) params.originalName = queryParams.originalName
    if (queryParams.parseStatus !== undefined) params.parseStatus = queryParams.parseStatus

    const res = await getKnowledgeFilePage(params)
    const data = res?.data || res || {}
    list.value = data.records || []
    pagination.total = data.total || 0
  } catch (e: any) {
    message.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.originalName = ''
  queryParams.parseStatus = undefined
  pagination.current = 1
  fetchData()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

const handleUpload = async (options: any) => {
  if (!selectedKbId.value) {
    message.warning('请先选择知识库')
    options?.onError?.(new Error('未选择知识库'))
    return
  }
  const formData = new FormData()
  formData.append('files', options.file)
  formData.append('uploadPlatform', 'vue')
  formData.append('knowledgeBaseId', String(selectedKbId.value))
  try {
    const res = await uploadKnowledgeFiles(formData)
    const data = res?.data || res || {}
    if (data.successCount > 0) {
      message.success(`上传成功 ${data.successCount} 个文件`)
      fetchData()
      options?.onSuccess?.(res)
    } else {
      const failItem = data.items?.[0]
      message.error(failItem?.parseError || '上传失败')
      options?.onError?.(new Error(failItem?.parseError || '上传失败'))
    }
  } catch (e: any) {
    message.error(e.message || '上传失败')
    options?.onError?.(e)
  }
}

const handlePreview = async (record: any) => {
  try {
    const res = await getKnowledgeFile(record.id)
    previewRecord.value = res?.data || res
    previewVisible.value = true
  } catch (e: any) {
    message.error(e.message || '加载失败')
  }
}

const handleParse = async (record: any) => {
  try {
    await parseKnowledgeFile(record.id)
    message.success('解析成功')
    fetchData()
  } catch (e: any) {
    message.error(e.message || '解析失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteKnowledgeFile(id)
    message.success('删除成功')
    fetchData()
  } catch (e: any) {
    message.error(e.message || '删除失败')
  }
}

const getExtColor = (ext: string) => {
  const map: Record<string, string> = { html: 'blue', htm: 'blue', md: 'orange', markdown: 'orange', pdf: 'red' }
  return map[ext] || 'default'
}

const getParseStatusColor = (status: number) => {
  const map: Record<number, string> = { 0: 'default', 1: 'green', 2: 'red' }
  return map[status] || 'default'
}

const getParseStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '待解析', 1: '成功', 2: '失败' }
  return map[status] || '未知'
}

const isMarkdown = (ext: string) => ext === 'md' || ext === 'markdown'
const isPdf = (ext: string) => (ext || '').toLowerCase() === 'pdf'
const pdfUrl = (record: any) => '/uploads/' + (record?.filePath || '')

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

onMounted(() => {
  fetchKnowledgeBases()
  fetchData()
})
</script>

<style scoped lang="less">
.knowledge-container {
  padding: 16px;
}
.search-form {
  margin-bottom: 16px;
}
.table-wrapper {
  .table-toolbar {
    margin-bottom: 16px;
    align-items: center;
  }
  .upload-tip {
    font-size: 12px;
    color: #999;
  }
}
.preview-content {
  .preview-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    .meta-text {
      font-size: 12px;
      color: #999;
    }
    .meta-error {
      font-size: 12px;
      color: #ff4d4f;
    }
  }
  .md-preview-wrapper {
    max-height: 60vh;
    overflow-y: auto;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
  }
  .html-preview-wrapper {
    max-height: 60vh;
    overflow-y: auto;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
  }
  .pdf-preview-wrapper {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    .pdf-toolbar {
      padding: 6px 12px;
      font-size: 12px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
    }
    .pdf-frame {
      width: 100%;
      height: 70vh;
      border: none;
      display: block;
    }
  }
}
</style>
