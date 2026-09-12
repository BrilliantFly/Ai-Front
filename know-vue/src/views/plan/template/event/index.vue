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
          新增日程模板
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
          <template v-if="column.key === 'isRepeat'">
            {{ record.isRepeat ? '是' : '否' }}
          </template>
          <template v-if="column.key === 'isAllDay'">
            {{ record.isAllDay ? '是' : '否' }}
          </template>
          <template v-if="column.key === 'visibility'">
            <a-tag :color="record.visibility === 1 ? 'green' : 'default'">
              {{ record.visibility === 1 ? '公开' : '私有' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'startTime'">
            {{ formatTime(record.startTime) }}
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

    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑日程模板' : '新增日程模板'"
      @ok="handleSave"
      :confirm-loading="saving"
      width="700px"
    >
      <a-form :model="form" :label-col="{ span: 5 }">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="form.templateName" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="标题">
          <a-input v-model:value="form.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="2" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="form.location" placeholder="请输入地点" />
        </a-form-item>
        <a-form-item label="内容">
          <a-textarea v-model:value="form.content" :rows="3" />
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
        <a-form-item label="事件类型">
          <a-select v-model:value="form.eventType" placeholder="请选择类型" allow-clear>
            <a-select-option value="task">任务</a-select-option>
            <a-select-option value="meeting">会议</a-select-option>
            <a-select-option value="study">学习</a-select-option>
            <a-select-option value="life">生活</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级">
          <a-input-number v-model:value="form.priority" :min="0" :max="10" />
        </a-form-item>
        <a-form-item label="是否重复">
          <a-select v-model:value="form.isRepeat">
            <a-select-option :value="0">否</a-select-option>
            <a-select-option :value="1">是</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="重复类型">
          <a-select v-model:value="form.repeatType" allow-clear placeholder="请选择重复类型">
            <a-select-option value="daily">每天</a-select-option>
            <a-select-option value="weekly">每周</a-select-option>
            <a-select-option value="monthly">每月</a-select-option>
            <a-select-option value="custom">自定义</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="重复规则">
          <a-input v-model:value="form.repeatRule" placeholder="如 1,3,5" />
        </a-form-item>
        <a-form-item label="全天">
          <a-select v-model:value="form.isAllDay">
            <a-select-option :value="0">否</a-select-option>
            <a-select-option :value="1">是</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker show-time v-model:value="form.startTime" value-format="x" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker show-time v-model:value="form.endTime" value-format="x" style="width: 100%" />
        </a-form-item>
        <a-form-item label="提前提醒">
          <a-input-number v-model:value="form.remindMinutes" :min="0" addon-after="分钟" style="width: 100%" />
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
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { getEventTemplateList, addEventTemplate, updateEventTemplate, deleteEventTemplate } from '@/api/plan/template'

const loading = ref(false)
const saving = ref(false)
const modalVisible = ref(false)
const isEdit = ref(false)
const list = ref<any[]>([])
const editId = ref<number | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const queryParams = reactive({ query: '' })

const columns = [
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '事件类型', dataIndex: 'eventType', key: 'eventType' },
  { title: '优先级', dataIndex: 'priority', key: 'priority' },
  { title: '重复', key: 'isRepeat' },
  { title: '全天', key: 'isAllDay' },
  { title: '开始时间', key: 'startTime' },
  { title: '可见性', key: 'visibility' },
  { title: '排序', dataIndex: 'sort', key: 'sort' },
  { title: '使用次数', dataIndex: 'useCount', key: 'useCount' },
  { title: '操作', key: 'action' }
]

const form = reactive({
  templateName: '',
  title: '',
  description: '',
  location: '',
  content: '',
  planType: undefined,
  eventType: undefined,
  priority: 0,
  isRepeat: 0,
  repeatType: undefined,
  repeatRule: '',
  isAllDay: 0,
  startTime: undefined,
  endTime: undefined,
  remindMinutes: 0,
  tags: '',
  visibility: 0,
  sort: 0
})

const resetForm = () => {
  form.templateName = ''
  form.title = ''
  form.description = ''
  form.location = ''
  form.content = ''
  form.planType = undefined
  form.eventType = undefined
  form.priority = 0
  form.isRepeat = 0
  form.repeatType = undefined
  form.repeatRule = ''
  form.isAllDay = 0
  form.startTime = undefined
  form.endTime = undefined
  form.remindMinutes = 0
  form.tags = ''
  form.visibility = 0
  form.sort = 0
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
    const res = await getEventTemplateList(buildParams())
    const page = res?.data || res || {}
    list.value = page.records || (Array.isArray(page) ? page : [])
    total.value = page.total || 0
  } catch (e) {
    console.error('获取日程模板数据失败:', e)
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
  form.title = record.title || ''
  form.description = record.description || ''
  form.location = record.location || ''
  form.content = record.content || ''
  form.planType = record.planType
  form.eventType = record.eventType
  form.priority = record.priority || 0
  form.isRepeat = record.isRepeat ?? 0
  form.repeatType = record.repeatType
  form.repeatRule = record.repeatRule || ''
  form.isAllDay = record.isAllDay ?? 0
  form.startTime = record.startTime
  form.endTime = record.endTime
  form.remindMinutes = record.remindMinutes || 0
  form.tags = record.tags || ''
  form.visibility = record.visibility ?? 0
  form.sort = record.sort || 0
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
      await updateEventTemplate({ id: editId.value, ...form })
      message.success('修改成功')
    } else {
      await addEventTemplate(form)
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
    await deleteEventTemplate(id)
    message.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error('删除失败:', e)
  }
}

const formatTime = (ts: any) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.plan-info-container { padding: 16px; }
.search-form { margin-bottom: 16px; }
.table-wrapper { }
.table-toolbar { margin-bottom: 16px; }
</style>