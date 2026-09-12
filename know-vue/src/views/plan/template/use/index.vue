<template>
  <div class="plan-use-template-container">
    <a-page-header title="使用模板创建计划" @back="router.back()" />

    <a-card title="选择模板" :bordered="false" class="section-card">
      <a-select
        v-model:value="selectedTemplateId"
        placeholder="请选择模板"
        style="width: 100%"
        :loading="templateListLoading"
        @change="handleTemplateChange"
        allow-clear
      >
        <a-select-option v-for="item in templateList" :key="item.id" :value="item.id">
          {{ item.templateName }}
        </a-select-option>
      </a-select>
    </a-card>

    <a-card v-if="templateDetail" title="模板信息" :bordered="false" class="section-card">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="模板名称">{{ templateDetail.templateName }}</a-descriptions-item>
        <a-descriptions-item label="计划类型">{{ templateDetail.planType }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ templateDetail.description || '无' }}</a-descriptions-item>
        <a-descriptions-item label="默认天数">{{ templateDetail.defaultDurationDays }}</a-descriptions-item>
        <a-descriptions-item label="默认优先级">{{ templateDetail.defaultPriority }}</a-descriptions-item>
        <a-descriptions-item label="习惯数">{{ habits.length }}</a-descriptions-item>
        <a-descriptions-item label="日程数">{{ events.length }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card v-if="templateDetail" title="计划配置" :bordered="false" class="section-card">
      <a-form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="计划名称" required>
          <a-input v-model:value="form.planName" placeholder="请输入计划名称" />
        </a-form-item>
        <a-form-item label="开始日期" required>
          <a-date-picker v-model:value="form.startDate" style="width: 100%" format="YYYY-MM-DD" value-format="X" />
        </a-form-item>
        <a-form-item label="执行状态">
          <a-select v-model:value="form.execStatus">
            <a-select-option :value="0">未开始</a-select-option>
            <a-select-option :value="1">执行中</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card v-if="habits.length > 0 || events.length > 0" title="模板内容预览" :bordered="false" class="section-card">
      <div v-if="habits.length > 0" class="content-section">
        <h4>习惯列表</h4>
        <a-checkbox-group v-model:value="selectedHabits" class="content-checkbox-group">
          <div v-for="(habit, index) in habits" :key="index" class="content-item">
            <a-checkbox :value="index">
              <span>{{ habit.icon || '' }} {{ habit.habitName || habit.name }}</span>
              <a-tag color="blue" style="margin-left: 8px">{{ habit.frequency || '每天' }}</a-tag>
              <a-tag v-if="habit.remindTime" color="green" style="margin-left: 4px">{{ habit.remindTime }}</a-tag>
            </a-checkbox>
          </div>
        </a-checkbox-group>
      </div>

      <a-divider v-if="habits.length > 0 && events.length > 0" />

      <div v-if="events.length > 0" class="content-section">
        <h4>日程列表</h4>
        <a-checkbox-group v-model:value="selectedEvents" class="content-checkbox-group">
          <div v-for="(event, index) in events" :key="index" class="content-item">
            <a-checkbox :value="index">
              <span>{{ event.eventName || event.name }}</span>
              <a-tag v-if="event.dayOffset !== undefined" color="orange" style="margin-left: 8px">第{{ event.dayOffset + 1 }}天</a-tag>
            </a-checkbox>
          </div>
        </a-checkbox-group>
      </div>
    </a-card>

    <div v-if="templateDetail" class="submit-section">
      <a-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
        确认创建计划
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getTemplateList, getTemplateDetail, useTemplateApi } from '@/api/plan/template'

const router = useRouter()

const templateListLoading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)

const templateList = ref<any[]>([])
const selectedTemplateId = ref<number | null>(null)
const templateDetail = ref<any>(null)
const habits = ref<any[]>([])
const events = ref<any[]>([])
const selectedHabits = ref<number[]>([])
const selectedEvents = ref<number[]>([])

const form = reactive({
  planName: '',
  startDate: undefined as any,
  execStatus: 0
})

const loadTemplateList = async () => {
  templateListLoading.value = true
  try {
    const res = await getTemplateList({ pageNum: 1, pageSize: 200 })
    const page = res?.data || res || {}
    templateList.value = page.records || (Array.isArray(page) ? page : [])
  } catch (e) {
    console.error('获取模板列表失败:', e)
  } finally {
    templateListLoading.value = false
  }
}

const parseJsonSafe = (val: any): any[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const handleTemplateChange = async (id: number) => {
  if (!id) {
    templateDetail.value = null
    habits.value = []
    events.value = []
    return
  }
  detailLoading.value = true
  try {
    const res = await getTemplateDetail(id)
    const detail = res?.data || res || {}
    templateDetail.value = detail
    habits.value = parseJsonSafe(detail.defaultHabits)
    events.value = parseJsonSafe(detail.defaultEvents)
    selectedHabits.value = habits.value.map((_: any, i: number) => i)
    selectedEvents.value = events.value.map((_: any, i: number) => i)
    form.planName = detail.templateName || ''
  } catch (e) {
    console.error('获取模板详情失败:', e)
    message.error('获取模板详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!selectedTemplateId.value) {
    message.warning('请选择模板')
    return
  }
  if (!form.planName) {
    message.warning('请输入计划名称')
    return
  }
  if (!form.startDate) {
    message.warning('请选择开始日期')
    return
  }

  const allHabitIndices = habits.value.map((_: any, i: number) => i)
  const allEventIndices = events.value.map((_: any, i: number) => i)
  const skipHabits = allHabitIndices.filter(i => !selectedHabits.value.includes(i))
  const skipEvents = allEventIndices.filter(i => !selectedEvents.value.includes(i))

  submitting.value = true
  try {
    await useTemplateApi(selectedTemplateId.value, {
      planName: form.planName,
      startDate: form.startDate,
      execStatus: form.execStatus,
      customizations: { skipHabits, skipEvents }
    })
    message.success('创建计划成功')
    router.back()
  } catch (e) {
    console.error('创建计划失败:', e)
    message.error('创建计划失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTemplateList()
})
</script>

<style scoped>
.plan-use-template-container { padding: 16px; }
.section-card { margin-bottom: 16px; }
.content-section h4 { margin-bottom: 12px; font-weight: 600; }
.content-checkbox-group { display: flex; flex-direction: column; gap: 8px; }
.content-item { padding: 8px 12px; background: #fafafa; border-radius: 6px; }
.submit-section { text-align: center; padding: 24px 0; }
</style>
