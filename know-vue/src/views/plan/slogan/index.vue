<template>
  <div class="plan-slogan-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="内容关键词">
          <a-input
            v-model:value="queryParams.content"
            placeholder="请输入内容关键词"
            allow-clear
            @pressEnter="fetchData"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">启用</a-select-option>
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
          新增标语
        </a-button>
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
          <template v-if="column.key === 'content'">
            <span class="slogan-emoji">{{ record.emoji || '' }}</span>
            <span class="slogan-content">{{ record.content }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 1"
              checked-children="启用"
              un-checked-children="禁用"
              @change="checked => handleStatusChange(record, checked)"
            />
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该标语?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      :confirmLoading="confirmLoading"
      width="640px"
    >
      <a-form :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
        <a-form-item label="标语内容" required>
          <a-textarea
            v-model:value="formData.content"
            placeholder="请输入标语内容，如：努力是光，坚持是路"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </a-form-item>
        <a-form-item label="表情符号">
          <a-input
            v-model:value="formData.emoji"
            placeholder="可输入表情/符号，如：✨ 🚀 🌱，也可直接粘贴"
            allow-clear
          />
          <div class="emoji-quick-row">
            <span class="emoji-quick" v-for="e in quickEmojis" :key="e" @click="formData.emoji = e">{{ e }}</span>
          </div>
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="formData.sort" :min="0" :max="999" style="width: 120px" />
          <div class="form-tip">数字越小越靠前，首页轮播时按此顺序展示</div>
        </a-form-item>
        <a-form-item label="状态">
          <a-switch
            v-model:checked="formData.status"
            :checked-value="1"
            :un-checked-value="0"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
  import { getSloganList, addSlogan, updateSlogan, deleteSlogan } from '@/api/plan/slogan'

  const loading = ref(false)
  const list = ref<any[]>([])
  const modalVisible = ref(false)
  const modalTitle = ref('新增标语')
  const confirmLoading = ref(false)

  const quickEmojis = ['✨', '🚀', '🌱', '⭐', '🔥', '💪', '🌈', '🎯', '📝', '☀️']

  const queryParams = reactive({
    content: '',
    status: undefined
  })

  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total: number) => `共 ${total} 条`
  })

  const formData = reactive({
    id: undefined,
    content: '',
    emoji: '',
    sort: 0,
    status: 1
  })

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标语内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '状态', key: 'status', width: 100 },
    { title: '操作', key: 'action', width: 140, fixed: 'right' }
  ]

  const fetchData = async () => {
    loading.value = true
    try {
      const params: Record<string, any> = {
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      }
      if (queryParams.content) params.content = queryParams.content
      if (queryParams.status !== undefined && queryParams.status !== null && queryParams.status !== '') {
        params.status = queryParams.status
      }
      const res = await getSloganList(params)
      list.value = res?.data?.records || []
      pagination.total = res?.data?.total || list.value.length
    } catch (error) {
      console.error('获取标语列表失败', error)
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag: any) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    fetchData()
  }

  const handleReset = () => {
    queryParams.content = ''
    queryParams.status = undefined
    pagination.current = 1
    fetchData()
  }

  const showAddModal = () => {
    modalTitle.value = '新增标语'
    Object.assign(formData, {
      id: undefined,
      content: '',
      emoji: '',
      sort: 0,
      status: 1
    })
    modalVisible.value = true
  }

  const handleEdit = (record: any) => {
    modalTitle.value = '编辑标语'
    Object.assign(formData, {
      id: record.id,
      content: record.content,
      emoji: record.emoji || '',
      sort: record.sort ?? 0,
      status: record.status ?? 1
    })
    modalVisible.value = true
  }

  const handleStatusChange = async (record: any, checked: boolean) => {
    try {
      await updateSlogan({ id: record.id, status: checked ? 1 : 0 })
      record.status = checked ? 1 : 0
      message.success(checked ? '已启用' : '已禁用')
    } catch (error) {
      console.error('状态更新失败', error)
      record.status = checked ? 0 : 1
    }
  }

  const handleOk = async () => {
    if (!formData.content?.trim()) {
      message.warning('请输入标语内容')
      return
    }

    confirmLoading.value = true
    try {
      if (formData.id) {
        await updateSlogan({ ...formData })
        message.success('更新成功')
      } else {
        await addSlogan({ ...formData })
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

  const handleDelete = async (id: number) => {
    try {
      await deleteSlogan(id)
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
  .plan-slogan-container {
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

  .slogan-emoji {
    margin-right: 6px;
    font-size: 16px;
  }

  .slogan-content {
    color: rgba(0, 0, 0, 0.88);
  }

  .text-muted {
    color: rgba(0, 0, 0, 0.45);
  }

  .form-tip {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 4px;
  }

  .emoji-quick-row {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .emoji-quick {
    width: 32px;
    height: 32px;
    line-height: 32px;
    text-align: center;
    font-size: 18px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #1677ff;
      background: #e6f4ff;
    }
  }
</style>
