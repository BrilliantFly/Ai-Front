<template>
  <div class="biz-matrix">
    <!-- 一级区域主标题(左对齐可折叠, 数量在右) -->
    <div class="biz-matrix-header" @click="open = !open">
      <caret-right-outlined class="biz-matrix-arrow" :class="{ rotated: open }" />
      <span class="biz-matrix-title">{{ section.title }}</span>
      <span class="biz-matrix-count">共 {{ fieldCount }} 项</span>
    </div>

    <!-- 二级区域独立子矩阵表(列数自适应, 无深层级行以保留边框的占位格呈现) -->
    <div v-show="open" class="biz-matrix-body">
      <table v-for="sub in subTables" :key="sub.title" class="biz-matrix-table">
        <tbody>
          <tr v-for="(row, ri) in sub.rows" :key="ri">
            <template v-for="(cell, ci) in row.cells" :key="ci">
              <td
                v-if="cell.rowspan > 0"
                :class="['biz-matrix-level', 'level-' + (ci + 2)]"
                :rowspan="cell.rowspan"
              >
                {{ cell.title }}
              </td>
              <td
                v-else-if="cell.rowspan === 0"
                :class="['biz-matrix-level', 'biz-matrix-placeholder', 'level-' + (ci + 2)]"
              ></td>
            </template>
            <!-- 内容列: 字段块(单字段独占 / 双字段并排) -->
            <td class="biz-matrix-content">
              <div v-for="(fb, fi) in row.fieldBlocks" :key="fi" class="biz-field-row">
                <FieldItem
                  v-for="f in fb"
                  :key="f.key"
                  :field="f"
                  :model="model"
                  :mode="mode"
                  :options="(optionsMap && optionsMap[f.key]) || f.options"
                  class="biz-field-cell"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaretRightOutlined } from '@ant-design/icons-vue'
import FieldItem from './FieldItem.vue'
import type { FieldDef, SectionDef } from './types'

const props = withDefaults(
  defineProps<{
    /** 一级区域 */
    section: SectionDef
    model: Record<string, any>
    mode?: 'form' | 'detail'
    optionsMap?: Record<string, { label: string; value: any }[]>
  }>(),
  { mode: 'form', optionsMap: undefined }
)

const open = ref(true)

/** 将字段按 span 打包为行内块: span>=24(textarea/整行)独占一块; span<24 两个并排 */
const packFields = (fields: FieldDef[]): FieldDef[][] => {
  const blocks: FieldDef[][] = []
  let cur: FieldDef[] = []
  for (const f of fields) {
    if ((f.span ?? 12) >= 24) {
      if (cur.length) {
        blocks.push(cur)
        cur = []
      }
      blocks.push([f])
    } else {
      cur.push(f)
      if (cur.length >= 2) {
        blocks.push(cur)
        cur = []
      }
    }
  }
  if (cur.length) blocks.push(cur)
  return blocks
}

interface MatrixCell {
  title: string
  /** >0: 合并单元格 rowspan; 0: 无边框占位(保持列对齐); -1: 被上方合并覆盖不渲染 */
  rowspan: number
}
interface MatrixRow {
  cells: MatrixCell[]
  fieldBlocks: FieldDef[][]
}
interface SubTable {
  title: string
  rows: MatrixRow[]
}

/** 递归收集字段块(携带层级路径, 从二级区域标题开始) */
const collectRows = (sec: SectionDef, path: string[], out: { path: string[]; blocks: FieldDef[][] }[]) => {
  if (sec.fields && sec.fields.length) {
    out.push({ path, blocks: packFields(sec.fields) })
  }
  if (sec.subSections && sec.subSections.length) {
    for (const sub of sec.subSections) {
      collectRows(sub, [...path, sub.title], out)
    }
  }
}

/** 由收集行构建合并单元格矩阵(列数=该子表最大深度) */
const buildMatrix = (rows: { path: string[]; blocks: FieldDef[][] }[]): MatrixRow[] => {
  const maxLevel = Math.max(0, ...rows.map((r) => r.path.length))
  const levelCols = Math.max(1, maxLevel)

  const flatPaths: string[][] = []
  for (const r of rows) {
    for (let i = 0; i < r.blocks.length; i++) flatPaths.push(r.path)
  }

  const n = flatPaths.length
  const levelMarks: number[][] = flatPaths.map(() => [])
  for (let lv = 0; lv < levelCols; lv++) {
    for (let li = 0; li < n; li++) {
      const val = flatPaths[li][lv]
      if (val === undefined) {
        levelMarks[li].push(0)
        continue
      }
      const prevVal = li > 0 ? flatPaths[li - 1][lv] : undefined
      if (li > 0 && prevVal === val) {
        levelMarks[li].push(-1)
        continue
      }
      let cnt = 1
      for (let k = li + 1; k < n; k++) {
        if (flatPaths[k][lv] === val) cnt++
        else break
      }
      levelMarks[li].push(cnt)
    }
  }

  const out: MatrixRow[] = []
  let lineIdx = 0
  for (const r of rows) {
    for (const block of r.blocks) {
      const cells: MatrixCell[] = []
      for (let lv = 0; lv < levelCols; lv++) {
        const mark = levelMarks[lineIdx][lv]
        cells.push({ title: r.path[lv] ?? '', rowspan: mark })
      }
      out.push({ cells, fieldBlocks: [block] })
      lineIdx++
    }
  }
  return out
}

/** 一级区域内二级区域集合 → 各自独立子表 */
const subTables = computed<SubTable[]>(() => {
  const subs =
    props.section.subSections && props.section.subSections.length
      ? props.section.subSections
      : props.section.fields && props.section.fields.length
        ? [{ title: props.section.title, fields: props.section.fields }]
        : []

  return subs.map((sub) => {
    const rows: { path: string[]; blocks: FieldDef[][] }[] = []
    collectRows(sub, [sub.title], rows)
    return { title: sub.title, rows: buildMatrix(rows) }
  })
})

/** 一级区域内字段总数 */
const fieldCount = computed(() => {
  const walk = (sec: SectionDef): number => {
    let n = sec.fields ? sec.fields.length : 0
    if (sec.subSections) for (const s of sec.subSections) n += walk(s)
    return n
  }
  return walk(props.section)
})
</script>

<style scoped>
.biz-matrix {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  background: #fff;
}

.biz-matrix-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px 20px;
  background: #f0f5ff;
  border-bottom: 1px solid #d6e4ff;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.biz-matrix-header:hover {
  background: #e6f4ff;
}

.biz-matrix-arrow {
  font-size: 12px;
  color: #1677ff;
  transition: transform 0.2s;
}

.biz-matrix-arrow.rotated {
  transform: rotate(90deg);
}

.biz-matrix-title {
  font-size: 15px;
  font-weight: 600;
  color: #003eb3;
  letter-spacing: 1px;
}

.biz-matrix-count {
  position: absolute;
  right: 20px;
  font-size: 12px;
  color: #8c8c8c;
}

.biz-matrix-body {
  padding: 16px;
}

.biz-matrix-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-bottom: 16px;
}

.biz-matrix-table:last-child {
  margin-bottom: 0;
}

.biz-matrix-table :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 0;
  vertical-align: middle;
}

.biz-matrix-level {
  text-align: center;
  font-size: 13px;
}

.biz-matrix-level.level-2 {
  width: 12%;
  background: #d6e4ff;
  color: #003eb3;
  font-weight: 600;
}

.biz-matrix-level.level-3 {
  width: 13%;
  background: #fafafa;
  color: #555;
}

.biz-matrix-level.level-4 {
  width: 15%;
  background: #fffbe6;
  color: #874d00;
}

.biz-matrix-level.level-5,
.biz-matrix-level.level-6 {
  width: 15%;
  background: #fcfcfc;
  color: #666;
}

/* 占位格(该行无此层级): 保留边框保证网格完整, 背景随所属层级列 */
.biz-matrix-table :deep(td.biz-matrix-placeholder) {
  border: 1px solid #e8e8e8;
}

.biz-matrix-content {
  padding: 0;
}

.biz-field-row {
  display: flex;
  gap: 16px;
  padding: 6px 12px;
  border-bottom: 1px dashed #f0f0f0;
}

.biz-field-row:last-child {
  border-bottom: none;
}

.biz-field-cell {
  flex: 1;
  min-width: 0;
}

/* 表单模式: 强制 label 左侧横排(与预览一致, 覆盖外层 vertical layout) */
/* 表单模式: 强制 label 左侧横排(与预览一致, 覆盖外层 vertical layout)
   注意: antdv 内部 .ant-form-item-row 才是真正承载 label/control 的 flex 容器 */
.biz-matrix-content :deep(.ant-form-item-row) {
  flex-direction: row;
}

.biz-matrix-content :deep(.ant-form-item-row .ant-form-item-label) {
  flex: 0 0 120px;
  text-align: right;
  padding: 0 8px 0 0;
  overflow: visible;
}

.biz-matrix-content :deep(.ant-form-item-row .ant-form-item-label > label) {
  height: auto;
  white-space: normal;
}

.biz-matrix-content :deep(.ant-form-item-row .ant-form-item-label > label::after) {
  content: '';
}

.biz-matrix-content :deep(.ant-form-item-row .ant-form-item-control) {
  flex: 1;
}

/* 输入控件统一定宽(与设计稿一致): input/textarea 220px, 内容居中; flex:none 防止双字段行压缩 */
.biz-matrix-content :deep(.ant-form-item-control-input-content > input.ant-input) {
  width: 220px;
  flex: none;
  text-align: center;
}

.biz-matrix-content :deep(.ant-form-item-control-input-content > textarea.ant-input) {
  width: 220px;
  flex: none;
  min-height: 72px;
  text-align: center;
}

.biz-matrix-content :deep(.ant-form-item-control-input-content .ant-input-affix-wrapper) {
  width: 220px;
  flex: none;
}

.biz-matrix-content :deep(.ant-form-item-control-input-content .ant-input-affix-wrapper input.ant-input) {
  text-align: center;
}
</style>