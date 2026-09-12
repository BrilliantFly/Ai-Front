<template>
  <div>
    <!-- 统计卡片 -->
    <a-row :gutter="16" class="mb-4">
      <a-col :span="6">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-label">客户总数</div>
          <div class="stat-value">{{ statistics.totalCustomers }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-label">关联公司</div>
          <div class="stat-value">{{ statistics.companyCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-label">跟进记录</div>
          <div class="stat-value">{{ statistics.followupCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-label">活跃客户</div>
          <div class="stat-value">{{ statistics.activeCount }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="客户管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增客户
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="客户姓名">
          <a-input v-model:value="queryParams.name" placeholder="请输入客户姓名" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="queryParams.phone" placeholder="请输入手机号" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">潜在</a-select-option>
            <a-select-option :value="2">有意向</a-select-option>
            <a-select-option :value="3">已成交</a-select-option>
            <a-select-option :value="4">流失</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="来源">
          <a-input v-model:value="queryParams.source" placeholder="请输入来源" allow-clear style="width: 140px" />
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

      <!-- 客户列表 -->
      <a-table
        :data-source="customerList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizCustomer) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: TableColumn; record: BizCustomer }">
          <template v-if="column.key === 'gender'">
            {{ record.gender === 1 ? '男' : record.gender === 2 ? '女' : '-' }}
          </template>
          <template v-if="column.key === 'company'">
            {{ record.company?.name || '-' }}
          </template>
          <template v-if="column.key === 'industry'">
            <span v-if="record.industries && record.industries.length">
              {{ record.industries.map((item) => item.industryName || '').filter(Boolean).join('、') }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-select
              :value="record.status"
              size="small"
              style="width: 100px"
              @change="(value) => handleStatusChange(record, value)"
            >
              <a-select-option :value="1">潜在</a-select-option>
              <a-select-option :value="2">有意向</a-select-option>
              <a-select-option :value="3">已成交</a-select-option>
              <a-select-option :value="4">流失</a-select-option>
            </a-select>
          </template>
          <template v-if="column.key === 'demand'">
            {{ demandLevelText(record.demandLevel) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该客户吗？" @confirm="handleDelete(record)">
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
      width="900px"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <SectionCard
          v-for="sec in customerSections"
          :key="sec.title"
          :section="sec"
          :model="formData"
          mode="form"
          :options-map="optionsMap"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import type { PaginationProps, FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import {
  getCustomerPage,
  getCustomerDetail,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  setCustomerIndustries,
  getCustomerStatistics,
  type BizCustomer,
  type BizCustomerQuery,
  type BizCustomerCompany,
  type BizCustomerIndustry
} from '@/api/biz/customer'
import { getIndustryList, type BizIndustry } from '@/api/biz/industry'
import SectionCard from '../../components/SectionCard.vue'
import { customerSections } from '../sections'

interface TableColumn {
  title: string
  dataIndex?: string
  key?: string
  width?: number
  fixed?: 'left' | 'right'
}

interface CustomerCompanyForm {
  id?: number
  name: string
  industry: string
  scale?: string
  business?: string
  mainProducts?: string
  establishedDate?: string
  capital?: string
  address?: string
  marketPerformance?: string
  competitiveAdvantage?: string
  contactName: string
  contactPhone: string
  contactPosition?: string
}

interface CustomerFormData {
  name?: string
  gender?: number
  age?: number
  phone?: string
  email?: string
  address?: string
  regionCode?: string
  education?: string
  educationRaw?: string
  occupation?: string
  position?: string
  personality?: string
  hobby?: string
  valuesText?: string
  lifestyle?: string
  maritalStatus?: string
  familySituation?: string
  customerType?: number
  companyId?: number
  status?: number
  source?: string
  demandLevel?: number
  valueScore?: number
  demandWillingness?: number
  demandBudget?: number
  demandDecision?: string
  demandPriority?: number
  demandDesc?: string
  demandTags?: string
  company: CustomerCompanyForm
  industryIds: number[]
  profile?: Partial<BizCustomerProfile>
}

// 表格列定义
const columns: TableColumn[] = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
  { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
  { title: '年龄', dataIndex: 'age', key: 'age', width: 70 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '公司', dataIndex: 'company', key: 'company', width: 180 },
  { title: '行业', dataIndex: 'industries', key: 'industry', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '需求等级', dataIndex: 'demandLevel', key: 'demand', width: 90 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive<BizCustomerQuery>({
  name: undefined,
  phone: undefined,
  status: undefined,
  source: undefined
})

// 统计卡片
const statistics = reactive({
  totalCustomers: 0,
  companyCount: 0,
  followupCount: 0,
  activeCount: 0
})

// 数据状态
const customerList = ref<BizCustomer[]>([])
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
const modalTitle = ref('新增客户')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 行业下拉选项
const industryOptions = ref<{ label: string; value: number }[]>([])

// 表单数据
const formData = reactive<CustomerFormData>({
  name: '',
  gender: 1,
  age: undefined,
  phone: '',
  email: '',
  address: '',
  regionCode: '',
  education: '',
  educationRaw: '',
  occupation: '',
  position: '',
  personality: '',
  hobby: '',
  valuesText: '',
  lifestyle: '',
  maritalStatus: '',
  familySituation: '',
  customerType: 1,
  companyId: undefined,
  status: 1,
  source: '',
  demandLevel: 1,
  valueScore: undefined,
  demandWillingness: undefined,
  demandBudget: undefined,
  demandDecision: '',
  demandPriority: undefined,
  demandDesc: '',
  demandTags: '',
  company: {
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
  },
  industryIds: [],
  profile: {
    dynamicInfo: '',
    valueLevel: undefined,
    valueExpect: '',
    valueInterest: '',
    strategy: '',
    talkScript: '',
    analysis: ''
  }
})

// 动态下拉选项(关联行业)
const optionsMap = computed<Record<string, { label: string; value: any }[]>>(() => {
  const industrySel = industryOptions.value
  return {
    industryIds: Array.isArray(industrySel) ? industrySel : []
  }
})

// 表单校验规则
const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  'company.name': [{ required: true, message: '请输入公司名称', trigger: 'blur' }]
}

// 从多组候选值中取第一个可用的数字(统计字段防御转换)
const toNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (!Number.isNaN(num)) return num
  }
  return 0
}

// 需求等级文案
const demandLevelText = (level?: number): string => {
  if (level === 1) return '低'
  if (level === 2) return '中'
  if (level === 3) return '高'
  return '-'
}

// 加载客户列表
const loadData = async () => {
  loading.value = true
  try {
    const res = await getCustomerPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    const resData = res?.data || res || {}
    customerList.value = resData?.records || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || pagination.current
  } catch {
    console.error('加载客户列表失败')
    customerList.value = []
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const res = await getCustomerStatistics()
    const resData = res?.data || res || {}
    console.log('客户统计原始数据:', resData)
    if (resData && typeof resData === 'object') {
      const raw = resData as Record<string, unknown>
      statistics.totalCustomers = toNumber(raw.totalCustomers, raw.customerCount, raw.total)
      statistics.companyCount = toNumber(raw.companyCount, raw.companyNum)
      statistics.followupCount = toNumber(raw.followupCount, raw.followupNum)
      statistics.activeCount = toNumber(raw.activeCount, raw.activeCustomerCount)
    }
  } catch {
    console.error('获取客户统计失败')
  }
}

// 加载行业下拉选项
const loadIndustryOptions = async () => {
  try {
    const res = await getIndustryList()
    const resData = res?.data || res
    const list: BizIndustry[] = Array.isArray(resData)
      ? resData
      : resData?.list || resData?.records || []
    industryOptions.value = list
      .filter((item) => item.id != null)
      .map((item) => ({ label: item.industryName || '', value: item.id as number }))
  } catch {
    console.error('加载行业列表失败')
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
  queryParams.phone = undefined
  queryParams.status = undefined
  queryParams.source = undefined
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
  formData.name = ''
  formData.gender = 1
  formData.age = undefined
  formData.phone = ''
  formData.email = ''
  formData.address = ''
  formData.regionCode = ''
  formData.education = ''
  formData.educationRaw = ''
  formData.occupation = ''
  formData.position = ''
  formData.personality = ''
  formData.hobby = ''
  formData.valuesText = ''
  formData.lifestyle = ''
  formData.maritalStatus = ''
  formData.familySituation = ''
  formData.customerType = 1
  formData.companyId = undefined
  formData.status = 1
  formData.source = ''
  formData.demandLevel = 1
  formData.valueScore = undefined
  formData.demandWillingness = undefined
  formData.demandBudget = undefined
  formData.demandDecision = ''
  formData.demandPriority = undefined
  formData.demandDesc = ''
  formData.demandTags = ''
  formData.company = {
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
  }
  formData.industryIds = []
  formData.profile = {
    dynamicInfo: '',
    valueLevel: undefined,
    valueExpect: '',
    valueInterest: '',
    strategy: '',
    talkScript: '',
    analysis: ''
  }
}

// 新增
const handleAdd = async () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增客户'
  resetFormData()
  modalVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

// 编辑(先拉取详情回填)
const handleEdit = async (record: BizCustomer) => {
  if (!record.id) return
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑客户'
  resetFormData()
  modalVisible.value = true
  try {
    const res = await getCustomerDetail(record.id)
    const detail = (res?.data || res || {}) as BizCustomer
    formData.name = detail.name || ''
    formData.gender = detail.gender ?? 1
    formData.age = detail.age
    formData.phone = detail.phone || ''
    formData.email = detail.email || ''
    formData.address = detail.address || ''
    formData.regionCode = detail.regionCode || ''
    formData.education = detail.education || ''
    formData.educationRaw = detail.educationRaw || ''
    formData.occupation = detail.occupation || ''
    formData.position = detail.position || ''
    formData.personality = detail.personality || ''
    formData.hobby = detail.hobby || ''
    formData.valuesText = detail.valuesText || ''
    formData.lifestyle = detail.lifestyle || ''
    formData.maritalStatus = detail.maritalStatus || ''
    formData.familySituation = detail.familySituation || ''
    formData.customerType = detail.customerType ?? 1
    formData.companyId = detail.companyId
    formData.status = detail.status ?? 1
    formData.source = detail.source || ''
    formData.demandLevel = detail.demandLevel ?? 1
    formData.valueScore = detail.valueScore
    formData.demandWillingness = detail.demandWillingness
    formData.demandBudget = detail.demandBudget
    formData.demandDecision = detail.demandDecision || ''
    formData.demandPriority = detail.demandPriority
    formData.demandDesc = detail.demandDesc || ''
    formData.demandTags = detail.demandTags || ''
    formData.company = {
      id: detail.company?.id,
      name: detail.company?.name || '',
      industry: detail.company?.industry || '',
      scale: detail.company?.scale || '',
      business: detail.company?.business || '',
      mainProducts: detail.company?.mainProducts || '',
      establishedDate: detail.company?.establishedDate || '',
      capital: detail.company?.capital || '',
      address: detail.company?.address || '',
      marketPerformance: detail.company?.marketPerformance || '',
      competitiveAdvantage: detail.company?.competitiveAdvantage || '',
      contactName: detail.company?.contactName || '',
      contactPhone: detail.company?.contactPhone || '',
      contactPosition: detail.company?.contactPosition || ''
    }
    formData.profile = {
      dynamicInfo: detail.profile?.dynamicInfo || '',
      valueLevel: detail.profile?.valueLevel,
      valueExpect: detail.profile?.valueExpect || '',
      valueInterest: detail.profile?.valueInterest || '',
      strategy: detail.profile?.strategy || '',
      talkScript: detail.profile?.talkScript || '',
      analysis: detail.profile?.analysis || ''
    }
    const industries: BizCustomerIndustry[] = detail.industries || []
    const idsFromIndustries = industries.flatMap((item) => (item.industryId != null ? [item.industryId] : []))
    formData.industryIds =
      Array.isArray(detail.industryIds) && detail.industryIds.length ? detail.industryIds : idsFromIndustries
    await nextTick()
    formRef.value?.clearValidate()
  } catch (e) {
    console.error('获取客户详情失败', e)
  }
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
    const payload: BizCustomer = {
      ...formData,
      company: { ...formData.company } as BizCustomerCompany,
      industryIds: [...formData.industryIds]
    }
    if (isEdit.value && editId.value) {
      payload.id = editId.value
      await updateCustomer(payload)
      const relations: BizCustomerIndustry[] = formData.industryIds.map((industryId) => ({
        customerId: editId.value,
        industryId,
        relationType: 1
      }))
      if (relations.length) {
        await setCustomerIndustries(editId.value, relations)
      }
      message.success('修改成功')
    } else {
      await addCustomer(payload)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
    loadStatistics()
  } catch (e) {
    console.error('保存客户失败', e)
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
const handleDelete = async (record: BizCustomer) => {
  try {
    await deleteCustomer(record.id!)
    message.success('删除成功')
    loadData()
    loadStatistics()
  } catch (e) {
    console.error('删除客户失败', e)
    message.error('删除失败')
  }
}

// 表格内状态切换
const handleStatusChange = async (record: BizCustomer, value: number | string | number[] | string[] | undefined) => {
  const status = Number(value)
  if (!record.id || Number.isNaN(status) || status === record.status) return
  try {
    await updateCustomerStatus(record.id, status)
    message.success('状态修改成功')
    record.status = status
  } catch (e) {
    console.error('修改客户状态失败', e)
    message.error('状态修改失败')
  }
}

onMounted(() => {
  loadData()
  loadStatistics()
  loadIndustryOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-card .stat-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-card .stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}
</style>