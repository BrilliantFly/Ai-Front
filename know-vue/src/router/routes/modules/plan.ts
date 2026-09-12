import type { AppRoute } from '../../types'
import Layout from '@/layout'

const planRoute: AppRoute = {
  path: '/plan',
  name: 'Plan',
  component: Layout,
  redirect: '/plan/schedule',
  meta: {
    title: '计划管理',
    icon: 'calendar',
    orderNo: 3
  },
  children: [
    {
      path: 'schedule',
      name: 'PlanSchedule',
      component: () => import('@/views/plan/schedule/index.vue'),
      meta: {
        title: '日程管理'
      }
    },
    {
      path: 'habit',
      name: 'PlanHabit',
      component: () => import('@/views/plan/habit/index.vue'),
      meta: {
        title: '习惯打卡'
      }
    },
    {
      path: 'slogan',
      name: 'PlanSlogan',
      component: () => import('@/views/plan/slogan/index.vue'),
      meta: {
        title: '首页标语'
      }
    },
    {
      path: 'info',
      name: 'PlanInfo',
      component: () => import('@/views/plan/info/index.vue'),
      meta: {
        title: '计划管理'
      }
    },
    {
      path: 'gantt',
      name: 'PlanGantt',
      component: () => import('@/views/plan/gantt/index.vue'),
      meta: {
        title: '甘特图',
        hideMenu: true
      }
    },
    {
      path: 'template/info',
      name: 'PlanTemplateInfo',
      component: () => import('@/views/plan/template/info/index.vue'),
      meta: {
        title: '计划模板管理'
      }
    },
    {
      path: 'template/event',
      name: 'PlanTemplateEvent',
      component: () => import('@/views/plan/template/event/index.vue'),
      meta: {
        title: '日程模板管理'
      }
    },
    {
      path: 'template/habit',
      name: 'PlanTemplateHabit',
      component: () => import('@/views/plan/template/habit/index.vue'),
      meta: {
        title: '打卡模板管理'
      }
    },
    {
      path: 'template/use',
      name: 'PlanTemplateUse',
      component: () => import('@/views/plan/template/use/index.vue'),
      meta: {
        title: '使用模板',
        icon: 'ant-design:plus-circle-outlined'
      }
    },
    {
      path: 'template/from-plan',
      name: 'PlanTemplateFromPlan',
      component: () => import('@/views/plan/template/from-plan/index.vue'),
      meta: {
        title: '从计划生成模板',
        icon: 'ant-design:swap-outlined'
      }
    }
  ]
}

export default planRoute
