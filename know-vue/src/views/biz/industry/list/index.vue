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
      width="800px"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="basic" tab="基本信息">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="行业名称" name="industryName">
                  <a-input v-model:value="formData.industryName" placeholder="请输入行业名称" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="行业代码" name="industryCode">
                  <a-input v-model:value="formData.industryCode" placeholder="请输入行业代码" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="标签">
                  <a-input v-model:value="formData.tags" placeholder="多个标签用逗号分隔" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="可见性">
                  <a-select v-model:value="formData.visibility" placeholder="请选择可见性">
                    <a-select-option :value="1">可见</a-select-option>
                    <a-select-option :value="0">隐藏</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="排序">
                  <a-input-number v-model:value="formData.sort" placeholder="排序值" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-tab-pane>

          <a-tab-pane key="chain" tab="产业链与概述">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="上游产业链">
                  <a-textarea v-model:value="formData.upstreamChain" placeholder="请输入上游产业链" :rows="3" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="中游产业链">
                  <a-textarea v-model:value="formData.midstreamChain" placeholder="请输入中游产业链" :rows="3" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="下游渠道">
                  <a-textarea v-model:value="formData.downstreamChannel" placeholder="请输入下游渠道" :rows="3" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="下游营销">
                  <a-textarea v-model:value="formData.downstreamMarketing" placeholder="请输入下游营销" :rows="3" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="发展概述">
              <a-textarea v-model:value="formData.developmentOverview" placeholder="请输入行业发展概述" :rows="3" />
            </a-form-item>
          </a-tab-pane>

          <a-tab-pane key="finance" tab="财务与战略">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="毛利额">
                  <a-input-number v-model:value="formData.grossProfit" placeholder="毛利额" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="毛利率(%)">
                  <a-input-number v-model:value="formData.grossMargin" placeholder="毛利率" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="净利额">
                  <a-input-number v-model:value="formData.netProfit" placeholder="净利额" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="净利率(%)">
                  <a-input-number v-model:value="formData.netMargin" placeholder="净利率" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="战略">
              <a-textarea v-model:value="formData.strategy" placeholder="请输入行业战略" :rows="3" />
            </a-form-item>
          </a-tab-pane>
        </a-tabs>
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
              <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="行业名称">{{ detailModal.industry.industryName || '-' }}</a-descriptions-item>
                <a-descriptions-item label="行业代码">{{ detailModal.industry.industryCode || '-' }}</a-descriptions-item>
                <a-descriptions-item label="标签">{{ detailModal.industry.tags || '-' }}</a-descriptions-item>
                <a-descriptions-item label="可见性">
                  <a-tag :color="detailModal.industry.visibility === 1 ? 'green' : 'default'">
                    {{ detailModal.industry.visibility === 1 ? '可见' : '隐藏' }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="毛利率">{{ detailModal.industry.grossMargin ?? '-' }}</a-descriptions-item>
                <a-descriptions-item label="净利率">{{ detailModal.industry.netMargin ?? '-' }}</a-descriptions-item>
                <a-descriptions-item label="定义" :span="2">{{ detailModal.industry.definition || '-' }}</a-descriptions-item>
                <a-descriptions-item label="上游产业链" :span="2">{{ detailModal.industry.upstreamChain || '-' }}</a-descriptions-item>
                <a-descriptions-item label="中游产业链" :span="2">{{ detailModal.industry.midstreamChain || '-' }}</a-descriptions-item>
                <a-descriptions-item label="下游渠道">{{ detailModal.industry.downstreamChannel || '-' }}</a-descriptions-item>
                <a-descriptions-item label="下游营销">{{ detailModal.industry.downstreamMarketing || '-' }}</a-descriptions-item>
                <a-descriptions-item label="发展概述" :span="2">{{ detailModal.industry.developmentOverview || '-' }}</a-descriptions-item>
                <a-descriptions-item label="市场规模">{{ detailModal.industry.marketSize || '-' }}</a-descriptions-item>
                <a-descriptions-item label="增长潜力">{{ detailModal.industry.growthPotential || '-' }}</a-descriptions-item>
                <a-descriptions-item label="战略" :span="2">{{ detailModal.industry.strategy || '-' }}</a-descriptions-item>
              </a-descriptions>
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
              <a-descriptions v-if="detailModal.market" :column="2" bordered size="small">
                <a-descriptions-item label="市场需求" :span="2">{{ detailModal.market.demand || '-' }}</a-descriptions-item>
                <a-descriptions-item label="市场机会" :span="2">{{ detailModal.market.opportunity || '-' }}</a-descriptions-item>
                <a-descriptions-item label="价值主张" :span="2">{{ detailModal.market.valueProposition || '-' }}</a-descriptions-item>
                <a-descriptions-item label="客户细分">{{ detailModal.market.customerSegment || '-' }}</a-descriptions-item>
                <a-descriptions-item label="渠道">{{ detailModal.market.channel || '-' }}</a-descriptions-item>
                <a-descriptions-item label="客户关系">{{ detailModal.market.customerRelation || '-' }}</a-descriptions-item>
                <a-descriptions-item label="收入来源">{{ detailModal.market.revenueSource || '-' }}</a-descriptions-item>
                <a-descriptions-item label="关键资源">{{ detailModal.market.keyResource || '-' }}</a-descriptions-item>
                <a-descriptions-item label="关键伙伴">{{ detailModal.market.keyPartner || '-' }}</a-descriptions-item>
                <a-descriptions-item label="关键活动">{{ detailModal.market.keyActivity || '-' }}</a-descriptions-item>
                <a-descriptions-item label="成本结构">{{ detailModal.market.costStructure || '-' }}</a-descriptions-item>
                <a-descriptions-item label="价值评估">{{ detailModal.market.valueEvaluation || '-' }}</a-descriptions-item>
                <a-descriptions-item label="价值分配">{{ detailModal.market.valueDistribution || '-' }}</a-descriptions-item>
                <a-descriptions-item label="竞争方式">{{ detailModal.market.competitionMethod || '-' }}</a-descriptions-item>
                <a-descriptions-item label="推广渠道">{{ detailModal.market.promoChannel || '-' }}</a-descriptions-item>
              </a-descriptions>
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
const activeTab = ref('basic')

// 表单数据
const formData = reactive<Partial<BizIndustry>>({
  industryName: '',
  industryCode: '',
  tags: '',
  visibility: 1,
  sort: 0,
  upstreamChain: '',
  midstreamChain: '',
  downstreamChannel: '',
  downstreamMarketing: '',
  developmentOverview: '',
  grossProfit: undefined,
  grossMargin: undefined,
  netProfit: undefined,
  netMargin: undefined,
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
  activeTab.value = 'basic'
  formData.industryName = ''
  formData.industryCode = ''
  formData.tags = ''
  formData.visibility = 1
  formData.sort = 0
  formData.upstreamChain = ''
  formData.midstreamChain = ''
  formData.downstreamChannel = ''
  formData.downstreamMarketing = ''
  formData.developmentOverview = ''
  formData.grossProfit = undefined
  formData.grossMargin = undefined
  formData.netProfit = undefined
  formData.netMargin = undefined
  formData.strategy = ''
  modalVisible.value = true
}

// 编辑(直接回填,不调详情接口)
const handleEdit = (record: BizIndustry) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑行业'
  activeTab.value = 'basic'
  Object.assign(formData, record)
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