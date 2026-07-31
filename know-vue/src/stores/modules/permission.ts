import { defineStore } from 'pinia'
import { stores } from '../index'

import type { AppRoute, AppMenu } from '@/router/types'
import { transformRouteToMenu } from '@/router/helper/menuHelper'
import { transformSysMenusToMenus } from '@/router/helper/sysMenuHelper'
import { getMenuList } from '@/api/system/menu'
import { asyncRoutes } from '@/router/routes'
import { useAppStoreWithOut } from './app'
import { appSetting } from '@/settings/appBaseSetting'
import { PermissionModeEnum } from '@/enums/appEnum'

interface PermissionState {
  menuList: AppMenu[]
}

export const usePermissionStore = defineStore('app-permission', {
  state: (): PermissionState => ({
    menuList: []
  }),
  getters: {
    getMenuList(): AppMenu[] {
      return this.menuList
    }
  },
  actions: {
    setMenuList(list: AppMenu[]) {
      this.menuList = list
    },
    async buildRoutesAction(): Promise<AppRoute[]> {
      const appStore = useAppStoreWithOut()

      let routes: AppRoute[] = []
      const { permissionMode = appSetting.permissionMode } = appStore.getAppConfig

      if (permissionMode === PermissionModeEnum.MAPPING) {
        routes = asyncRoutes

        // 优先从数据库动态获取菜单（sys_menu），失败时降级为静态菜单
        let menuList: AppMenu[] = []
        try {
          const res = await getMenuList({})
          if (res && res.code === 1 && Array.isArray(res.data)) {
            menuList = transformSysMenusToMenus(res.data)
          } else {
            console.warn('[permission] 动态菜单接口异常:', res?.msg || res)
          }
        } catch (e) {
          console.warn('[permission] 动态菜单获取失败，降级为静态菜单:', e)
        }

        if (!menuList.length) {
          menuList = transformRouteToMenu(routes)
        }

        menuList.sort((a, b) => {
          return (a?.orderNo || menuList.length) - (b?.orderNo || menuList.length)
        })

        this.setMenuList(menuList)
      }

      return routes
    },
    resetState(): void {
      this.menuList = []
    }
  }
})

// Need to be used outside the setup
export function usePermissionStoreWithOut() {
  return usePermissionStore(stores)
}
