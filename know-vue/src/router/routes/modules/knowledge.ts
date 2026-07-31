import type { AppRoute } from '../../types'
import Layout from '@/layout'

const KnowledgeRoute: AppRoute = {
  path: '/knowledge',
  name: 'Knowledge',
  component: Layout,
  redirect: '/knowledge/base',
  meta: {
    title: '知识管理',
    icon: 'document',
    orderNo: 5
  },
  children: [
    {
      path: 'base',
      name: 'KnowledgeBase',
      component: () => import('@/views/knowledge/base/index.vue'),
      meta: {
        title: '知识库'
      }
    },
    {
      path: 'document',
      name: 'KnowledgeDocument',
      component: () => import('@/views/knowledge/document/index.vue'),
      meta: {
        title: '文档管理'
      }
    },
    {
      path: 'quicknote',
      name: 'KnowledgeQuickNote',
      component: () => import('@/views/knowledge/quicknote/index.vue'),
      meta: {
        title: '快捷笔记'
      }
    },
    {
      path: 'tag',
      name: 'KnowledgeTag',
      component: () => import('@/views/knowledge/tag/index.vue'),
      meta: {
        title: '标签管理'
      }
    }
  ]
}

export default KnowledgeRoute
