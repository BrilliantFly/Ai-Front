import type { AppMenu } from '../types'

/**
 * 后端 sys_menu 表对应的菜单结构（GET /system/menu/list 返回）
 */
export interface SysMenu {
  id: number
  parentId: number
  menuName: string
  path: string
  component: string | null
  perms: string | null
  icon: string | null
  /** 1=目录 2=菜单 3=按钮 */
  menuType: number
  sort: number
  /** 1=显示 0=隐藏 */
  status: number
  tenantId: number | null
  delFlag: number
}

/**
 * 将后端扁平菜单列表转换为前端侧边栏需要的树形 AppMenu[]
 * 规则：
 * - 过滤：status=0（隐藏）、menuType=3（按钮，仅权限点，不渲染）、delFlag=1（已删除）
 * - 按 parentId 组装树，parentId=0 为顶级
 * - 排序：按 sort 升序
 */
export function transformSysMenusToMenus(sysMenus: SysMenu[]): AppMenu[] {
  if (!Array.isArray(sysMenus) || sysMenus.length === 0) {
    return []
  }

  const validMenus = sysMenus.filter(m => {
    return m && m.status === 1 && m.menuType !== 3 && m.delFlag === 0
  })

  const menuMap = new Map<number, AppMenu>()
  validMenus.forEach(m => {
    menuMap.set(m.id, {
      name: m.menuName,
      path: m.path || `/menu-${m.id}`,
      icon: m.icon || undefined,
      orderNo: m.sort,
      meta: {
        title: m.menuName,
        icon: m.icon || undefined,
        orderNo: m.sort
      },
      children: []
    })
  })

  const roots: AppMenu[] = []
  validMenus.forEach(m => {
    const node = menuMap.get(m.id)!
    if (m.parentId === 0) {
      roots.push(node)
    } else {
      const parent = menuMap.get(m.parentId)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
      } else {
        // 父级不存在（可能被过滤），提升为顶级，避免菜单丢失
        roots.push(node)
      }
    }
  })

  // 递归排序
  const sortRecursive = (list: AppMenu[]) => {
    list.sort((a, b) => (a?.orderNo || 0) - (b?.orderNo || 0))
    list.forEach(item => {
      if (item.children && item.children.length) {
        sortRecursive(item.children)
      }
    })
  }
  sortRecursive(roots)

  // 移除空 children，避免渲染出空分组
  const cleanup = (list: AppMenu[]) => {
    list.forEach(item => {
      if (item.children && item.children.length === 0) {
        delete item.children
      } else if (item.children && item.children.length > 0) {
        cleanup(item.children)
      }
    })
  }
  cleanup(roots)

  return roots
}
