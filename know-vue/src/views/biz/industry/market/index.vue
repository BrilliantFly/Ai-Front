<template>
  <div>
    <a-card title="行业市场" :bordered="false">
      <a-form layout="inline" class="mb-4">
        <a-form-item label="选择行业">
          <a-select
            v-model:value="selectedIndustryId"
            placeholder="请选择行业"
            allow-clear
            style="width: 240px"
            :loading="loading"
            @change="handleIndustryChange"
          >
            <a-select-option v-for="item in industryOptions" :key="item.id" :value="item.id">
              {{ item.industryName }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

      <template v-if="selectedIndustryId">
        <!-- 关联市场列表(M:N) -->
        <a-table
          v-if="marketList.length > 0"
          :columns="marketColumns"
          :data-source="marketList"
          row-key="id"
          size="small"
          :pagination="false"
          class="mb-4"
        >
          <template #bodyCell="{ column, record }: { column: any; record: BizIndustryMarket }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a @click="handleEditMarket(record)">编辑</a>
              </a-space>
            </template>
          </template>
        </a-table>

        <a-space class="mb-4">
          <a-button type="dashed" @click="handleAddMarket">新增市场</a-button>
        </a-space>

        <a-form :label-col="{ style: { width: '120px' } }" :model="formData" layout="horizontal">
          <a-row :gutter="16">
            <a-col :span="24">
              <template v-for="(field, index) in marketFields" :key="field.key">
                <a-row v-if="index % 2 === 0" :gutter="16">
                  <a-col :span="12">
                    <a-form-item :label="field.label">
                      <a-textarea v-model:value="formData[field.key]" :placeholder="`请输入${field.label}`" :auto-size="{ minRows: 3, maxRows: 6 }" />
                    </a-form-item>
                  </a-col>
                  <a-col v-if="marketFields[index + 1]" :span="12">
                    <a-form-item :label="marketFields[index + 1].label">
                      <a-textarea v-model:value="formData[marketFields[index + 1].key]" :placeholder="`请输入${marketFields[index + 1].label}`" :auto-size="{ minRows: 3, maxRows: 6 }" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </template>
            </a-col>
          </a-row>
        </a-form>
        <a-form-item>
          <a-button type="primary" :loading="saving" @click="handleSave">
            <template #icon><save-outlined /></template>
            保存
          </a-button>
        </a-form-item>
      </template>

      <a-empty v-else description="请先选择行业" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SaveOutlined } from '@ant-design/icons-vue'
import { getIndustryList, type BizIndustry } from '@/api/biz/industry'
import { getMarketsByIndustryId, saveMarket, type BizIndustryMarket } from '@/api/biz/market'

interface MarketField {
  key: keyof BizIndustryMarket
  label: string
}

// 市场列表列
const marketColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 140 },
  { title: '市场需求', dataIndex: 'demand', key: 'demand' },
  { title: '市场机会', dataIndex: 'opportunity', key: 'opportunity' },
  { title: '操作', key: 'action', width: 80 }
]

// 市场字段配置
const marketFields: MarketField[] = [
  { key: 'demand', label: '市场需求' },
  { key: 'opportunity', label: '市场机会' },
  { key: 'valueProposition', label: '价值主张' },
  { key: 'customerSegment', label: '客户细分' },
  { key: 'channel', label: '渠道' },
  { key: 'customerRelation', label: '客户关系' },
  { key: 'revenueSource', label: '收入来源' },
  { key: 'keyResource', label: '核心资源' },
  { key: 'keyPartner', label: '关键伙伴' },
  { key: 'keyActivity', label: '关键活动' },
  { key: 'costStructure', label: '成本结构' },
  { key: 'valueEvaluation', label: '价值评估' },
  { key: 'valueDistribution', label: '价值分配' },
  { key: 'competitionMethod', label: '竞争方式' },
  { key: 'promoChannel', label: '推广渠道' }
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

// 选中行业
const selectedIndustryId = ref<number | undefined>(undefined)
const loading = ref(false)
const saving = ref(false)
// 当前行业关联市场列表
const marketList = ref<BizIndustryMarket[]>([])
// 当前正在编辑的市场(id 为空表示新增)
const editingMarketId = ref<number | undefined>(undefined)

// 表格列定义
const formData = reactive<Partial<BizIndustryMarket>>({
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
  promoChannel: ''
})

// 表单数据
const formData = reactive<Partial<BizIndustryMarket>>({
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
  promoChannel: ''
})

// 清空表单
const resetForm = () => {
  Object.assign(formData, {
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
    promoChannel: ''
  })
}

// 切换行业时加载市场信息列表
const handleIndustryChange = async (val?: number) => {
  resetForm()
  editingMarketId.value = undefined
  marketList.value = []
  if (!val) {
    return
  }
  loading.value = true
  try {
    const res: any = await getMarketsByIndustryId(val)
    const resData = res?.data || res
    if (Array.isArray(resData)) {
      marketList.value = resData
      // 默认编辑第一个市场
      if (resData.length > 0) {
        applyMarket(resData[0])
      }
    }
  } catch (e) {
    console.error('加载市场信息失败', e)
  } finally {
    loading.value = false
  }
}

// 应用到表单
const applyMarket = (market: BizIndustryMarket) => {
  editingMarketId.value = market.id
  Object.assign(formData, {
    demand: market.demand || '',
    opportunity: market.opportunity || '',
    valueProposition: market.valueProposition || '',
    customerSegment: market.customerSegment || '',
    channel: market.channel || '',
    customerRelation: market.customerRelation || '',
    revenueSource: market.revenueSource || '',
    keyResource: market.keyResource || '',
    keyPartner: market.keyPartner || '',
    keyActivity: market.keyActivity || '',
    costStructure: market.costStructure || '',
    valueEvaluation: market.valueEvaluation || '',
    valueDistribution: market.valueDistribution || '',
    competitionMethod: market.competitionMethod || '',
    promoChannel: market.promoChannel || ''
  })
}

// 新增市场
const handleAddMarket = () => {
  resetForm()
  editingMarketId.value = undefined
}

// 编辑市场
const handleEditMarket = (market: BizIndustryMarket) => {
  applyMarket(market)
}

// 保存
const handleSave = async () => {
  if (!selectedIndustryId.value) {
    message.warning('请先选择行业')
    return
  }
  saving.value = true
  try {
    if (editingMarketId.value) {
      await saveMarket(selectedIndustryId.value, { ...formData, id: editingMarketId.value, industryIds: [selectedIndustryId.value] } as BizIndustryMarket)
    } else {
      await saveMarket(selectedIndustryId.value, { ...formData, industryIds: [selectedIndustryId.value] } as BizIndustryMarket)
    }
    message.success('保存成功')
    handleIndustryChange(selectedIndustryId.value)
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadIndustryOptions()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>