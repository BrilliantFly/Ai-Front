import { service } from '@/utils/axios'

/** 菜单类型 [1:tabBar, 2:首页, 3:侧边栏] */
export enum MenuConfigType {
  TABBAR = 1,
  HOME = 2,
  SIDEBAR = 3
}

export interface MenuConfigQuery {
  menuName?: string
  menuCode?: string
  menuType?: number
  isShow?: number
  pageNum?: number
  pageSize?: number
}

export interface MenuConfig {
  id?: number
  menuName: string
  menuCode: string
  menuType?: number
  parentId?: number
  icon?: string
  selectedIcon?: string
  path?: string
  url?: string
  sort?: number
  isShow?: number
  isBig?: number
  bigIcon?: string
  bigType?: string
  bigList?: string
  renderType?: number
  renderConfig?: string
  permissionId?: number
  permissionCode?: string
}

/** 分页查询菜单配置 */
export function getMenuConfigPage(params: MenuConfigQuery): Promise<any> {
  return service({
    url: '/system/menu/config/page',
    method: 'get',
    params
  })
}

/** 获取菜单配置列表 */
export function getMenuConfigList(params?: MenuConfigQuery): Promise<any> {
  return service({
    url: '/system/menu/config/list',
    method: 'get',
    params
  })
}

/** 根据菜单类型获取菜单列表 */
export function getMenuConfigByType(menuType: number): Promise<any> {
  return service({
    url: `/system/menu/config/type/${menuType}`,
    method: 'get'
  })
}

/** 获取TabBar菜单列表 */
export function getTabbarMenu(): Promise<any> {
  return service({
    url: '/system/menu/config/tabbar',
    method: 'get'
  })
}

/** 获取首页菜单列表 */
export function getHomeMenu(): Promise<any> {
  return service({
    url: '/system/menu/config/home',
    method: 'get'
  })
}

/** 获取菜单配置详情 */
export function getMenuConfig(id: number): Promise<any> {
  return service({
    url: `/system/menu/config/${id}`,
    method: 'get'
  })
}

/** 新增菜单配置 */
export function addMenuConfig(data: MenuConfig): Promise<any> {
  return service({
    url: '/system/menu/config',
    method: 'post',
    data
  })
}

/** 修改菜单配置 */
export function updateMenuConfig(data: MenuConfig): Promise<any> {
  return service({
    url: '/system/menu/config',
    method: 'put',
    data
  })
}

/** 删除菜单配置 */
export function deleteMenuConfig(id: number): Promise<any> {
  return service({
    url: `/system/menu/config/${id}`,
    method: 'delete'
  })
}
