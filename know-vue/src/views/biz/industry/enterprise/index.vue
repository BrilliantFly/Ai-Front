<template>
  <div>
    <a-card title="行业企业" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增企业
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="行业">
          <a-select v-model:value="queryParams.industryId" placeholder="全部" allow-clear style="width: 200px">
            <a-select-option v-for="item in industryOptions" :key="item.id" :value="item.id">
              {{ item.industryName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="企业名称">
          <a-input v-model:value="queryParams.enterpriseName" placeholder="请输入企业名称" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="是否上市">
          <a-select v-model:value="queryParams.isListed" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">是</a-select-option>
            <a-select-option :value="0">否</a-select-option>
          </a-select>
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

      <!-- 企业列表 -->
      <a-table
        :data-source="enterpriseList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizIndustryEnterprise) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: BizIndustryEnterprise }">
          <template v-if="column.key === 'industryNames'">
            <template v-if="record.industryNames && record.industryNames.length">
              <a-tag v-for="name in record.industryNames" :key="name" color="blue">{{ name }}</a-tag>
            </template>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'productNames'">
            <template v-if="record.productNames && record.productNames.length">
              <a-tag v-for="name in record.productNames" :key="name" color="green">{{ name }}</a-tag>
            </template>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'isListed'">
            <span>{{ record.isListed === 1 ? '是' : '否' }}</span>
          </template>
          <template v-if="column.key === 'isListed'">
            <a-tag :color="record.isListed === 1 ? 'green' : 'default'">
              {{ record.isListed === 1 ? '已上市' : '未上市' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该企业吗？" @confirm="handleDelete(record)">
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
        <MatrixTable
          v-for="sec in enterpriseSections"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { getIndustryList, type BizIndustry, type BizIndustryEnterprise } from '@/api/biz/industry'
import { getEnterprisePage, addEnterprise, updateEnterprise, deleteEnterprise, type BizEnterpriseQuery } from '@/api/biz/enterprise'
import { getProductPage, type BizIndustryProduct } from '@/api/biz/product'
import MatrixTable from '../../components/MatrixTable.vue'
import { enterpriseSections } from '../enterprise/sections'

// 表格列定义
const columns = [
  { title: '关联行业', dataIndex: 'industryNames', key: 'industryNames', width: 180 },
  { title: '关联产品', dataIndex: 'productNames', key: 'productNames', width: 180 },
  { title: '企业名称', dataIndex: 'enterpriseName', key: 'enterpriseName', width: 200 },
  { title: '企业类型', dataIndex: 'enterpriseType', key: 'enterpriseType', width: 120 },
  { title: '规模', dataIndex: 'scale', key: 'scale', width: 100 },
  { title: '是否上市', dataIndex: 'isListed', key: 'isListed', width: 100 },
  { title: '参保人数', dataIndex: 'insuredCount', key: 'insuredCount', width: 110 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 行业下拉
const industryOptions = ref<BizIndustry[]>([])

// 产品下拉(供关联产品选择)
const productOptions = ref<BizIndustryProduct[]>([])

// 加载行业下拉
const loadIndustryOptions = async () => {
  try {
    const res: any = await getIndustryList()
    const resData = res?.data || res
    const records = Array.isArray(resData) ? resData : resData?.records || []
    industryOptions.value = records || []
  } catch (e) {
    console.error('加载行业列表失败', e)
    industryOptions.value = []
  }
}

// 加载产品下拉
const loadProductOptions = async () => {
  try {
    const res: any = await getProductPage({ pageNum: 1, pageSize: 1000 })
    const resData = res?.data || res
    productOptions.value = resData?.records || resData || []
  } catch (e) {
    console.error('加载产品列表失败', e)
    productOptions.value = []
  }
}

// 查询参数
const queryParams = reactive(<BizEnterpriseQuery>{
  industryId: undefined,
  enterpriseName: undefined,
  isListed: undefined
})

// 数据状态
const enterpriseList = ref<BizIndustryEnterprise[]>([])
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
const modalTitle = ref('新增企业')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<BizIndustryEnterprise>>({
  industryIds: [],
  productIds: [],
  enterpriseType: '',
  enterpriseName: '',
  establishedDate: '',
  registeredCapital: '',
  paidCapital: '',
  scale: '',
  insuredCount: undefined,
  isListed: 0,
  mainBusiness: '',
  coreTechnology: '',
  products: '',
  marketPerformance: '',
  competitors: '',
  advantage: '',
  disadvantage: '',
  upstreamChain: '',
  midstreamChain: '',
  downstreamChannel: '',
  downstreamMarketing: '',
  dynamicInfo: '',
  valueInfo: '',
  industryResources: '',
  strategy: ''
})

// 动态下拉选项(关联行业/关联产品)
const optionsMap = computed<Record<string, { label: string; value: any }[]>>(() => ({
  industryIds: industryOptions.value
    .filter((item) => item.id != null)
    .map((item) => ({ label: item.industryName || '', value: item.id as number })),
  productIds: productOptions.value
    .filter((item) => item.id != null)
    .map((item) => ({ label: item.productName || '', value: item.id as number }))
}))

// 表单校验规则
const rules: Record<string, any> = {
  enterpriseName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }]
}

// 加载企业列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getEnterprisePage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    } as BizEnterpriseQuery)
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器返回整个 body {code, msg, data},这里防御性解包
    const resData = res?.data || res
    enterpriseList.value = resData?.records || resData || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || 1
  } catch (e) {
    console.error('加载企业列表失败', e)
    enterpriseList.value = []
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
  queryParams.industryId = undefined
  queryParams.enterpriseName = undefined
  queryParams.isListed = undefined
  pagination.current = 1
  loadData()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增企业'
  formData.industryIds = []
  formData.productIds = []
  formData.enterpriseType = ''
  formData.enterpriseName = ''
  formData.establishedDate = ''
  formData.registeredCapital = ''
  formData.paidCapital = ''
  formData.scale = ''
  formData.insuredCount = undefined
  formData.isListed = 0
  formData.mainBusiness = ''
  formData.coreTechnology = ''
  formData.products = ''
  formData.marketPerformance = ''
  formData.competitors = ''
  formData.advantage = ''
  formData.disadvantage = ''
  formData.upstreamChain = ''
  formData.midstreamChain = ''
  formData.downstreamChannel = ''
  formData.downstreamMarketing = ''
  formData.dynamicInfo = ''
  formData.valueInfo = ''
  formData.industryResources = ''
  formData.strategy = ''
  modalVisible.value = true
}

// 编辑
const handleEdit = (record: BizIndustryEnterprise) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑企业'
  Object.assign(formData, {
    industryIds: record.industryIds || [],
    productIds: record.productIds || [],
    enterpriseType: record.enterpriseType || '',
    enterpriseName: record.enterpriseName || '',
    establishedDate: record.establishedDate || '',
    registeredCapital: record.registeredCapital || '',
    paidCapital: record.paidCapital || '',
    scale: record.scale || '',
    insuredCount: record.insuredCount ?? undefined,
    isListed: record.isListed ?? 0,
    mainBusiness: record.mainBusiness || '',
    coreTechnology: record.coreTechnology || '',
    products: record.products || '',
    marketPerformance: record.marketPerformance || '',
    competitors: record.competitors || '',
    advantage: record.advantage || '',
    disadvantage: record.disadvantage || '',
    upstreamChain: record.upstreamChain || '',
    midstreamChain: record.midstreamChain || '',
    downstreamChannel: record.downstreamChannel || '',
    downstreamMarketing: record.downstreamMarketing || '',
    dynamicInfo: record.dynamicInfo || '',
    valueInfo: record.valueInfo || '',
    industryResources: record.industryResources || '',
    strategy: record.strategy || ''
  })
  modalVisible.value = true
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
    if (isEdit.value && editId.value) {
      await updateEnterprise({ ...formData, id: editId.value } as BizIndustryEnterprise)
      message.success('修改成功')
    } else {
      await addEnterprise(formData as BizIndustryEnterprise)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    confirmLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 删除
const handleDelete = async (record: BizIndustryEnterprise) => {
  try {
    await deleteEnterprise(record.id!)
    message.success('删除成功')
    loadData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
  loadIndustryOptions()
  loadProductOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>