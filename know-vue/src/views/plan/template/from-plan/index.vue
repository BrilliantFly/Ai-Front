<template>
  <div class="plan-from-plan-container">
    <a-page-header title="从计划生成模板" @back="router.back()" />

    <a-card title="选择计划" :bordered="false" class="section-card">
      <a-select
        v-model:value="selectedPlanId"
        placeholder="请选择计划"
        style="width: 100%"
        :loading="planListLoading"
        allow-clear
      >
        <a-select-option v-for="item in planList" :key="item.id" :value="item.id">
          {{ item.planName || item.name }}
        </a-select-option>
      </a-select>
    </a-card>

    <a-card title="模板配置" :bordered="false" class="section-card">
      <a-form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="form.templateName" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="请输入模板描述" />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="form.visibility">
            <a-select-option :value="0">私有</a-select-option>
            <a-select-option :value="1">公开</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="submit-section">
      <a-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
        生成模板
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getPlanList, generateFromPlan } from '@/api/plan/template'

const router = useRouter()

const planListLoading = ref(false)
const submitting = ref(false)

const planList = ref<any[]>([])
const selectedPlanId = ref<number | null>(null)

const form = reactive({
  templateName: '',
  description: '',
  visibility: 0
})

const loadPlanList = async () => {
  planListLoading.value = true
  try {
    const res = await getPlanList()
    const page = res?.data || res || {}
    planList.value = page.records || (Array.isArray(page) ? page : [])
  } catch (e) {
    console.error('获取计划列表失败:', e)
  } finally {
    planListLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!selectedPlanId.value) {
    message.warning('请选择计划')
    return
  }
  if (!form.templateName) {
    message.warning('请输入模板名称')
    return
  }

  submitting.value = true
  try {
    await generateFromPlan(selectedPlanId.value, {
      templateName: form.templateName,
      description: form.description,
      visibility: form.visibility
    })
    message.success('生成模板成功')
    router.push('/plan/template/info')
  } catch (e) {
    console.error('生成模板失败:', e)
    message.error('生成模板失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadPlanList()
})
</script>

<style scoped>
.plan-from-plan-container { padding: 16px; }
.section-card { margin-bottom: 16px; }
.submit-section { text-align: center; padding: 24px 0; }
</style>
