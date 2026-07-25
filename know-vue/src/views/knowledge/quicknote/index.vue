<template>
  <div class="knowledge-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="内容关键词">
          <a-input v-model:value="queryParams.content" placeholder="请输入内容关键词" allow-clear />
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
          新增小记
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
          <template v-if="column.key === 'content'">
            <div class="content-cell">{{ record.content }}</div>
          </template>
          <template v-if="column.key === 'tags'">
            <a-tag v-for="tag in parseTags(record.tags)" :key="tag" color="green">{{ tag }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleOk" :confirmLoading="confirmLoading" width="700px">
      <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="内容" required>
          <a-textarea v-model:value="formData.content" placeholder="请输入小记内容" :rows="6" />
        </a-form-item>
        <a-form-item label="标签">
          <a-input v-model:value="formData.tags" placeholder="多个标签用逗号分隔，如：学习,笔记" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { getQuickNoteList, addQuickNote, updateQuickNote, deleteQuickNote } from '@/api/knowledge'

const loading = ref(false)
const list = ref([])
const modalVisible = ref(false)
const modalTitle = ref('新增小记')
const confirmLoading = ref(false)

const queryParams = reactive({
  content: ''
})

const formData = reactive({
  id: undefined,
  content: '',
  tags: ''
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '内容', dataIndex: 'content', key: 'content', width: 400, ellipsis: true },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 200 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' }
]

const parseTags = (tags) => {
  if (!tags) return []
  return tags.split(',').filter(t => t.trim())
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getQuickNoteList({
      pageNum: 1,
      pageSize: 10,
      ...queryParams
    })
    list.value = res?.data?.records || []
  } catch (error) {
    console.error('获取小记列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.content = ''
  fetchData()
}

const showAddModal = () => {
  modalTitle.value = '新增小记'
  Object.assign(formData, {
    id: undefined,
    content: '',
    tags: ''
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑小记'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleOk = async () => {
  if (!formData.content) {
    message.warning('请输入小记内容')
    return
  }
  
  confirmLoading.value = true
  try {
    if (formData.id) {
      await updateQuickNote(formData)
      message.success('更新成功')
    } else {
      await addQuickNote(formData)
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
    await deleteQuickNote(id)
    message.success('删除成功')
    fetchData()
  } catch (error) {
    console.error('删除失败', error)
  }
}

onMounted(() => {
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

.content-cell {
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
