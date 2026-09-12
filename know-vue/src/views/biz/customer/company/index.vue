<template>
  <div>
    <a-card title="公司管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增公司
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="公司名称">
          <a-input v-model:value="queryParams.name" placeholder="请输入公司名称" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="行业">
          <a-input v-model:value="queryParams.industry" placeholder="请输入行业" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="规模">
          <a-input v-model:value="queryParams.scale" placeholder="请输入规模" allow-clear style="width: 160px" />
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

      <!-- 公司列表 -->
      <a-table
        :data-source="companyList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizCustomerCompany) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: TableColumn; record: BizCustomerCompany }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该公司吗？" @confirm="handleDelete(record)">
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
      width="720px"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="公司名称" name="name">
              <a-input v-model:value="formData.name" placeholder="请输入公司名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所属行业">
              <a-input v-model:value="formData.industry" placeholder="请输入所属行业" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规模">
              <a-input v-model:value="formData.scale" placeholder="请输入公司规模" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="formData.contactPhone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系人">
              <a-input v-model:value="formData.contactName" placeholder="请输入联系人" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系人职位">
              <a-input v-model:value="formData.contactPosition" placeholder="请输入联系人职位" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="业务范围">
          <a-input v-model:value="formData.business" placeholder="请输入业务范围" />
        </a-form-item>
        <a-divider orientation="left" plain>后勤信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="主要产品">
              <a-input v-model:value="formData.mainProducts" placeholder="请输入主要产品" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="成立日期">
              <a-input v-model:value="formData.establishedDate" placeholder="如 2015-01-01" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="注册资本">
              <a-input v-model:value="formData.capital" placeholder="请输入注册资本" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="公司地址">
              <a-input v-model:value="formData.address" placeholder="请输入公司地址" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="市场表现">
          <a-textarea v-model:value="formData.marketPerformance" placeholder="请输入市场表现" :rows="2" />
        </a-form-item>
        <a-form-item label="竞争优势">
          <a-textarea v-model:value="formData.competitiveAdvantage" placeholder="请输入竞争优势" :rows="2" />
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
import { getCompanyPage, addCompany, updateCompany, deleteCompany, type BizCompanyQuery } from '@/api/biz/company'
import type { BizCustomerCompany } from '@/api/biz/customer'

interface TableColumn {
  title: string
  dataIndex?: string
  key?: string
  width?: number
  fixed?: 'left' | 'right'
}

// 表格列定义
const columns: TableColumn[] = [
  { title: '公司名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '所属行业', dataIndex: 'industry', key: 'industry', width: 120 },
  { title: '规模', dataIndex: 'scale', key: 'scale', width: 100 },
  { title: '业务范围', dataIndex: 'business', key: 'business', width: 200 },
  { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 100 },
  { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 130 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive<BizCompanyQuery>({
  name: undefined,
  industry: undefined,
  scale: undefined
})

// 数据状态
const companyList = ref<BizCustomerCompany[]>([])
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
const modalTitle = ref('新增公司')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<BizCustomerCompany>({
  id: undefined,
  name: '',
  industry: '',
  scale: '',
  business: '',
  mainProducts: '',
  establishedDate: '',
  capital: '',
  address: '',
  marketPerformance: '',
  competitiveAdvantage: '',
  contactName: '',
  contactPhone: '',
  contactPosition: ''
})

// 表单校验规则
const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }]
}

// 加载公司列表
const loadData = async () => {
  loading.value = true
  try {
    const res = await getCompanyPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    const resData = res?.data || res || {}
    companyList.value = resData?.records || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || pagination.current
  } catch {
    console.error('加载公司列表失败')
    companyList.value = []
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
  queryParams.name = undefined
  queryParams.industry = undefined
  queryParams.scale = undefined
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
  formData.name = ''
  formData.industry = ''
  formData.scale = ''
  formData.business = ''
  formData.mainProducts = ''
  formData.establishedDate = ''
  formData.capital = ''
  formData.address = ''
  formData.marketPerformance = ''
  formData.competitiveAdvantage = ''
  formData.contactName = ''
  formData.contactPhone = ''
  formData.contactPosition = ''
}

// 新增
const handleAdd = async () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增公司'
  resetFormData()
  modalVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

// 编辑
const handleEdit = async (record: BizCustomerCompany) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑公司'
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
    const payload: BizCustomerCompany = { ...formData }
    if (isEdit.value && editId.value) {
      payload.id = editId.value
      await updateCompany(payload)
      message.success('修改成功')
    } else {
      await addCompany(payload)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e) {
    console.error('保存公司失败', e)
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
const handleDelete = async (record: BizCustomerCompany) => {
  try {
    await deleteCompany(record.id!)
    message.success('删除成功')
    loadData()
  } catch (e) {
    console.error('删除公司失败', e)
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