/** 层级表单/详情通用类型定义 */

/** 字段定义 */
export interface FieldDef {
  /** 字段标签 */
  label: string
  /** 绑定 key(支持点路径,如 company.name / profile.dynamicInfo) */
  key: string
  /** 控件类型 */
  type?: 'input' | 'textarea' | 'select' | 'selectMultiple' | 'number'
  placeholder?: string
  /** 下拉/多选选项(静态可选;动态选项通过 optionsMap 注入) */
  options?: { label: string; value: any }[]
  /** 栅格占位(24 整行, 12 半行, 默认 12) */
  span?: number
  /** textarea 行数 */
  rows?: number
}

/** 区域定义(一级/二级/三级区域共用) */
export interface SectionDef {
  title: string
  /** 是否默认展开(仅一级区域卡片生效) */
  defaultOpen?: boolean
  fields?: FieldDef[]
  subSections?: SectionDef[]
}

/** 渲染上下文 */
export interface RenderContext {
  /** 表单/详情数据模型(响应式) */
  model: Record<string, any>
  /** 渲染模式: form 表单 / detail 详情 */
  mode?: 'form' | 'detail'
  /** 动态下拉选项: key -> 选项数组 */
  optionsMap?: Record<string, { label: string; value: any }[]>
}