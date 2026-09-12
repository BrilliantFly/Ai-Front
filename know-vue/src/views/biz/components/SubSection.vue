<template>
  <div class="biz-subsection" :style="{ marginLeft: depth * 14 + 'px' }">
    <div class="biz-subsection-title">{{ section.title }}</div>
    <div class="biz-subsection-body">
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
          :depth="depth + 1"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import FieldItem from './FieldItem.vue'
import type { SectionDef } from './types'

withDefaults(
  defineProps<{
    section: SectionDef
    model: Record<string, any>
    mode?: 'form' | 'detail'
    optionsMap?: Record<string, { label: string; value: any }[]>
    /** 缩进层级(二级区域为 1) */
    depth?: number
  }>(),
  { mode: 'form', optionsMap: undefined, depth: 1 }
)
</script>

<style scoped>
.biz-subsection {
  border-left: 2px solid #e8e8e8;
  margin-bottom: 12px;
}

.biz-subsection-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
  padding-left: 10px;
  position: relative;
}

.biz-subsection-title::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 2px;
  bottom: 2px;
  width: 2px;
  background: #1677ff;
}

.biz-subsection-body {
  padding-left: 10px;
}
</style>