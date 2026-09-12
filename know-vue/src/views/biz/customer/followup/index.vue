<template>
  <div>
    <a-card title="跟进记录" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增跟进
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="客户ID">
          <a-input-number v-model:value="queryParams.customerId" placeholder="请输入客户ID" :min="1" :style="{ width: '160px' }" />
        </a-form-item>
        <a-form-item label="跟进类型">
          <a-select v-model:value="queryParams.type" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option value="电话">电话</a-select-option>
            <a-select-option value="拜访">拜访</a-select-option>
            <a-select-option value="微信">微信</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="跟进人">
          <a-input v-model:value="queryParams.createUserName" placeholder="请输入跟进人" allow-clear style="width: 150px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleQuery">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><redo-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 跟进记录列表 -->
      <a-table
        :data-source="followupList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizCustomerFollowup) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: TableColumn; record: BizCustomerFollowup }">
          <template v-if="column.key === 'type'">
            {{ followupTypeText(record.type) }}
          </template>
          <template v-if="column.key === 'createTime'">
            {{ formatTime(record.createTime) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该跟进记录吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
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
      :confirm-loading="confirmLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="640px"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户ID" name="customerId">
              <a-input-number v-model:value="formData.customerId" placeholder="请输入客户ID" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="跟进类型" name="type">
              <a-select v-model:value="formData.type" placeholder="请选择跟进类型">
                <a-select-option value="电话">电话</a-select-option>
                <a-select-option value="拜访">拜访</a-select-option>
                <a-select-option value="微信">微信</a-select-option>
                <a-select-option value="其他">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="跟进内容" name="content">
          <a-textarea v-model:value="formData.content" placeholder="请输入跟进内容" :rows="3" />
        </a-form-item>
        <a-form-item label="跟进结果">
          <a-textarea v-model:value="formData.result" placeholder="请输入跟进结果" :rows="2" />
        </a-form-item>
        <a-form-item label="下次跟进时间(时间戳)">
          <a-input-number v-model:value="formData.nextTime" placeholder="请输入下次跟进时间的毫秒时间戳" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import type { PaginationProps, FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {
  getFollowupPage,
  addFollowup,
  updateFollowup,
  deleteFollowup,
  type BizFollowupQuery,
  type BizCustomerFollowup
} from '@/api/biz/followup'

interface TableColumn {
  title: string
  dataIndex?: string
  key?: string
  width?: number
  ellipsis?: boolean
  fixed?: 'left' | 'right'
}

// 表格列定义
const columns: TableColumn[] = [
  { title: '客户ID', dataIndex: 'customerId', key: 'customerId', width: 90 },
  { title: '跟进类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '跟进内容', dataIndex: 'content', key: 'content', width: 260, ellipsis: true },
  { title: '跟进结果', dataIndex: 'result', key: 'result', width: 200, ellipsis: true },
  { title: '跟进人', dataIndex: 'createUserName', key: 'createUserName', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive<BizFollowupQuery>({
  customerId: undefined,
  type: undefined,
  createUserName: undefined
})

// 数据状态
const followupList = ref<BizCustomerFollowup[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增跟进')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<BizCustomerFollowup>({
  id: undefined,
  customerId: undefined,
  type: undefined,
  content: '',
  result: '',
  nextTime: undefined
})

// 表单校验规则
const rules: Record<string, Rule[]> = {
  customerId: [{ required: true, message: '请输入客户ID', trigger: 'blur' }],
  type: [{ required: true, message: '请选择跟进类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
}

// 跟进类型文案
const followupTypeText = (type?: string): string => type || '-'

// 时间戳格式化(毫秒)
const formatTime = (timestamp?: number): string => {
  if (timestamp == null) return '-'
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 加载跟进记录列表
const loadData = async () => {
  loading.value = true
  try {
    const res = await getFollowupPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    const resData = res?.data || res || {}
    followupList.value = resData?.records || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || pagination.current
  } catch {
    console.error('加载跟进记录失败')
    followupList.value = []
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  queryParams.customerId = undefined
  queryParams.type = undefined
  queryParams.createUserName = undefined
  pagination.current = 1
  loadData()
}

// 表格变化
const handleTableChange = (pag: PaginationProps) => {
  pagination.current = pag.current ?? 1
  pagination.pageSize = pag.pageSize ?? 10
  loadData()
}

// 重置表单
const resetFormData = () => {
  formData.id = undefined
  formData.customerId = undefined
  formData.type = undefined
  formData.content = ''
  formData.result = ''
  formData.nextTime = undefined
}

// 新增
const handleAdd = async () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增跟进'
  resetFormData()
  modalVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

// 编辑
const handleEdit = async (record: BizCustomerFollowup) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑跟进'
  resetFormData()
  Object.assign(formData, record)
  modalVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  confirmLoading.value = true
  try {
    const payload: BizCustomerFollowup = { ...formData }
    if (isEdit.value && editId.value) {
      payload.id = editId.value
      await updateFollowup(payload)
      message.success('修改成功')
    } else {
      await addFollowup(payload)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    console.error('保存跟进记录失败', e)
    message.error('操作失败')
  } finally {
    confirmLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 删除
const handleDelete = async (record: BizCustomerFollowup) => {
  try {
    await deleteFollowup(record.id!)
    message.success('删除成功')
    loadData()
  } catch (e) {
    console.error('删除跟进记录失败', e)
    message.error('删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>