<template>
  <div>
    <a-card title="行业产品" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增产品
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
        <a-form-item label="产品名称">
          <a-input v-model:value="queryParams.productName" placeholder="请输入产品名称" allow-clear style="width: 200px" />
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

      <!-- 产品列表 -->
      <a-table
        :data-source="productList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: BizIndustryProduct) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: BizIndustryProduct }">
          <template v-if="column.key === 'industryNames'">
            <template v-if="record.industryNames && record.industryNames.length">
              <a-tag v-for="name in record.industryNames" :key="name" color="blue">{{ name }}</a-tag>
            </template>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该产品吗？" @confirm="handleDelete(record)">
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
          v-for="sec in productSections"
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
import { getIndustryList, type BizIndustry, type BizIndustryProduct } from '@/api/biz/industry'
import { getProductPage, addProduct, updateProduct, deleteProduct, type BizProductQuery } from '@/api/biz/product'
import MatrixTable from '../../components/MatrixTable.vue'
import { productSections } from '../product/sections'

// 表格列定义
const columns = [
  { title: '关联行业', dataIndex: 'industryNames', key: 'industryNames', width: 180 },
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 180 },
  { title: '品类', dataIndex: 'category', key: 'category', width: 150 },
  { title: '生命周期', dataIndex: 'lifeCycle', key: 'lifeCycle', width: 120 },
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
const queryParams = reactive(<BizProductQuery>{
  industryId: undefined,
  productName: undefined
})

// 数据状态
const productList = ref<BizIndustryProduct[]>([])
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
const modalTitle = ref('新增产品')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<BizIndustryProduct>>({
  industryIds: [],
  category: '',
  productName: '',
  productConcept: '',
  consumerInsight: '',
  benefitPromise: '',
  supportPoint: '',
  coreProduct: '',
  basicProduct: '',
  additionalProduct: '',
  potentialProduct: '',
  lifeCycle: '',
  upstreamChain: '',
  midstreamChain: '',
  downstreamChannel: '',
  downstreamMarketing: '',
  dynamicInfo: '',
  valueInfo: '',
  strategy: ''
})

// 动态下拉选项(关联行业)
const optionsMap = computed<Record<string, { label: string; value: any }[]>>(() => ({
  industryIds: industryOptions.value
    .filter((item) => item.id != null)
    .map((item) => ({ label: item.industryName || '', value: item.id as number }))
}))

// 表单校验规则
const rules: Record<string, any> = {
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

// 加载产品列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getProductPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    } as BizProductQuery)
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器返回整个 body {code, msg, data},这里防御性解包
    const resData = res?.data || res
    productList.value = resData?.records || resData || []
    pagination.total = resData?.total || 0
    pagination.current = resData?.current || 1
  } catch (e) {
    console.error('加载产品列表失败', e)
    productList.value = []
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
  queryParams.productName = undefined
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
  modalTitle.value = '新增产品'
  formData.industryIds = []
  formData.category = ''
  formData.productName = ''
  formData.productConcept = ''
  formData.consumerInsight = ''
  formData.benefitPromise = ''
  formData.supportPoint = ''
  formData.coreProduct = ''
  formData.basicProduct = ''
  formData.additionalProduct = ''
  formData.potentialProduct = ''
  formData.lifeCycle = ''
  formData.upstreamChain = ''
  formData.midstreamChain = ''
  formData.downstreamChannel = ''
  formData.downstreamMarketing = ''
  formData.dynamicInfo = ''
  formData.valueInfo = ''
  formData.strategy = ''
  modalVisible.value = true
}

// 编辑
const handleEdit = (record: BizIndustryProduct) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑产品'
  Object.assign(formData, {
    ...record,
    industryIds: record.industryIds || [],
    category: record.category || '',
    productName: record.productName || '',
    productConcept: record.productConcept || '',
    consumerInsight: record.consumerInsight || '',
    benefitPromise: record.benefitPromise || '',
    supportPoint: record.supportPoint || '',
    coreProduct: record.coreProduct || '',
    basicProduct: record.basicProduct || '',
    additionalProduct: record.additionalProduct || '',
    potentialProduct: record.potentialProduct || '',
    lifeCycle: record.lifeCycle || '',
    upstreamChain: record.upstreamChain || '',
    midstreamChain: record.midstreamChain || '',
    downstreamChannel: record.downstreamChannel || '',
    downstreamMarketing: record.downstreamMarketing || '',
    dynamicInfo: record.dynamicInfo || '',
    valueInfo: record.valueInfo || '',
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
      await updateProduct({ ...formData, id: editId.value } as BizIndustryProduct)
      message.success('修改成功')
    } else {
      await addProduct(formData as BizIndustryProduct)
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
const handleDelete = async (record: BizIndustryProduct) => {
  try {
    await deleteProduct(record.id!)
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