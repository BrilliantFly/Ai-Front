import type { CascadeDictNode } from '@/api/system/cascadeDict'

/**
 * ant-design-vue 级联选择器 / 树选择器选项
 */
export interface CascadeOption {
  label: string
  value: string
  icon?: string
  color?: string
  children?: CascadeOption[]
}

/**
 * 级联字典树 → 级联选择器选项
 * - label 优先显示「名称」，可选择性地拼上图标
 */
export function buildCascaderOptions(tree: CascadeDictNode[] | undefined | null): CascadeOption[] {
  if (!Array.isArray(tree) || tree.length === 0) {
    return []
  }
  return tree.map((node) => {
    const option: CascadeOption = {
      label: node.name,
      value: node.value,
      icon: node.icon,
      color: node.color
    }
    if (node.children && node.children.length) {
      option.children = buildCascaderOptions(node.children)
    }
    return option
  })
}

/**
 * 依据编码值在树中查找自根到目标节点的 value 路径
 * 用于 a-cascader 的 v-model 回显（如 ['skill', 'programming']）
 */
export function resolveCascadeValuePath(
  tree: CascadeDictNode[] | undefined | null,
  value?: string
): string[] {
  if (!value || !Array.isArray(tree)) {
    return []
  }
  const walk = (nodes: CascadeDictNode[], path: string[]): string[] | null => {
    for (const node of nodes) {
      const next = [...path, node.value]
      if (node.value === value) {
        return next
      }
      if (node.children && node.children.length) {
        const found = walk(node.children, next)
        if (found) return found
      }
    }
    return null
  }
  return walk(tree, []) || []
}

/**
 * 依据编码值在树中查找完整名称路径
 * 用于列表/详情展示（如「工作 / 编程」）；未命中时回退为原始编码
 */
export function resolveCascadePath(
  tree: CascadeDictNode[] | undefined | null,
  value?: string,
  separator = ' / '
): string {
  if (!value) {
    return ''
  }
  if (!Array.isArray(tree)) {
    return value
  }
  const labels = resolveCascadeLabelPath(tree, value)
  return labels.length ? labels.join(separator) : value
}

/** 依据编码值在树中查找完整名称路径（数组形式） */
export function resolveCascadeLabelPath(
  tree: CascadeDictNode[] | undefined | null,
  value?: string
): string[] {
  if (!value || !Array.isArray(tree)) {
    return []
  }
  const walk = (nodes: CascadeDictNode[], path: string[]): string[] | null => {
    for (const node of nodes) {
      const next = [...path, node.name]
      if (node.value === value) {
        return next
      }
      if (node.children && node.children.length) {
        const found = walk(node.children, next)
        if (found) return found
      }
    }
    return null
  }
  return walk(tree, []) || []
}
