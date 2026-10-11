import type { CascadeDictNode } from '@/api/system/cascadeDict'

/** 级联选择项（label 取节点名称） */
export interface CascadeOption {
    label: string
    value: string
    icon?: string
    color?: string
    children?: CascadeOption[]
}

/** 级联字典树 → 选择项 */
export function buildCascadeOptions(tree?: CascadeDictNode[] | null): CascadeOption[] {
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
            option.children = buildCascadeOptions(node.children)
        }
        return option
    })
}

/**
 * 依据编码在树中查找完整名称路径（数组形式）
 * 用于列表/详情展示（如「工作 / 编程」）；未命中返回空数组
 */
export function resolveCascadeLabelPath(
    tree?: CascadeDictNode[] | null,
    value?: string | number | null
): string[] {
    if (value === undefined || value === null || value === '' || !Array.isArray(tree)) {
        return []
    }
    const target = String(value)
    const walk = (nodes: CascadeDictNode[], path: string[]): string[] | null => {
        for (const node of nodes) {
            const next = [...path, node.name]
            if (String(node.value) === target) {
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
 * 依据编码在树中查找完整名称路径（字符串形式）
 * 未命中时回退为原始编码
 */
export function resolveCascadePath(
    tree?: CascadeDictNode[] | null,
    value?: string | number | null,
    separator = ' / '
): string {
    if (value === undefined || value === null || value === '') {
        return ''
    }
    const labels = resolveCascadeLabelPath(tree, value)
    return labels.length ? labels.join(separator) : String(value)
}

/** 依据编码在树中查找节点；未命中返回 null */
export function findCascadeNode(
    tree?: CascadeDictNode[] | null,
    value?: string | number | null
): CascadeDictNode | null {
    if (value === undefined || value === null || value === '' || !Array.isArray(tree)) {
        return null
    }
    const target = String(value)
    for (const node of tree) {
        if (String(node.value) === target) {
            return node
        }
        const found = node.children ? findCascadeNode(node.children, value) : null
        if (found) return found
    }
    return null
}
