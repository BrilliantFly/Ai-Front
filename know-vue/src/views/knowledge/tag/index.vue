<template>
  <div class="knowledge-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="标签名称">
          <a-input v-model:value="queryParams.name" placeholder="请输入标签名称" allow-clear />
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
          新增标签
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
          <template v-if="column.key === 'color'">
            <div :style="{ width: '24px', height: '24px', borderRadius: '4px', background: record.color }"></div>
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
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleOk" :confirmLoading="confirmLoading">
      <a-form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="标签名称" required>
          <a-input v-model:value="formData.name" placeholder="请输入标签名称" />
        </a-form-item>
        <a-form-item label="颜色">
          <a-input v-model:value="formData.color" placeholder="请输入颜色值如 #FF0000" />
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
import { getTagList, addTag, updateTag, deleteTag } from '@/api/knowledge'

const loading = ref(false)
const list = ref([])
const modalVisible = ref(false)
const modalTitle = ref('新增标签')
const confirmLoading = ref(false)

const queryParams = reactive({
  name: ''
})

const formData = reactive({
  id: undefined,
  name: '',
  color: '#25B864',
  sort: 0
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '颜色', dataIndex: 'color', key: 'color', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTagList({
      pageNum: 1,
      pageSize: 10,
      ...queryParams
    })
    list.value = res?.data?.records || []
  } catch (error) {
    console.error('获取标签列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.name = ''
  fetchData()
}

const showAddModal = () => {
  modalTitle.value = '新增标签'
  Object.assign(formData, {
    id: undefined,
    name: '',
    color: '#25B864',
    sort: 0
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑标签'
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleOk = async () => {
  if (!formData.name) {
    message.warning('请输入标签名称')
    return
  }
  
  confirmLoading.value = true
  try {
    if (formData.id) {
      await updateTag(formData)
      message.success('更新成功')
    } else {
      await addTag(formData)
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
    await deleteTag(id)
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
