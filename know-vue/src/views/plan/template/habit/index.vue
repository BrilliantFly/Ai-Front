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
          新增打卡模板
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
      :title="isEdit ? '编辑打卡模板' : '新增打卡模板'"
      @ok="handleSave"
      :confirm-loading="saving"
      width="700px"
    >
      <a-form :model="form" :label-col="{ span: 5 }">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="form.templateName" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="习惯名称">
          <a-input v-model:value="form.name" placeholder="请输入习惯名称" />
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
        <a-form-item label="频率类型">
          <a-select v-model:value="form.frequencyType" placeholder="请选择频率类型" allow-clear>
            <a-select-option value="daily">每天</a-select-option>
            <a-select-option value="weekly">每周</a-select-option>
            <a-select-option value="monthly">每月</a-select-option>
            <a-select-option value="custom">自定义</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="频率规则">
          <a-input v-model:value="form.frequencyRule" placeholder="如 1,3,5" />
        </a-form-item>
        <a-form-item label="提醒时间">
          <a-time-picker v-model:value="form.reminderTime" format="HH:mm" value-format="HH:mm" style="width: 100%" />
        </a-form-item>
        <a-form-item label="休息天数">
          <a-input-number v-model:value="form.restDays" :min="0" />
        </a-form-item>
        <a-form-item label="目标天数">
          <a-input-number v-model:value="form.targetDays" :min="1" :max="365" />
        </a-form-item>
        <a-form-item label="目标值">
          <a-input-number v-model:value="form.targetValue" :min="0" />
        </a-form-item>
        <a-form-item label="目标单位">
          <a-input v-model:value="form.targetUnit" placeholder="如 页/个/分钟" />
        </a-form-item>
        <a-form-item label="记录方式">
          <a-select v-model:value="form.trackingType" placeholder="请选择记录方式" allow-clear>
            <a-select-option value="checkin">打卡</a-select-option>
            <a-select-option value="value">数值</a-select-option>
            <a-select-option value="duration">时长</a-select-option>
          </a-select>
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
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { getHabitTemplateList, addHabitTemplate, updateHabitTemplate, deleteHabitTemplate } from '@/api/plan/template'

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
  { title: '习惯名称', dataIndex: 'name', key: 'name' },
  { title: '频率类型', dataIndex: 'frequencyType', key: 'frequencyType' },
  { title: '记录方式', dataIndex: 'trackingType', key: 'trackingType' },
  { title: '目标天数', dataIndex: 'targetDays', key: 'targetDays' },
  { title: '可见性', key: 'visibility' },
  { title: '排序', dataIndex: 'sort', key: 'sort' },
  { title: '使用次数', dataIndex: 'useCount', key: 'useCount' },
  { title: '操作', key: 'action' }
]

const form = reactive({
  templateName: '',
  name: '',
  description: '',
  icon: '',
  color: '',
  frequencyType: undefined,
  frequencyRule: '',
  reminderTime: undefined,
  restDays: 0,
  targetDays: 30,
  targetValue: 0,
  targetUnit: '',
  trackingType: undefined,
  planType: undefined,
  tags: '',
  visibility: 0,
  sort: 0
})

const resetForm = () => {
  form.templateName = ''
  form.name = ''
  form.description = ''
  form.icon = ''
  form.color = ''
  form.frequencyType = undefined
  form.frequencyRule = ''
  form.reminderTime = undefined
  form.restDays = 0
  form.targetDays = 30
  form.targetValue = 0
  form.targetUnit = ''
  form.trackingType = undefined
  form.planType = undefined
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
    const res = await getHabitTemplateList(buildParams())
    const page = res?.data || res || {}
    list.value = page.records || (Array.isArray(page) ? page : [])
    total.value = page.total || 0
  } catch (e) {
    console.error('获取打卡模板数据失败:', e)
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
  form.name = record.name || ''
  form.description = record.description || ''
  form.icon = record.icon || ''
  form.color = record.color || '#52C41A'
  form.frequencyType = record.frequencyType
  form.frequencyRule = record.frequencyRule || ''
  form.reminderTime = record.reminderTime
  form.restDays = record.restDays || 0
  form.targetDays = record.targetDays || 30
  form.targetValue = record.targetValue || 0
  form.targetUnit = record.targetUnit || ''
  form.trackingType = record.trackingType
  form.planType = record.planType
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
      await updateHabitTemplate({ id: editId.value, ...form })
      message.success('修改成功')
    } else {
      await addHabitTemplate(form)
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
    await deleteHabitTemplate(id)
    message.success('删除成功')
    await fetchData()
  } catch (e) {
    console.error('删除失败:', e)
  }
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