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

      <!-- 行业列表（树形：行业 -> 下级行业） -->
      <a-table
        :data-source="industryList"
        :columns="columns"
        :loading="loading"
        :pagination="false"
        :row-key="(record: BizIndustry) => record.id!"
        v-model:expandedRowKeys="expandedRowKeys"
      >
        <template #bodyCell="{ column, record }: { column: any; record: BizIndustry }">
          <template v-if="column.key === 'visibility'">
            <a-tag :color="record.visibility === 1 ? 'green' : 'default'">
              {{ record.visibility === 1 ? '可见' : '隐藏' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'knowledgeBaseId'">
            <a v-if="record.knowledgeBaseId" @click="viewKnowledgeBase(record)">查看知识库</a>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space style="white-space: nowrap">
              <a @click="handleAddChild(record)">新增下级</a>
              <a-divider type="vertical" />
              <a @click="openDetailModal(record)">行业详情</a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该行业吗？" @confirm="handleDelete(record)">
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
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <MatrixTable
          v-for="sec in industrySections"
          :key="sec.title"
          :section="sec"
          :model="formData"
          mode="form"
          :options-map="formOptionsMap"
        />
      </a-form>
    </BizFullscreenModal>

    <!-- 行业详情弹窗 -->
    <BizFullscreenModal
      v-model:open="detailModal.visible"
      :title="detailModal.title"
      :footer="null"
      width="1000px"
      scrolling
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
                :options-map="detailOptionsMap"
              />
            </a-tab-pane>
            <a-tab-pane key="products" tab="行业产品">
              <a-table
                :data-source="detailModal.products"
                :columns="productColumns"
                :pagination="false"
                :row-key="(record: any) => record.id!"
                size="small"
              >
                <template #bodyCell="{ column, record }: { column: any; record: any }">
                  <template v-if="column.key === 'action'">
                    <a @click="openProductDetail(record)">详情</a>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
            <a-tab-pane key="enterprises" tab="行业企业">
              <a-table
                :data-source="detailModal.enterprises"
                :columns="enterpriseColumns"
                :pagination="false"
                :row-key="(record: any) => record.id!"
                size="small"
              >
                <template #bodyCell="{ column, record }: { column: any; record: any }">
                  <template v-if="column.key === 'action'">
                    <a @click="openEnterpriseDetail(record)">详情</a>
                  </template>
                </template>
              </a-table>
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
    </BizFullscreenModal>

    <!-- 嵌套详情弹窗: 行业详情内 产品/企业 记录的完整字段 -->
    <BizFullscreenModal
      v-model:open="subDetail.visible"
      :title="subDetail.title"
      :footer="null"
      width="960px"
      scrolling
    >
      <MatrixTable
        v-for="sec in subDetail.sections"
        :key="sec.title"
        :section="sec"
        :model="subDetail.data"
        mode="detail"
        :options-map="subDetail.optionsMap"
      />
    </BizFullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { getIndustryTree, getIndustryDetail, addIndustry, updateIndustry, deleteIndustry, type BizIndustry, type BizIndustryQuery } from '@/api/biz/industry'
import { getIndustryTypeTree } from '@/api/system/cascadeDict'
import { getKnowledgeBaseOptions } from '@/api/knowledge'
import type { BizIndustryMarket } from '@/api/biz/market'
import MatrixTable from '../../components/MatrixTable.vue'
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { industrySections } from '../sections'
import { marketSections } from '../market/sections'
import { productSections } from '../product/sections'
import { enterpriseSections } from '../enterprise/sections'
import type { SectionDef } from '../../components/types'

const router = useRouter()

// 表格列定义
const columns = [
  { title: '行业名称', dataIndex: 'industryName', key: 'industryName', width: 220 },
  { title: '关联知识库', dataIndex: 'knowledgeBaseId', key: 'knowledgeBaseId', width: 120 },
  { title: '上级行业', dataIndex: 'parentName', key: 'parentName', width: 140 },
  { title: '行业代码', dataIndex: 'industryCode', key: 'industryCode', width: 140 },
  { title: '行业标签', dataIndex: 'tags', key: 'tags', width: 180 },
  { title: '可见性', dataIndex: 'visibility', key: 'visibility', width: 90 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 230, fixed: 'right' }
]

// 行业产品表格列
const productColumns = [
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 150 },
  { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
  { title: '产品概念', dataIndex: 'productConcept', key: 'productConcept', ellipsis: true },
  { title: '生命周期', dataIndex: 'lifeCycle', key: 'lifeCycle', width: 90 },
  { title: '操作', key: 'action', width: 80 }
]

// 行业企业表格列
const enterpriseColumns = [
  { title: '企业名称', dataIndex: 'enterpriseName', key: 'enterpriseName', width: 180 },
  { title: '类型', dataIndex: 'enterpriseType', key: 'enterpriseType', width: 100 },
  { title: '规模', dataIndex: 'scale', key: 'scale', width: 90 },
  { title: '是否上市', dataIndex: 'isListed', key: 'isListed', width: 90 },
  { title: '主营业务', dataIndex: 'mainBusiness', key: 'mainBusiness', ellipsis: true },
  { title: '操作', key: 'action', width: 80 }
]

// 行业类型级联字典（sys_cascade_dict type_code=industry_type）
const industryTypeTree = ref<any[]>([])

/** 字典树 -> a-cascader 选项（name->label） */
const toCascaderOptions = (nodes: any[]): { label: string; value: any; children?: any[] }[] =>
  (nodes || []).map((n) => {
    const opt: { label: string; value: any; children?: any[] } = { label: n.name, value: n.value }
    if (n.children?.length) opt.children = toCascaderOptions(n.children)
    return opt
  })

const industryTypeOptions = computed(() => toCascaderOptions(industryTypeTree.value))

const loadIndustryTypeTree = async () => {
  try {
    const res: any = await getIndustryTypeTree()
    const data = res?.data || res
    industryTypeTree.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('加载行业类型级联字典失败', e)
    industryTypeTree.value = []
  }
}

// 知识库下拉选项
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

// 跳转到该行业关联的知识库文档列表
const viewKnowledgeBase = (record: BizIndustry) => {
  if (!record.knowledgeBaseId) return
  router.push({ path: '/knowledge/document', query: { knowledgeBaseId: String(record.knowledgeBaseId) } })
}

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

// 树展开 keys（新增子节点后需展开父级，否则子节点不显示）
const expandedRowKeys = ref<(string | number)[]>([])
const collectExpandKeys = (nodes: BizIndustry[]): (string | number)[] => {
  const keys: (string | number)[] = []
  const walk = (list: BizIndustry[]) => {
    for (const node of list) {
      if (node.children && node.children.length) {
        if (node.id != null) keys.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(nodes || [])
  return keys
}
const expandAll = (nodes: BizIndustry[]) => {
  expandedRowKeys.value = collectExpandKeys(nodes)
}
const parentOptions = computed<{ label: string; value: any }[]>(() => {
  const excludeId = editId.value
  const collect = (nodes: BizIndustry[]): { label: string; value: any }[] => {
    const opts: { label: string; value: any }[] = []
    const walk = (list: BizIndustry[], prefix: string, excluded: Set<number | undefined>) => {
      for (const node of list) {
        // 编辑时排除自身及其下级
        if (excluded.has(node.id)) continue
        opts.push({ label: prefix + (node.industryName || ''), value: node.id })
        if (node.children?.length) {
          walk(node.children, prefix + '　', excluded)
        }
      }
    }
    // 收集编辑记录自身及下级 id
    const excluded = new Set<number | undefined>()
    if (excludeId != null) {
      const gather = (list: BizIndustry[]) => {
        for (const node of list) {
          if (node.id === excludeId) {
            const collectSelf = (n: BizIndustry) => {
              excluded.add(n.id)
              n.children?.forEach(collectSelf)
            }
            collectSelf(node)
          } else if (node.children?.length) {
            gather(node.children)
          }
        }
      }
      gather(industryList.value)
    }
    walk(nodes, '', excluded)
    return opts
  }
  return collect(industryList.value)
})

// 详情弹窗上级行业选项（不做排除，仅映射 id -> 名称）
const detailOptionsMap = computed<Record<string, { label: string; value: any }[]>>(() => {
  const opts: { label: string; value: any }[] = []
  const walk = (list: BizIndustry[], prefix: string) => {
    for (const node of list) {
      opts.push({ label: prefix + (node.industryName || ''), value: node.id })
      if (node.children?.length) walk(node.children, prefix + '　')
    }
  }
  walk(industryList.value, '')
  return { parentId: opts, industryType: industryTypeOptions.value, knowledgeBaseId: kbOptions.value }
})

// 表单弹窗上级行业选项
const formOptionsMap = computed<Record<string, { label: string; value: any }[]>>(() => ({
  parentId: parentOptions.value,
  industryType: industryTypeOptions.value,
  knowledgeBaseId: kbOptions.value
}))

// 加载行业树
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getIndustryTree({
      industryName: queryParams.industryName,
      industryCode: queryParams.industryCode,
      visibility: queryParams.visibility
    } as BizIndustryQuery)
    // 响应格式: 树形数组（行业 -> 下级行业）
    const resData = res?.data || res
    industryList.value = Array.isArray(resData) ? resData : []
    expandAll(industryList.value)
  } catch (e) {
    console.error('加载行业树失败', e)
    industryList.value = []
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  loadData()
}

// 重置
const handleReset = () => {
  queryParams.industryName = undefined
  queryParams.industryCode = undefined
  queryParams.visibility = undefined
  loadData()
}

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
  industryType: '',
  industryAttr: undefined,
  visibility: 1,
  sort: 0,
  parentId: undefined,
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
  strategy: '',
  knowledgeBaseId: undefined,
})

// 表单校验规则
const rules: Record<string, any> = {
  industryName: [{ required: true, message: '请输入行业名称', trigger: 'blur' }],
  industryCode: [{ required: true, message: '请输入行业代码', trigger: 'blur' }]
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增行业'
  formData.industryName = ''
  formData.industryCode = ''
  formData.tags = ''
  formData.industryType = ''
  formData.industryAttr = undefined
  formData.visibility = 1
  formData.sort = 0
  formData.parentId = undefined
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
  formData.knowledgeBaseId = undefined
  modalVisible.value = true
}

// 新增下级
const handleAddChild = (record: BizIndustry) => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = `新增下级 - ${record.industryName || ''}`
  formData.industryName = ''
  formData.industryCode = ''
  formData.tags = ''
  formData.industryType = record.industryType || ''
  formData.industryAttr = record.industryAttr
  formData.visibility = record.visibility ?? 1
  formData.sort = 0
  formData.parentId = record.id
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
  formData.knowledgeBaseId = undefined
  modalVisible.value = true
}

// 编辑(直接回填,不调详情接口)
const handleEdit = (record: BizIndustry) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑行业'
  Object.assign(formData, {
    ...record,
    industryType: record.industryType || '',
    industryAttr: record.industryAttr,
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
    await loadData()
    // 新增子级后强制展开父级，避免新增后不显示
    if (!isEdit.value && formData.parentId != null) {
      if (!expandedRowKeys.value.includes(formData.parentId)) {
        expandedRowKeys.value = [...expandedRowKeys.value, formData.parentId]
      }
    }
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
  subDetail.visible = false
}

// 嵌套详情弹窗状态(行业详情内 产品/企业 记录的完整字段)
const subDetail = reactive({
  visible: false,
  title: '',
  sections: [] as SectionDef[],
  data: {} as Record<string, any>,
  optionsMap: {} as Record<string, { label: string; value: any }[]>
})

/** 名称数组 -> 等值下拉选项(值即名称, 直接命中映射) */
const nameOptions = (names?: string[]): { label: string; value: any }[] =>
  (names || []).map((n) => ({ label: n, value: n }))

// 打开行业详情弹窗内的产品详情
const openProductDetail = (record: any) => {
  const names = record.industryNames || []
  subDetail.visible = true
  subDetail.title = `产品详情 - ${record.productName || ''}`
  subDetail.sections = productSections
  subDetail.optionsMap = { industryIds: nameOptions(names) }
  subDetail.data = {
    ...record,
    industryIds: names.length ? names : record.industryIds,
    productIds: record.productIds || []
  }
}

// 打开行业详情弹窗内的企业详情
const openEnterpriseDetail = (record: any) => {
  const inames = record.industryNames || []
  const pnames = record.productNames || []
  subDetail.visible = true
  subDetail.title = `企业详情 - ${record.enterpriseName || ''}`
  subDetail.sections = enterpriseSections
  subDetail.optionsMap = { industryIds: nameOptions(inames), productIds: nameOptions(pnames) }
  subDetail.data = {
    ...record,
    industryIds: inames.length ? inames : record.industryIds,
    productIds: pnames.length ? pnames : record.productIds
  }
}

onMounted(() => {
  loadData()
  loadIndustryTypeTree()
  loadKnowledgeBaseOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>