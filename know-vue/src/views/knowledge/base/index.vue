<template>
  <div class="knowledge-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="知识库名称">
          <a-input v-model:value="queryParams.name" placeholder="请输入知识库名称" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
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
          新增知识库
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
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'visibility'">
            <a-tag :color="record.visibility === 'public' ? 'blue' : 'orange'">
              {{ record.visibility === 'public' ? '公开' : '私密' }}
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
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleOk" :confirmLoading="confirmLoading">
      <a-form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="知识库名称" required>
          <a-input v-model:value="formData.name" placeholder="请输入知识库名称" />
        </a-form-item>
        <a-form-item label="图标">
          <a-input v-model:value="formData.icon" placeholder="请输入图标emoji" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入描述" :rows="3" />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="formData.visibility">
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="private">私密</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formData.status">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { getKnowledgeBaseList, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase } from '@/api/knowledge'

const loading = ref(false)
const list = ref([])
const modalVisible = ref(false)
const modalTitle = ref('新增知识库')
const confirmLoading = ref(false)

const queryParams = reactive({
  name: '',
  status: undefined
})

const formData = reactive({
  id: undefined,
  name: '',
  icon: '',
  description: '',
  visibility: 'public',
  status: 1,
  sort: 0
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 80 },
  { title: '文档数', dataIndex: 'docCount', key: 'docCount', width: 100 },
  { title: '可见性', dataIndex: 'visibility', key: 'visibility', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeBaseList({
      pageNum: 1,
      pageSize: 10,
      ...queryParams
    })
    list.value = res?.data?.records || []
  } catch (error) {
    console.error('获取知识库列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.name = ''
  queryParams.status = undefined
  fetchData()
}

const showAddModal = () => {
  modalTitle.value = '新增知识库'
  Object.assign(formData, {
    id: undefined,
    name: '',
    icon: '',
    description: '',
    visibility: 'public',
    status: 1,
    sort: 0
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑知识库'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record) => {
  // TODO: 跳转到知识库详情页
  console.log('查看知识库', record)
}

const handleOk = async () => {
  if (!formData.name) {
    message.warning('请输入知识库名称')
    return
  }
  
  confirmLoading.value = true
  try {
    if (formData.id) {
      await updateKnowledgeBase(formData)
      message.success('更新成功')
    } else {
      await addKnowledgeBase(formData)
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
    await deleteKnowledgeBase(id)
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
</style>
