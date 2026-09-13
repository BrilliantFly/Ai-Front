<template>
  <!-- 详情模式: 静态 label + 值 -->
  <div v-if="mode === 'detail'" class="biz-field-item">
    <span class="biz-field-label">{{ field.label }}</span>
    <span class="biz-field-value">{{ displayValue }}</span>
  </div>

  <!-- 表单模式: label + 控件 -->
  <a-form-item v-else :label="field.label" :name="field.key" class="biz-field-item">
    <a-input
      v-if="!field.type || field.type === 'input'"
      v-model:value="value"
      :placeholder="field.placeholder || `请输入${field.label}`"
      allow-clear
    />
    <a-textarea
      v-else-if="field.type === 'textarea'"
      v-model:value="value"
      :placeholder="field.placeholder || `请输入${field.label}`"
      :auto-size="{ minRows: 2, maxRows: 6 }"
    />
    <a-select
      v-else-if="field.type === 'select'"
      v-model:value="value"
      :options="options"
      :placeholder="field.placeholder || `请选择${field.label}`"
      allow-clear
      style="width: 220px"
    />
    <a-select
      v-else-if="field.type === 'selectMultiple'"
      v-model:value="value"
      :options="options"
      :placeholder="field.placeholder || `请选择${field.label}(可多选)`"
      mode="multiple"
      allow-clear
      style="width: 220px"
    />
    <a-input-number
      v-else-if="field.type === 'number'"
      v-model:value="value"
      :placeholder="field.placeholder || `请输入${field.label}`"
      style="width: 220px"
    />
  </a-form-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FieldDef } from './types'

const props = withDefaults(
  defineProps<{
    field: FieldDef
    model: Record<string, any>
    mode?: 'form' | 'detail'
    options?: { label: string; value: any }[]
  }>(),
  { mode: 'form', options: undefined }
)

/** 按点路径取值: company.name / profile.dynamicInfo */
const resolvePath = (obj: Record<string, any>, key: string): any => {
  if (!key) return undefined
  const parts = key.split('.')
  let cur: any = obj
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

const setPath = (obj: Record<string, any>, key: string, val: any) => {
  if (!key) return
  const parts = key.split('.')
  let cur: any = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] == null || typeof cur[p] !== 'object') {
      // 兼容 antd form 对深层对象初始化的容错
      cur[p] = {}
    }
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = val
}

const value = computed({
  get: () => resolvePath(props.model, props.field.key),
  set: (v) => setPath(props.model, props.field.key, v)
})

const displayValue = computed(() => {
  const raw = resolvePath(props.model, props.field.key)
  if (raw == null || raw === '') return '-'
  // select 类型: 映射为选项 label
  if (props.field.type === 'select' && props.options?.length && props.field.key) {
    const matched = props.options.find((o) => o.value === raw)
    if (matched) return matched.label
  }
  if (Array.isArray(raw)) {
    if (!raw.length) return '-'
    // 多选: 尝试映射 label
    if (props.options?.length) {
      return raw
        .map((v) => props.options!.find((o) => o.value === v)?.label ?? v)
        .join('、')
    }
    return raw.join('、')
  }
  // 数字格式化
  if (typeof raw === 'number') {
    return String(Math.round(raw * 100) / 100)
  }
  return String(raw)
})
</script>

<style scoped>
.biz-field-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.biz-field-label {
  flex-shrink: 0;
  width: 120px;
  text-align: right;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  line-height: 22px;
}

.biz-field-value {
  flex: 1;
  text-align: center;
  color: rgba(0, 0, 0, 0.88);
  font-size: 13px;
  line-height: 22px;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>