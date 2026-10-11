<template>
  <div class="plan-info-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="计划名称">
          <a-input v-model:value="queryParams.planName" placeholder="请输入计划名称" allow-clear />
        </a-form-item>
        <a-form-item label="计划类型">
          <a-cascader
            v-model:value="queryPlanTypePath"
            :options="planTypeOptions"
            placeholder="请选择类型"
            allow-clear
            show-search
            change-on-select
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="行业">
          <a-cascader
            v-model:value="queryIndustryPath"
            :options="industryOptions"
            placeholder="请选择行业"
            allow-clear
            show-search
            change-on-select
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option :value="0">待开始</a-select-option>
            <a-select-option :value="1">进行中</a-select-option>
            <a-select-option :value="2">已完成</a-select-option>
            <a-select-option :value="3">已取消</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="fetchData">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 表格区域 -->
    <a-card :bordered="false" class="table-wrapper">
      <a-space class="table-toolbar">
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增计划
        </a-button>
        <a-button @click="goToGantt">
          <template #icon><BarChartOutlined /></template>
          甘特图
        </a-button>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="plans"
        :loading="loading"
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条` }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'planType'">
            {{ resolvePlanType(record.planType) || '-' }}
          </template>
          <template v-if="column.key === 'industryId'">
            {{ resolveIndustryName(record.industryId) || '-' }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColors[record.status]">
              {{ statusLabels[record.status] || '未知' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'progress'">
            <a-progress :percent="record.progress" :size="'small'" />
          </template>
          <template v-if="column.key === 'time'">
            {{ formatTime(record.planStartTime) }} ~ {{ formatTime(record.planEndTime) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <BizFullscreenModal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑计划' : '新增计划'"
      @ok="handleSave"
      :confirm-loading="saving"
      width="600px"
    >
      <a-form :model="form" :label-col="{ span: 4 }">
        <a-form-item label="计划名称" required>
          <a-input v-model:value="form.planName" placeholder="请输入计划名称" />
        </a-form-item>
        <a-form-item label="目标效果">
          <a-textarea v-model:value="form.targetEffect" :rows="3" />
        </a-form-item>
        <a-form-item label="计划类型">
          <a-cascader
            v-model:value="formPlanTypePath"
            :options="planTypeOptions"
            placeholder="请选择类型"
            allow-clear
            show-search
            change-on-select
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="行业">
          <a-cascader
            v-model:value="formIndustryPath"
            :options="industryOptions"
            placeholder="请选择行业"
            allow-clear
            show-search
            change-on-select
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="优先级">
          <a-input-number v-model:value="form.priority" :min="0" :max="10" />
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker show-time v-model:value="form.planStartTime" value-format="x" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker show-time v-model:value="form.planEndTime" value-format="x" style="width: 100%" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </BizFullscreenModal>
  </div>
</template>

<script setup lang="ts">
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined, BarChartOutlined } from '@ant-design/icons-vue'
import { getPlanInfoPage, addPlanInfo, updatePlanInfo, deletePlanInfo } from '@/api/plan/info'
import { getPlanTypeTree } from '@/api/system/cascadeDict'
import { getIndustryTree } from '@/api/biz/industry'
import { buildCascaderOptions, resolveCascadePath, resolveCascadeValuePath } from '@/utils/cascadeDict'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const plans = ref<any[]>([])
const editId = ref<number | null>(null)

// 计划类型级联字典
const planTypeTree = ref<any[]>([])
const planTypeOptions = computed(() => buildCascaderOptions(planTypeTree.value))

const fetchPlanTypeTree = async () => {
  try {
    const res = await getPlanTypeTree()
    if (res && res.code === 1 && Array.isArray(res.data)) {
      planTypeTree.value = res.data
    }
  } catch (e) {
    console.error('获取计划类型级联字典失败:', e)
  }
}

const resolvePlanType = (val: any) => resolveCascadePath(planTypeTree.value, val)

// 所属行业级联（数据源：行业树 /api/biz/industry/tree，层级为 行业 -> 下级行业，单选）
const industryTree = ref<any[]>([])

const buildIndustryOptions = (nodes: any[]): any[] => {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n) => {
    const opt: any = { label: n.industryName, value: n.id != null ? String(n.id) : undefined }
    if (Array.isArray(n.children) && n.children.length) {
      opt.children = buildIndustryOptions(n.children)
    }
    return opt
  })
}

const industryOptions = computed(() => buildIndustryOptions(industryTree.value))

const fetchIndustryTree = async () => {
  try {
    const res: any = await getIndustryTree()
    const data = res?.data || res
    industryTree.value = Array.isArray(data) ? data : (data?.records || [])
  } catch (e) {
    console.error('获取行业树失败:', e)
  }
}

// 后端开启了大 Long 序列化为字符串（JacksonConfig），此处统一按字符串比较，避免精度/类型问题
/** 依据行业ID 解析自根到目标节点的 value（id 字符串）路径，用于级联回显 */
const resolveIndustryValuePath = (id?: number | string | null): string[] => {
  if (id === undefined || id === null || !industryTree.value.length) return []
  const target = String(id)
  const walk = (nodes: any[], path: string[]): string[] | null => {
    for (const n of nodes) {
      const next = [...path, String(n.id)]
      if (String(n.id) === target) return next
      if (Array.isArray(n.children) && n.children.length) {
        const found = walk(n.children, next)
        if (found) return found
      }
    }
    return null
  }
  return walk(industryTree.value, []) || []
}

/** 依据行业ID 解析完整名称路径（行业 -> 下级行业） */
const resolveIndustryName = (id?: number | string | null): string => {
  if (id === undefined || id === null) return ''
  const target = String(id)
  const walk = (nodes: any[], path: string[]): string[] | null => {
    for (const n of nodes) {
      const next = [...path, n.industryName]
      if (String(n.id) === target) return next
      if (Array.isArray(n.children) && n.children.length) {
        const found = walk(n.children, next)
        if (found) return found
      }
    }
    return null
  }
  return (walk(industryTree.value, []) || []).join(' / ')
}

const queryParams = reactive({ planName: '', planType: undefined, industryId: undefined, status: undefined })

const columns = [
  { title: '计划名称', dataIndex: 'planName', key: 'planName' },
  { title: '类型', dataIndex: 'planType', key: 'planType' },
  { title: '行业', dataIndex: 'industryId', key: 'industryId' },
  { title: '优先级', dataIndex: 'priority', key: 'priority' },
  { title: '进度', key: 'progress' },
  { title: '状态', key: 'status' },
  { title: '时间', key: 'time' },
  { title: '操作', key: 'action' }
]

const statusColors: Record<number, string> = { 0: 'default', 1: 'blue', 2: 'green', 3: 'red' }
const statusLabels: Record<number, string> = { 0: '待开始', 1: '进行中', 2: '已完成', 3: '已取消' }

const form = reactive({
  planName: '',
  planType: undefined,
  industryId: undefined,
  targetEffect: '',
  priority: 0,
  planStartTime: undefined,
  planEndTime: undefined,
  remark: ''
})

// a-cascader 双向代理：内部保存末位节点编码，回显时解析完整路径
const formPlanTypePath = computed({
  get: () => resolveCascadeValuePath(planTypeTree.value, form.planType),
  set: (val: any) => {
    form.planType = Array.isArray(val) && val.length ? val[val.length - 1] : undefined
  }
})

const queryPlanTypePath = computed({
  get: () => resolveCascadeValuePath(planTypeTree.value, queryParams.planType),
  set: (val: any) => {
    queryParams.planType = Array.isArray(val) && val.length ? val[val.length - 1] : undefined
  }
})

// 行业 a-cascader 双向代理：内部保存末位节点 id，回显时解析完整路径
const formIndustryPath = computed({
  get: () => resolveIndustryValuePath(form.industryId),
  set: (val: any) => {
    form.industryId = Array.isArray(val) && val.length ? val[val.length - 1] : undefined
  }
})

const queryIndustryPath = computed({
  get: () => resolveIndustryValuePath(queryParams.industryId),
  set: (val: any) => {
    queryParams.industryId = Array.isArray(val) && val.length ? val[val.length - 1] : undefined
  }
})

const resetForm = () => {
  form.planName = ''
  form.planType = undefined
  form.industryId = undefined
  form.targetEffect = ''
  form.priority = 0
  form.planStartTime = undefined
  form.planEndTime = undefined
  form.remark = ''
  editId.value = null
}

const buildParams = () => {
  const params: any = {}
  if (queryParams.planName) params.planName = queryParams.planName
  if (queryParams.planType) params.planType = queryParams.planType
  if (queryParams.industryId) params.industryId = queryParams.industryId
  if (queryParams.status !== undefined && queryParams.status !== null && queryParams.status !== '') params.status = queryParams.status
  return params
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPlanInfoPage(buildParams())
    const page = res?.data || res || {}
    plans.value = (page.records || (Array.isArray(page) ? page : [])).map((item: any) => ({
      ...item,
      planName: item.planName || item.title || ''
    }))
  } catch (e) {
    console.error('获取计划数据失败:', e)
    plans.value = []
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.planName = ''
  queryParams.planType = undefined
  queryParams.industryId = undefined
  queryParams.status = undefined
  fetchData()
}

const goToGantt = () => {
  router.push('/plan/gantt')
}

const showAddModal = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  editId.value = record.id
  form.planName = record.planName || record.title
  form.planType = record.planType
  form.industryId = record.industryId
  form.targetEffect = record.targetEffect || ''
  form.priority = record.priority || 0
  form.planStartTime = record.planStartTime
  form.planEndTime = record.planEndTime
  form.remark = record.remark || ''
  modalVisible.value = true
}

const handleSave = async () => {
  if (!form.planName) {
    message.warning('请输入计划名称')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await updatePlanInfo({ id: editId.value, ...form })
    } else {
      await addPlanInfo(form)
    }
    message.success(isEdit.value ? '修改成功' : '新增成功')
    modalVisible.value = false
    await fetchData()
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await deletePlanInfo(id)
    message.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error('删除失败:', e)
  }
}

const formatTime = (ts: number) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  fetchData()
  fetchPlanTypeTree()
  fetchIndustryTree()
})
</script>

<style scoped>
.plan-info-container { padding: 16px; }
.search-form { margin-bottom: 16px; }
.table-wrapper { }
.table-toolbar { margin-bottom: 16px; }
</style>
