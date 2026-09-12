<template>
  <div class="biz-section-card">
    <div class="biz-section-card-header" @click="open = !open">
      <caret-right-outlined class="biz-arrow" :class="{ rotated: open }" />
      <span class="biz-section-card-title">{{ section.title }}</span>
    </div>
    <div v-show="open" class="biz-section-card-body">
      <a-row v-if="section.fields && section.fields.length" :gutter="16">
        <a-col v-for="f in section.fields" :key="f.key" :xs="24" :md="f.span || 12">
          <FieldItem
            :field="f"
            :model="model"
            :mode="mode"
            :options="(optionsMap && optionsMap[f.key]) || f.options"
          />
        </a-col>
      </a-row>
      <template v-if="section.subSections && section.subSections.length">
        <SubSection
          v-for="sub in section.subSections"
          :key="sub.title"
          :section="sub"
          :model="model"
          :mode="mode"
          :options-map="optionsMap"
          :depth="1"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CaretRightOutlined } from '@ant-design/icons-vue'
import FieldItem from './FieldItem.vue'
import SubSection from './SubSection.vue'
import type { SectionDef } from './types'

const props = withDefaults(
  defineProps<{
    section: SectionDef
    model: Record<string, any>
    mode?: 'form' | 'detail'
    optionsMap?: Record<string, { label: string; value: any }[]>
  }>(),
  { mode: 'form', optionsMap: undefined }
)

const open = ref(props.section.defaultOpen !== false)
</script>

<style scoped>
.biz-section-card {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.biz-section-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fafafa;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #f0f0f0;
}

.biz-section-card-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.biz-arrow {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.2s;
}

.biz-arrow.rotated {
  transform: rotate(90deg);
}

.biz-section-card-body {
  padding: 16px;
}
</style>