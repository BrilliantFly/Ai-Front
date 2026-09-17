<template>
  <div>
    <a-card title="行业市场" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增市场
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="所属行业">
          <a-select v-model:value="queryParams.industryId" placeholder="全部" allow-clear style="width: 200px">
            <a-select-option v-for="item in industryOptions" :key="item.id" :value="item.id">
              {{ item.industryName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关键字">
          <a-input v-model:value="queryParams.keyword" placeholder="市场需求/商机" allow-clear style="width: 200px" />
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

      <!-- 市场列表 -->
      <a-table
        :data-source="marketList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizIndustryMarket) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: BizIndustryMarket }">
          <template v-if="column.key === 'industryNames'">
            <template v-if="record.industryNames && record.industryNames.length">
              <a-tag v-for="name in record.industryNames" :key="name" color="blue">{{ name }}</a-tag>
            </template>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space style="white-space: nowrap">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该市场吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <BizFullscreenModal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="confirmLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="960px"
      wrap-class-name="biz-market-modal"
    >
      <a-form ref="formRef" :model="formData" layout="vertical">
        <MatrixTable
          v-for="sec in marketSections"
          :key="sec.title"
          :section="sec"
          :model="formData"
          mode="form"
          :options-map="optionsMap"
        />
      </a-form>
    </BizFullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { getIndustryList, type BizIndustry } from '@/api/biz/industry'
import { getMarketPage, addMarket, saveMarket, deleteMarket, type BizIndustryMarket, type BizMarketQuery } from '@/api/biz/market'
import MatrixTable from '../../components/MatrixTable.vue'
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { marketSections } from '../market/sections'

// 表格列定义
const columns = [
  { title: '所属行业', dataIndex: 'industryNames', key: 'industryNames', width: 180 },
  { title: '市场需求', dataIndex: 'demand', key: 'demand', ellipsis: true },
  { title: '市场机会', dataIndex: 'opportunity', key: 'opportunity', ellipsis: true },
  { title: '价值主张', dataIndex: 'valueProposition', key: 'valueProposition', ellipsis: true },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 行业下拉
const industryOptions = ref<BizIndustry[]>([])

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

// 查询参数
const queryParams = reactive(<BizMarketQuery>{
  industryId: undefined,
  keyword: undefined,
  pageNum: 1,
  pageSize: 10
})

// 数据状态
const marketList = ref<BizIndustryMarket[]>([])
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
const modalTitle = ref('新增市场')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<BizIndustryMarket>>({
  industryIds: [],
  demand: '',
  opportunity: '',
  valueProposition: '',
  customerSegment: '',
  channel: '',
  customerRelation: '',
  revenueSource: '',
  keyResource: '',
  keyPartner: '',
  keyActivity: '',
  costStructure: '',
  valueEvaluation: '',
  valueDistribution: '',
  competitionMethod: '',
  promoChannel: '',
  dynamicInfo: '',
  valueInfo: '',
  strategy: '',
  grossProfit: undefined,
  grossMargin: undefined,
  netProfit: undefined,
  netMargin: undefined
})

// 清空表单
const resetForm = () => {
  Object.assign(formData, {
    industryIds: [],
    demand: '',
    opportunity: '',
    valueProposition: '',
    customerSegment: '',
    channel: '',
    customerRelation: '',
    revenueSource: '',
    keyResource: '',
    keyPartner: '',
    keyActivity: '',
    costStructure: '',
    valueEvaluation: '',
    valueDistribution: '',
    competitionMethod: '',
    promoChannel: '',
    dynamicInfo: '',
    valueInfo: '',
    strategy: '',
    grossProfit: undefined,
    grossMargin: undefined,
    netProfit: undefined,
    netMargin: undefined
  })
}

// 动态下拉选项(关联行业)
const optionsMap = computed<Record<string, { label: string; value: any }[]>>(() => ({
  industryIds: industryOptions.value
    .filter((item) => item.id != null)
    .map((item) => ({ label: item.industryName || '', value: item.id as number }))
}))

// 加载市场列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getMarketPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      industryId: queryParams.industryId,
      keyword: queryParams.keyword
    } as BizMarketQuery)
    // axios 拦截器返回整个 body {code, msg, data},这里防御性解包
    const resData = res?.data || res
    marketList.value = resData?.records || resData || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || 1
  } catch (e) {
    console.error('加载市场列表失败', e)
    marketList.value = []
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
  queryParams.keyword = undefined
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
  resetForm()
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增市场'
  modalVisible.value = true
}

// 编辑
const handleEdit = (record: BizIndustryMarket) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑市场'
  Object.assign(formData, {
    industryIds: record.industryIds || [],
    demand: record.demand || '',
    opportunity: record.opportunity || '',
    valueProposition: record.valueProposition || '',
    customerSegment: record.customerSegment || '',
    channel: record.channel || '',
    customerRelation: record.customerRelation || '',
    revenueSource: record.revenueSource || '',
    keyResource: record.keyResource || '',
    keyPartner: record.keyPartner || '',
    keyActivity: record.keyActivity || '',
    costStructure: record.costStructure || '',
    valueEvaluation: record.valueEvaluation || '',
    valueDistribution: record.valueDistribution || '',
    competitionMethod: record.competitionMethod || '',
    promoChannel: record.promoChannel || '',
    dynamicInfo: record.dynamicInfo || '',
    valueInfo: record.valueInfo || '',
    strategy: record.strategy || '',
    grossProfit: record.grossProfit ?? undefined,
    grossMargin: record.grossMargin ?? undefined,
    netProfit: record.netProfit ?? undefined,
    netMargin: record.netMargin ?? undefined
  })
  modalVisible.value = true
}

// 提交
const handleSubmit = async () => {
  confirmLoading.value = true
  try {
    if (isEdit.value && editId.value) {
      // PUT /{industryId}: industryId 仅作路径占位, 实际主键为 body 中的 id; 保留用户选择的全部关联行业
      const primaryIndustryId = (formData.industryIds && formData.industryIds.length) ? formData.industryIds[0] : 0
      await saveMarket(primaryIndustryId, { ...formData, id: editId.value } as BizIndustryMarket)
      message.success('修改成功')
    } else {
      await addMarket(formData as BizIndustryMarket)
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
const handleDelete = async (record: BizIndustryMarket) => {
  try {
    await deleteMarket(record.id!)
    message.success('删除成功')
    loadData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
  loadIndustryOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>