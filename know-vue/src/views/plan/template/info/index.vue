<template>
  <div class="plan-info-container">
    <a-card :bordered="false" class="search-form">
      <a-form layout="inline">
        <a-form-item label="模板名称">
          <a-input v-model:value="queryParams.query" placeholder="请输入模板名称" allow-clear @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
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

    <a-card :bordered="false" class="table-wrapper">
      <a-space class="table-toolbar">
        <a-button type="primary" @click="showAddModal">
          <template #icon><PlusOutlined /></template>
          新增计划模板
        </a-button>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="{ current: pageNum, pageSize: pageSize, total: total, showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: false }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'visibility'">
            <a-tag :color="record.visibility === 1 ? 'green' : 'default'">
              {{ record.visibility === 1 ? '公开' : '私有' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showDetailModal(record)">预览</a-button>
              <a-button type="link" size="small" @click="showAddChildModal(record)">
                <PlusOutlined /> 下一级
              </a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除?" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑计划模板' : '新增计划模板'"
      @ok="handleSave"
      :confirm-loading="saving"
      width="700px"
    >
      <a-form :model="form" :label-col="{ span: 5 }">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="form.templateName" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="2" />
        </a-form-item>
        <a-form-item label="图标">
          <a-input v-model:value="form.icon" placeholder="请输入图标" />
        </a-form-item>
        <a-form-item label="颜色">
          <a-input v-model:value="form.color" type="color" style="width: 60px" />
        </a-form-item>
        <a-form-item label="计划类型">
          <a-select v-model:value="form.planType" placeholder="请选择类型" allow-clear>
            <a-select-option value="life">生活习惯</a-select-option>
            <a-select-option value="cognition">认知提升</a-select-option>
            <a-select-option value="skill">工作技能</a-select-option>
            <a-select-option value="project">项目</a-select-option>
            <a-select-option value="hobby">兴趣爱好</a-select-option>
            <a-select-option value="study">学习</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="标签">
          <a-input v-model:value="form.tags" placeholder="多个标签用逗号分隔" />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="form.visibility">
            <a-select-option :value="0">私有</a-select-option>
            <a-select-option :value="1">公开</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="form.sort" :min="0" />
        </a-form-item>
        <a-form-item label="默认优先级">
          <a-input-number v-model:value="form.defaultPriority" :min="0" :max="10" />
        </a-form-item>
        <a-form-item label="默认天数">
          <a-input-number v-model:value="form.defaultDurationDays" :min="1" />
        </a-form-item>
        <a-form-item label="默认提醒">
          <a-input v-model:value="form.defaultRemindTime" placeholder="如 08:00" />
        </a-form-item>
        <a-form-item label="内联习惯定义">
          <a-textarea v-model:value="form.defaultHabits" :rows="3" placeholder='[{"name":"晨跑","icon":"🏃",...}]' />
        </a-form-item>
        <a-form-item label="内联日程定义">
          <a-textarea v-model:value="form.defaultEvents" :rows="3" placeholder='[{"title":"制定计划","eventType":1,...}]' />
        </a-form-item>
        <a-form-item label="父模板">
          <a-select v-model:value="form.parentId" placeholder="无（顶级模板）" allowClear>
            <a-select-option v-for="item in parentTemplateOptions" :key="item.id" :value="item.id">
              {{ item.templateName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关联习惯模板">
          <a-select v-model:value="form.defaultHabitIds" mode="multiple" placeholder="选择习惯模板" allowClear
            :options="habitTemplateOptions" :fieldNames="{ label: 'templateName', value: 'id' }" />
        </a-form-item>
        <a-form-item label="关联日程模板">
          <a-select v-model:value="form.defaultEventIds" mode="multiple" placeholder="选择日程模板" allowClear
            :options="eventTemplateOptions" :fieldNames="{ label: 'templateName', value: 'id' }" />
        </a-form-item>
        <a-form-item label="子计划树(JSON)">
          <a-textarea v-model:value="form.defaultSubPlans" :rows="4" placeholder='[{"plan_name":"阶段一",...}]' />
        </a-form-item>
        <a-form-item label="使用次数">
          <a-input-number v-model:value="form.useCount" :disabled="true" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="detailModalVisible" title="模板详情预览" width="800px" :footer="null">
      <a-spin :spinning="detailLoading">
        <template v-if="detailInfo">
          <a-descriptions :column="2" size="small" bordered>
            <a-descriptions-item label="模板名称">
              <span>{{ detailInfo.icon }} {{ detailInfo.templateName }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="父模板">
              {{ parentName(detailInfo) }}
            </a-descriptions-item>
            <a-descriptions-item label="计划类型">{{ detailInfo.planType }}</a-descriptions-item>
            <a-descriptions-item label="标签">{{ detailInfo.tags }}</a-descriptions-item>
            <a-descriptions-item label="默认优先级">{{ detailInfo.defaultPriority }}</a-descriptions-item>
            <a-descriptions-item label="可见性">
              <a-tag :color="detailInfo.visibility === 1 ? 'green' : 'default'">
                {{ detailInfo.visibility === 1 ? '公开' : '私有' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="描述" :span="2">{{ detailInfo.description }}</a-descriptions-item>
          </a-descriptions>

          <a-divider orientation="left">模板层级（WBS）</a-divider>
          <a-tree v-if="detailTreeData.length" :tree-data="detailTreeData" :default-expand-all="true"
            :fieldNames="{ title: 'templateName', key: 'id' }" />
          <a-empty v-else description="暂无子模板" />

          <a-divider orientation="left">关联习惯模板</a-divider>
          <template v-if="linkedHabits.length">
            <a-tag v-for="(name, index) in linkedHabits" :key="index" color="green">{{ name }}</a-tag>
          </template>
          <a-empty v-else description="未关联习惯模板" />

          <a-divider orientation="left">关联日程模板</a-divider>
          <template v-if="linkedEvents.length">
            <a-tag v-for="(name, index) in linkedEvents" :key="index" color="blue">{{ name }}</a-tag>
          </template>
          <a-empty v-else description="未关联日程模板" />

          <a-divider orientation="left">子计划树</a-divider>
          <a-tree v-if="subPlanTreeData.length" :tree-data="subPlanTreeData" :default-expand-all="true" />
          <a-empty v-else description="无子计划" />
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import {
  getTemplateList,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
  getTemplateTree,
  getHabitTemplateListAll,
  getEventTemplateListAll
} from '@/api/plan/template'

const loading = ref(false)
const saving = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const list = ref<any[]>([])
const editId = ref<number | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const parentTemplateOptions = ref<any[]>([])
const habitTemplateOptions = ref<any[]>([])
const eventTemplateOptions = ref<any[]>([])
const detailModalVisible = ref(false)
const detailLoading = ref(false)
const detailInfo = ref<any>(null)
const detailTreeData = ref<any[]>([])

const queryParams = reactive({ query: '' })

const columns = [
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName' },
  { title: '计划类型', dataIndex: 'planType', key: 'planType' },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '默认优先级', dataIndex: 'defaultPriority', key: 'defaultPriority' },
  { title: '可见性', key: 'visibility' },
  { title: '排序', dataIndex: 'sort', key: 'sort' },
  { title: '使用次数', dataIndex: 'useCount', key: 'useCount' },
  { title: '操作', key: 'action' }
]

const form = reactive({
  templateName: '',
  description: '',
  icon: '',
  color: '',
  planType: undefined,
  tags: '',
  visibility: 0,
  sort: 0,
  defaultPriority: 0,
  defaultDurationDays: 30,
  defaultRemindTime: '',
  defaultHabits: '',
  defaultEvents: '',
  parentId: null as number | null,
  defaultHabitIds: [] as number[],
  defaultEventIds: [] as number[],
  defaultSubPlans: '',
  useCount: 0
})

const resetForm = () => {
  form.templateName = ''
  form.description = ''
  form.icon = ''
  form.color = ''
  form.planType = undefined
  form.tags = ''
  form.visibility = 0
  form.sort = 0
  form.defaultPriority = 0
  form.defaultDurationDays = 30
  form.defaultRemindTime = ''
  form.defaultHabits = ''
  form.defaultEvents = ''
  form.parentId = null
  form.defaultHabitIds = []
  form.defaultEventIds = []
  form.defaultSubPlans = ''
  form.useCount = 0
  editId.value = null
}

const buildParams = () => {
  const params: any = { pageNum: pageNum.value, pageSize: pageSize.value }
  if (queryParams.query) params.query = queryParams.query
  return params
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getTemplateList(buildParams())
    const page = res?.data || res || {}
    list.value = page.records || (Array.isArray(page) ? page : [])
    total.value = page.total || 0
  } catch (e) {
    console.error('获取计划模板数据失败:', e)
    list.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const handleReset = () => {
  queryParams.query = ''
  pageNum.value = 1
  fetchData()
}

const handleTableChange = (pag: any) => {
  pageNum.value = pag.current
  fetchData()
}

const showAddModal = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  editId.value = record.id
  form.templateName = record.templateName || ''
  form.description = record.description || ''
  form.icon = record.icon || ''
  form.color = record.color || '#52C41A'
  form.planType = record.planType
  form.tags = record.tags || ''
  form.visibility = record.visibility ?? 0
  form.sort = record.sort || 0
  form.defaultPriority = record.defaultPriority || 0
  form.defaultDurationDays = record.defaultDurationDays || 30
  form.defaultRemindTime = record.defaultRemindTime || ''
  form.defaultHabits = record.defaultHabits || ''
  form.defaultEvents = record.defaultEvents || ''
  form.parentId = record.parentId || null
  form.defaultHabitIds = parseIdList(record.defaultHabitIds)
  form.defaultEventIds = parseIdList(record.defaultEventIds)
  form.defaultSubPlans = record.defaultSubPlans || ''
  form.useCount = record.useCount || 0
  modalVisible.value = true
}

const handleSave = async () => {
  if (!form.templateName) {
    message.warning('请输入模板名称')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateTemplate({ id: editId.value, ...form })
      message.success('修改成功')
    } else {
      await addTemplate(form)
      message.success('新增成功')
    }
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
    await deleteTemplate(id)
    message.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error('删除失败:', e)
  }
}

const parseIdList = (val: any): number[] => {
  if (Array.isArray(val)) {
    return val.map(Number).filter((n: any) => !isNaN(n))
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed.map(Number).filter((n: any) => !isNaN(n)) : []
    } catch {
      return []
    }
  }
  return []
}

const parseJsonList = (val: any): any[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const loadParentOptions = async () => {
  try {
    const res = await getAllTemplates({})
    const page = res?.data || res || {}
    parentTemplateOptions.value = page.records || (Array.isArray(page) ? page : [])
  } catch (e) {
    console.error('获取模板下拉数据失败:', e)
  }
}

const loadHabitOptions = async () => {
  try {
    const res = await getHabitTemplateListAll({})
    const page = res?.data || res || {}
    habitTemplateOptions.value = page.records || (Array.isArray(page) ? page : [])
  } catch (e) {
    console.error('获取习惯模板下拉数据失败:', e)
  }
}

const loadEventOptions = async () => {
  try {
    const res = await getEventTemplateListAll({})
    const page = res?.data || res || {}
    eventTemplateOptions.value = page.records || (Array.isArray(page) ? page : [])
  } catch (e) {
    console.error('获取日程模板下拉数据失败:', e)
  }
}

const showAddChildModal = (parentRecord: any) => {
  isEdit.value = false
  resetForm()
  form.parentId = parentRecord.id
  modalVisible.value = true
}

const parentName = (record: any) => {
  if (!record?.parentId) return '无（顶级模板）'
  const found = parentTemplateOptions.value.find(o => o.id === record.parentId)
  return found ? found.templateName : String(record.parentId)
}

const linkedHabits = computed(() => {
  const names: string[] = []
  const picked = parseIdList(detailInfo.value?.defaultHabitIds)
  if (picked.length) {
    habitTemplateOptions.value.forEach(o => {
      if (picked.includes(o.id)) names.push(o.templateName)
    })
  }
  parseJsonList(detailInfo.value?.defaultHabits).forEach((h: any, idx: number) => {
    names.push(h.name || h.title || h.habit_name || `习惯${idx + 1}`)
  })
  return names
})

const linkedEvents = computed(() => {
  const names: string[] = []
  const picked = parseIdList(detailInfo.value?.defaultEventIds)
  if (picked.length) {
    eventTemplateOptions.value.forEach(o => {
      if (picked.includes(o.id)) names.push(o.templateName)
    })
  }
  parseJsonList(detailInfo.value?.defaultEvents).forEach((e: any, idx: number) => {
    names.push(e.title || e.name || e.eventTitle || `日程${idx + 1}`)
  })
  return names
})

const pickChildren = (node: any): any[] => {
  if (Array.isArray(node.children) && node.children.length) return node.children
  if (Array.isArray(node.sub_plans) && node.sub_plans.length) return node.sub_plans
  if (Array.isArray(node.subPlans) && node.subPlans.length) return node.subPlans
  if (Array.isArray(node.items) && node.items.length) return node.items
  return []
}

const toSubPlanTree = (nodes: any[]): any[] => {
  return (nodes || []).map(n => {
    const kids = pickChildren(n)
    let title = n.plan_name || n.planName || n.title || n.name || '未命名'
    const days = n.duration_days || n.durationDays
    if (days) title += `（${days}天）`
    const node: any = { title }
    if (kids.length) node.children = toSubPlanTree(kids)
    return node
  })
}

const subPlanTreeData = computed(() => toSubPlanTree(parseJsonList(detailInfo.value?.defaultSubPlans)))

const showDetailModal = async (record: any) => {
  detailInfo.value = record
  detailTreeData.value = []
  detailModalVisible.value = true
  detailLoading.value = true
  try {
    const res = await getTemplateTree(record.id)
    const data = res?.data || res || []
    if (Array.isArray(data)) {
      detailTreeData.value = data
    } else {
      detailTreeData.value = data.children || data.list || data.treeList || []
    }
  } catch (e) {
    console.error('获取模板详情失败:', e)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  loadParentOptions()
  loadHabitOptions()
  loadEventOptions()
})
</script>

<style scoped>
.plan-info-container { padding: 16px; }
.search-form { margin-bottom: 16px; }
.table-wrapper { }
.table-toolbar { margin-bottom: 16px; }
</style>