import type { AppRoute } from '../../types'
import Layout from '@/layout'

// 客户管理 / 行业管理 - 对应数据库 sys_menu 6030/6040 两级菜单
const BizCustomerRoute: AppRoute = {
  path: '/biz/customer',
  name: 'BizCustomer',
  component: Layout,
  redirect: '/biz/customer/list',
  meta: {
    title: '客户管理',
    icon: 'user',
    orderNo: 7
  },
  children: [
    {
      path: 'list',
      name: 'BizCustomerList',
      component: () => import('@/views/biz/customer/list/index.vue'),
      meta: {
        title: '客户列表'
      }
    },
    {
      path: 'company',
      name: 'BizCustomerCompany',
      component: () => import('@/views/biz/customer/company/index.vue'),
      meta: {
        title: '公司管理'
      }
    },
    {
      path: 'followup',
      name: 'BizCustomerFollowup',
      component: () => import('@/views/biz/customer/followup/index.vue'),
      meta: {
        title: '跟进记录'
      }
    }
  ]
}

const BizIndustryRoute: AppRoute = {
  path: '/biz/industry',
  name: 'BizIndustry',
  component: Layout,
  redirect: '/biz/industry/list',
  meta: {
    title: '行业管理',
    icon: 'tags',
    orderNo: 8
  },
  children: [
    {
      path: 'list',
      name: 'BizIndustryList',
      component: () => import('@/views/biz/industry/list/index.vue'),
      meta: {
        title: '行业列表'
      }
    },
    {
      path: 'product',
      name: 'BizIndustryProduct',
      component: () => import('@/views/biz/industry/product/index.vue'),
      meta: {
        title: '行业产品'
      }
    },
    {
      path: 'enterprise',
      name: 'BizIndustryEnterprise',
      component: () => import('@/views/biz/industry/enterprise/index.vue'),
      meta: {
        title: '行业企业'
      }
    },
    {
      path: 'market',
      name: 'BizIndustryMarket',
      component: () => import('@/views/biz/industry/market/index.vue'),
      meta: {
        title: '行业市场'
      }
    }
  ]
}

export default [BizCustomerRoute, BizIndustryRoute]