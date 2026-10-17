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
          <a-cascader
            v-model:value="industryCascaderValue"
            :options="cascaderOptions"
            :change-on-select="true"
            placeholder="全部"
            allow-clear
            style="width: 260px"
            @change="handleIndustryCascadeChange"
          />
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
          <template v-if="column.key === 'knowledgeBaseId'">
            <a v-if="record.knowledgeBaseId" @click="viewKnowledgeBase(record)">查看知识库</a>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space style="white-space: nowrap">
              <a @click="openDetail(record)">详情</a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该市场吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
              </a-popconfirm>
              <template v-if="record.knowledgeBaseId">
                <a-divider type="vertical" />
                <a @click="viewKnowledgeBase(record)">知识库</a>
              </template>
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

    <!-- 详情弹窗 -->
    <BizFullscreenModal
      v-model:open="detailVisible"
      :title="detailTitle"
      width="960px"
      wrap-class-name="biz-market-modal"
      scrolling
    >
      <MatrixTable
        v-for="sec in marketSections"
        :key="sec.title"
        :section="sec"
        :model="detailData"
        mode="detail"
        :options-map="optionsMap"
      />
    </BizFullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { getIndustryTree, type BizIndustry } from '@/api/biz/industry'
import { getMarketPage, addMarket, saveMarket, deleteMarket, type BizIndustryMarket, type BizMarketQuery } from '@/api/biz/market'
import { getKnowledgeBaseOptions } from '@/api/knowledge'
import MatrixTable from '../../components/MatrixTable.vue'
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { marketSections } from '../market/sections'

const router = useRouter()

// 表格列定义
const columns = [
  { title: '所属行业', dataIndex: 'industryNames', key: 'industryNames', width: 180 },
  { title: '关联知识库', dataIndex: 'knowledgeBaseId', key: 'knowledgeBaseId', width: 120 },
  { title: '市场需求', dataIndex: 'demand', key: 'demand', ellipsis: true },
  { title: '市场机会', dataIndex: 'opportunity', key: 'opportunity', ellipsis: true },
  { title: '价值主张', dataIndex: 'valueProposition', key: 'valueProposition', ellipsis: true },
  { title: '操作', key: 'action', width: 160, fixed: 'right' }
]

// 行业选项（树形摊平，带层级缩进；用于表单多选 / 详情映射）
interface IndustrySelectOption {
  id: number
  industryName: string
  depth: number
}
const industryOptions = ref<IndustrySelectOption[]>([])

// 行业树（级联查询用，保留原始层级）
const industryTree = ref<BizIndustry[]>([])

/** 级联选择器选项：{ value, label, children }（叶子无 children） */
interface CascaderOption {
  value: number
  label: string
  children?: CascaderOption[]
}
const buildCascaderOptions = (nodes: BizIndustry[] = []): CascaderOption[] =>
  (nodes || []).map((node) => ({
    value: node.id as number,
    label: node.industryName || String(node.id),
    children: node.children?.length ? buildCascaderOptions(node.children) : undefined
  }))
const cascaderOptions = computed<CascaderOption[]>(() => buildCascaderOptions(industryTree.value))

// 级联查询绑定值（路径数组；changeOnSelect 下选中任意层级取末位 id）
const industryCascaderValue = ref<Array<number | string> | undefined>(undefined)

/** 级联变更：取路径末位为查询行业 id（清空则为 undefined） */
const handleIndustryCascadeChange = (value: any) => {
  const path = Array.isArray(value) ? value : []
  queryParams.industryId = path.length ? path[path.length - 1] : undefined
}

/** 树 → 缩进摊平（深度优先；顶级无缩进，下级用全角空格缩进） */
const flattenIndustryTree = (nodes: BizIndustry[], depth = 0, out: IndustrySelectOption[] = []): IndustrySelectOption[] => {
  for (const node of nodes || []) {
    if (node.id != null) {
      out.push({ id: node.id as number, industryName: node.industryName || '', depth })
    }
    if (node.children?.length) flattenIndustryTree(node.children, depth + 1, out)
  }
  return out
}

// 加载行业选项（树形，体现 行业 -> 下级行业 层级）
const loadIndustryOptions = async () => {
  try {
    const res: any = await getIndustryTree()
    const resData = res?.data || res
    const records = Array.isArray(resData) ? resData : resData?.records || []
    industryTree.value = records
    industryOptions.value = flattenIndustryTree(records)
  } catch (e) {
    console.error('加载行业列表失败', e)
    industryTree.value = []
    industryOptions.value = []
  }
}

// 知识库下拉
const kbOptions = ref<{ label: string; value: number }[]>([])
const loadKnowledgeBaseOptions = async () => {
  try {
    const res: any = await getKnowledgeBaseOptions()
    const arr = res?.data || res || []
    kbOptions.value = (Array.isArray(arr) ? arr : []).map((kb: any) => ({ label: kb.name, value: kb.id }))
  } catch (e) {
    console.error('加载知识库列表失败', e)
    kbOptions.value = []
  }
}
const viewKnowledgeBase = (record: any) => {
  if (!record.knowledgeBaseId) return
  router.push({ path: '/knowledge/document', query: { knowledgeBaseId: String(record.knowledgeBaseId) } })
}

/** 缩进展示名称（下级行业前加缩进，便于识别层级） */
const indentedName = (opt: IndustrySelectOption) =>
  opt.depth > 0 ? `${'\u3000'.repeat(opt.depth)}${opt.industryName}` : opt.industryName

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
  netMargin: undefined,
  knowledgeBaseId: undefined
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
    netMargin: undefined,
    knowledgeBaseId: undefined
  })
}

// 动态下拉选项(关联行业；缩进体现层级)
const optionsMap = computed<Record<string, { label: string; value: any }[]>>(() => ({
  industryIds: industryOptions.value.map((item) => ({
    label: indentedName(item),
    value: item.id
  })),
  knowledgeBaseId: kbOptions.value
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
  industryCascaderValue.value = undefined
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
    netMargin: record.netMargin ?? undefined,
    knowledgeBaseId: record.knowledgeBaseId ?? undefined
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

// 详情弹窗状态
const detailVisible = ref(false)
const detailTitle = ref('市场详情')
const detailData = ref<Partial<BizIndustryMarket>>({})

// 打开详情
const openDetail = (record: BizIndustryMarket) => {
  detailTitle.value = record.id != null ? `市场详情 - #${record.id}` : '市场详情'
  detailData.value = record
  detailVisible.value = true
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
  loadKnowledgeBaseOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>