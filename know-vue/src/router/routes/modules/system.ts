import type { AppRoute } from '../../types'
// import { t } from '@/locales/helper'
import Layout from '@/layout'

// system module page - KnowBoot System Module
const SystemRoute: AppRoute = {
  path: '/system',
  name: 'System',
  component: Layout,
  redirect: '/system/user',
  meta: {
    title: '系统管理',
    icon: 'system',
    orderNo: 2
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: () => import('@/views/system/user.vue'),
      meta: {
        title: '用户管理'
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: () => import('@/views/system/role.vue'),
      meta: {
        title: '角色管理'
      }
    },
    {
      path: 'menu',
      name: 'Menu',
      component: () => import('@/views/system/menu.vue'),
      meta: {
        title: '菜单管理'
      }
    },
    {
      path: 'dept',
      name: 'Dept',
      component: () => import('@/views/system/dept.vue'),
      meta: {
        title: '部门管理'
      }
    },
    {
      path: 'job',
      name: 'Job',
      component: () => import('@/views/system/job.vue'),
      meta: {
        title: '岗位管理'
      }
    },
    {
      path: 'dict',
      name: 'Dict',
      component: () => import('@/views/system/dict.vue'),
      meta: {
        title: '字典管理'
      }
    },
    {
      path: 'tabbar',
      name: 'Tabbar',
      component: () => import('@/views/system/tabbar/index.vue'),
      meta: {
        title: '底部导航'
      }
    },
    {
      path: 'menu-config/tabbar',
      name: 'MenuConfigTabbar',
      component: () => import('@/views/system/menuConfig/index.vue'),
      meta: {
        title: '底部导航配置'
      }
    },
    {
      path: 'menu-config/home',
      name: 'MenuConfigHome',
      component: () => import('@/views/system/menuConfig/index.vue'),
      meta: {
        title: '首页菜单配置'
      }
    },
    {
      path: 'tenant',
      name: 'Tenant',
      component: () => import('@/views/system/tenant/index.vue'),
      meta: {
        title: '租户管理'
      }
    }
  ]
}

export default SystemRoute
