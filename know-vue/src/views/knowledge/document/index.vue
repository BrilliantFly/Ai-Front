<template>
  <div class="knowledge-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="文档标题">
          <a-input v-model:value="queryParams.title" placeholder="请输入文档标题" allow-clear />
        </a-form-item>
        <a-form-item label="知识库">
          <a-select v-model:value="queryParams.knowledgeBaseId" placeholder="请选择知识库" allow-clear style="width: 200px">
            <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
              {{ kb.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option :value="1">已发布</a-select-option>
            <a-select-option :value="0">草稿</a-select-option>
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
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增文档
        </a-button>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'contentType'">
            <a-tag :color="getContentTypeColor(record.contentType)">{{ getContentTypeText(record.contentType) }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'orange'">
              {{ record.status === 1 ? '已发布' : '草稿' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-popconfirm title="确定删除?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <BizFullscreenModal v-model:open="modalVisible" :title="modalTitle" @ok="handleOk" :confirmLoading="confirmLoading" width="800px">
      <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="文档标题" required>
          <a-input v-model:value="formData.title" placeholder="请输入文档标题" />
        </a-form-item>
        <a-form-item label="所属知识库" required>
          <a-select v-model:value="formData.knowledgeBaseId" placeholder="请选择知识库">
            <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
              {{ kb.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="所属目录">
          <a-select v-model:value="formData.directoryId" placeholder="请选择目录" allow-clear>
            <a-select-option v-for="dir in directories" :key="dir.id" :value="dir.id">
              {{ dir.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="内容类型">
          <a-select v-model:value="formData.contentType">
            <a-select-option :value="1">富文本</a-select-option>
            <a-select-option :value="2">Markdown</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formData.status">
            <a-select-option :value="1">已发布</a-select-option>
            <a-select-option :value="0">草稿</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="内容">
          <a-textarea v-model:value="formData.content" placeholder="请输入文档内容" :rows="10" />
        </a-form-item>
      </a-form>
    </BizFullscreenModal>

    <!-- 文档预览弹窗: 按内容类型决定预览入口 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewRecord?.title || '文档预览'"
      :width="900"
      :footer="null"
    >
      <div v-if="previewRecord" class="doc-preview">
        <div class="doc-preview-meta">
          <a-tag :color="getContentTypeColor(previewRecord.contentType)">
            {{ getContentTypeText(previewRecord.contentType) }}
          </a-tag>
          <a-tag v-if="previewRecord.fileExt" color="red">{{ previewRecord.fileExt }}</a-tag>
          <span class="meta-text">
            来源: {{ previewRecord.hasUploadedFile ? '文件上传' : '在线编辑' }}
          </span>
          <a
            v-if="isFilePreview(previewRecord)"
            :href="filePreviewUrl(previewRecord)"
            target="_blank"
            rel="noopener"
          >在新窗口打开</a>
        </div>
        <!-- 有上传文件且为 html/htm/pdf: iframe 渲染原始文件 -->
        <div v-if="isFilePreview(previewRecord)" class="file-preview-wrapper">
          <iframe :src="filePreviewUrl(previewRecord)" class="preview-frame" frameborder="0" />
        </div>
        <!-- Markdown -->
        <div v-else-if="isMarkdownDoc(previewRecord)" class="md-preview-wrapper">
          <MdPreview :modelValue="previewRecord.content" :theme="theme" />
        </div>
        <!-- 富文本(HTML) -->
        <div v-else class="html-preview-wrapper" v-html="previewRecord.content" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { getDocumentList, addDocument, updateDocument, deleteDocument, getDocument, getKnowledgeBaseList, getDirectoryList } from '@/api/knowledge'

const route = useRoute()
const loading = ref(false)
const list = ref([])
const knowledgeBases = ref([])
const directories = ref([])
const modalVisible = ref(false)
const modalTitle = ref('新增文档')
const confirmLoading = ref(false)
const previewVisible = ref(false)
const previewRecord = ref<any>(null)
const theme = ref<'light' | 'dark'>('light')

const queryParams = reactive({
  title: '',
  knowledgeBaseId: undefined,
  status: undefined
})

const formData = reactive({
  id: undefined,
  title: '',
  knowledgeBaseId: undefined,
  directoryId: undefined,
  contentType: 1,
  content: '',
  status: 1
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', key: 'title', width: 250 },
  { title: '内容类型', dataIndex: 'contentType', key: 'contentType', width: 110 },
  { title: '浏览次数', dataIndex: 'viewCount', key: 'viewCount', width: 100 },
  { title: '点赞数', dataIndex: 'likeCount', key: 'likeCount', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' }
]

const fetchKnowledgeBases = async () => {
  try {
    const res = await getKnowledgeBaseList({ pageNum: 1, pageSize: 100 })
    knowledgeBases.value = res?.data?.records || []
  } catch (error) {
    console.error('获取知识库列表失败', error)
  }
}

const fetchDirectories = async (kbId) => {
  if (!kbId) {
    directories.value = []
    return
  }
  try {
    const res = await getDirectoryList({ knowledgeBaseId: kbId })
    directories.value = res?.data || []
  } catch (error) {
    console.error('获取目录列表失败', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDocumentList({
      pageNum: 1,
      pageSize: 10,
      ...queryParams
    })
    list.value = res?.data?.records || []
  } catch (error) {
    console.error('获取文档列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.title = ''
  queryParams.knowledgeBaseId = undefined
  queryParams.status = undefined
  fetchData()
}

const showAddModal = () => {
  modalTitle.value = '新增文档'
  Object.assign(formData, {
    id: undefined,
    title: '',
    knowledgeBaseId: undefined,
    directoryId: undefined,
    contentType: 1,
    content: '',
    status: 1
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑文档'
  Object.assign(formData, record)
  fetchDirectories(record.knowledgeBaseId)
  modalVisible.value = true
}

const handleView = async (record) => {
  try {
    const res = await getDocument(record.id)
    previewRecord.value = res?.data || res
    previewVisible.value = true
  } catch (error) {
    message.error('加载文档失败')
  }
}

// 内容类型: 1=富文本(HTML) 2=Markdown 3=PDF
const getContentTypeText = (t) => {
  const map = { 1: '富文本', 2: 'Markdown', 3: 'PDF' }
  return map[t] ?? map[Number(t)] ?? '富文本'
}
const getContentTypeColor = (t) => {
  const n = Number(t)
  const map = { 1: 'blue', 2: 'orange', 3: 'red' }
  return map[n] || 'default'
}
const isMarkdownDoc = (r) => Number(r?.contentType) === 2
// 有上传文件且为 html/htm/pdf → 走原始文件预览(iframe)
const isFilePreview = (r) =>
  !!r?.hasUploadedFile && ['html', 'htm', 'pdf'].includes((r?.fileExt || '').toLowerCase())
const filePreviewUrl = (r) => '/uploads/' + (r?.filePath || '')

const handleOk = async () => {
  if (!formData.title) {
    message.warning('请输入文档标题')
    return
  }
  if (!formData.knowledgeBaseId) {
    message.warning('请选择知识库')
    return
  }
  
  confirmLoading.value = true
  try {
    if (formData.id) {
      await updateDocument(formData)
      message.success('更新成功')
    } else {
      await addDocument(formData)
      message.success('新增成功')
    }
    modalVisible.value = false
    fetchData()
  } catch (error) {
    console.error('操作失败', error)
  } finally {
    confirmLoading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await deleteDocument(id)
    message.success('删除成功')
    fetchData()
  } catch (error) {
    console.error('删除失败', error)
  }
}

onMounted(() => {
  // 支持从行业/计划页面跳转: /knowledge/document?knowledgeBaseId=x
  const kbId = route.query.knowledgeBaseId
  if (kbId !== undefined && kbId !== null && kbId !== '') {
    queryParams.knowledgeBaseId = Number(kbId)
  }
  fetchKnowledgeBases()
  fetchData()
})
</script>

<style scoped lang="scss">
.knowledge-container {
  padding: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.table-wrapper {
  margin-bottom: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
}

.doc-preview {
  .doc-preview-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    .meta-text {
      font-size: 12px;
      color: #999;
    }
  }
  .file-preview-wrapper {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    .preview-frame {
      width: 100%;
      height: 70vh;
      border: none;
      display: block;
    }
  }
  .md-preview-wrapper,
  .html-preview-wrapper {
    max-height: 65vh;
    overflow-y: auto;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
  }
}
</style>
