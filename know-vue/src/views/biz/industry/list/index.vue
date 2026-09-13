<template>
  <div>
    <a-card title="行业管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增行业
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="行业名称">
          <a-input v-model:value="queryParams.industryName" placeholder="请输入行业名称" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="行业代码">
          <a-input v-model:value="queryParams.industryCode" placeholder="请输入行业代码" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="queryParams.visibility" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">可见</a-select-option>
            <a-select-option :value="0">隐藏</a-select-option>
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

      <!-- 行业列表 -->
      <a-table
        :data-source="industryList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizIndustry) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: BizIndustry }">
          <template v-if="column.key === 'visibility'">
            <a-tag :color="record.visibility === 1 ? 'green' : 'default'">
              {{ record.visibility === 1 ? '可见' : '隐藏' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="openDetailModal(record)">行业详情</a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该行业吗？" @confirm="handleDelete(record)">
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
          v-for="sec in industrySections"
          :key="sec.title"
          :section="sec"
          :model="formData"
          mode="form"
        />
      </a-form>
    </a-modal>

    <!-- 行业详情弹窗 -->
    <a-modal
      v-model:open="detailModal.visible"
      :title="detailModal.title"
      :footer="null"
      width="1000px"
      @cancel="handleDetailClose"
    >
      <a-spin :spinning="detailModal.loading">
        <template v-if="detailModal.industry">
          <!-- 四个关联 tab: 行业信息 / 行业产品 / 行业企业 / 市场信息 -->
          <a-tabs v-model:activeKey="detailModal.tab">
            <a-tab-pane key="info" tab="行业信息">
              <MatrixTable
                v-for="sec in industrySections"
                :key="sec.title"
                :section="sec"
                :model="(detailModal.industry as any) || {}"
                mode="detail"
              />
            </a-tab-pane>
            <a-tab-pane key="products" tab="行业产品">
              <a-table
                :data-source="detailModal.products"
                :columns="productColumns"
                :pagination="false"
                :row-key="(record: any) => record.id!"
                size="small"
              />
            </a-tab-pane>
            <a-tab-pane key="enterprises" tab="行业企业">
              <a-table
                :data-source="detailModal.enterprises"
                :columns="enterpriseColumns"
                :pagination="false"
                :row-key="(record: any) => record.id!"
                size="small"
              />
            </a-tab-pane>
            <a-tab-pane key="market" tab="市场信息">
              <MatrixTable
                v-if="detailModal.market"
                v-for="sec in marketSections"
                :key="sec.title"
                :section="sec"
                :model="(detailModal.market as any)"
                mode="detail"
              />
              <a-empty v-else description="暂无市场信息" />
            </a-tab-pane>
          </a-tabs>
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { getIndustryPage, getIndustryDetail, addIndustry, updateIndustry, deleteIndustry, type BizIndustry, type BizIndustryQuery } from '@/api/biz/industry'
import type { BizIndustryMarket } from '@/api/biz/market'
import MatrixTable from '../../components/MatrixTable.vue'
import { industrySections } from '../sections'
import { marketSections } from '../market/sections'

// 表格列定义
const columns = [
  { title: '行业名称', dataIndex: 'industryName', key: 'industryName', width: 160 },
  { title: '行业代码', dataIndex: 'industryCode', key: 'industryCode', width: 140 },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 180 },
  { title: '毛利率', dataIndex: 'grossMargin', key: 'grossMargin', width: 100 },
  { title: '净利率', dataIndex: 'netMargin', key: 'netMargin', width: 100 },
  { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '可见性', dataIndex: 'visibility', key: 'visibility', width: 90 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' }
]

// 行业产品表格列
const productColumns = [
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 150 },
  { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
  { title: '产品概念', dataIndex: 'productConcept', key: 'productConcept', ellipsis: true },
  { title: '生命周期', dataIndex: 'lifeCycle', key: 'lifeCycle', width: 90 }
]

// 行业企业表格列
const enterpriseColumns = [
  { title: '企业名称', dataIndex: 'enterpriseName', key: 'enterpriseName', width: 180 },
  { title: '类型', dataIndex: 'enterpriseType', key: 'enterpriseType', width: 100 },
  { title: '规模', dataIndex: 'scale', key: 'scale', width: 90 },
  { title: '是否上市', dataIndex: 'isListed', key: 'isListed', width: 90 },
  { title: '主营业务', dataIndex: 'mainBusiness', key: 'mainBusiness', ellipsis: true }
]

// 行业详情弹窗状态
const detailModal = reactive({
  visible: false,
  loading: false,
  title: '',
  tab: 'products',
  industry: null as BizIndustry | null,
  products: [] as any[],
  enterprises: [] as any[],
  market: null as BizIndustryMarket | null
})

// 查询参数
const queryParams = reactive(<BizIndustryQuery>{
  industryName: undefined,
  industryCode: undefined,
  visibility: undefined
})

// 数据状态
const industryList = ref<BizIndustry[]>([])
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
const modalTitle = ref('新增行业')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<BizIndustry>>({
  industryName: '',
  industryCode: '',
  tags: '',
  visibility: 1,
  sort: 0,
  definition: '',
  technology: '',
  upstreamChain: '',
  midstreamChain: '',
  downstreamChannel: '',
  downstreamMarketing: '',
  developmentOverview: '',
  marketSize: '',
  growthPotential: '',
  grossProfit: undefined,
  grossMargin: undefined,
  netProfit: undefined,
  netMargin: undefined,
  dynamicInfo: '',
  valueInfo: '',
  industryResources: '',
  strategy: ''
})

// 表单校验规则
const rules: Record<string, any> = {
  industryName: [{ required: true, message: '请输入行业名称', trigger: 'blur' }],
  industryCode: [{ required: true, message: '请输入行业代码', trigger: 'blur' }]
}

// 加载行业列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getIndustryPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    } as BizIndustryQuery)
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器返回整个 body {code, msg, data},这里防御性解包
    const resData = res?.data || res
    industryList.value = resData?.records || resData || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || 1
  } catch (e) {
    console.error('加载行业列表失败', e)
    industryList.value = []
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
  queryParams.industryName = undefined
  queryParams.industryCode = undefined
  queryParams.visibility = undefined
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
  modalTitle.value = '新增行业'
  formData.industryName = ''
  formData.industryCode = ''
  formData.tags = ''
  formData.visibility = 1
  formData.sort = 0
  formData.definition = ''
  formData.technology = ''
  formData.upstreamChain = ''
  formData.midstreamChain = ''
  formData.downstreamChannel = ''
  formData.downstreamMarketing = ''
  formData.developmentOverview = ''
  formData.marketSize = ''
  formData.growthPotential = ''
  formData.grossProfit = undefined
  formData.grossMargin = undefined
  formData.netProfit = undefined
  formData.netMargin = undefined
  formData.dynamicInfo = ''
  formData.valueInfo = ''
  formData.industryResources = ''
  formData.strategy = ''
  modalVisible.value = true
}

// 编辑(直接回填,不调详情接口)
const handleEdit = (record: BizIndustry) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑行业'
  Object.assign(formData, {
    ...record,
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
      await updateIndustry({ ...formData, id: editId.value } as BizIndustry)
      message.success('修改成功')
    } else {
      await addIndustry(formData as BizIndustry)
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
const handleDelete = async (record: BizIndustry) => {
  try {
    await deleteIndustry(record.id!)
    message.success('删除成功')
    loadData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

// 打开行业详情(detail 接口一次返回行业 + 产品 + 企业 + 市场)
const openDetailModal = async (record: BizIndustry) => {
  detailModal.title = `行业详情 - ${record.industryName}`
  detailModal.visible = true
  detailModal.loading = true
  detailModal.tab = 'info'
  detailModal.industry = null
  detailModal.products = []
  detailModal.enterprises = []
  detailModal.market = null
  try {
    const res: any = await getIndustryDetail(record.id!)
    const resData = res?.data || res
    detailModal.industry = resData || null
    detailModal.products = resData?.products || []
    detailModal.enterprises = resData?.enterprises || []
    detailModal.market = resData?.market || null
  } catch (e: any) {
    message.error(e?.message || '查询行业详情失败')
  } finally {
    detailModal.loading = false
  }
}

// 关闭行业详情
const handleDetailClose = () => {
  detailModal.visible = false
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