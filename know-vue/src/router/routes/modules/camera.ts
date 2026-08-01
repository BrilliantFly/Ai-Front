import type { AppRoute } from '../../types'
import Layout from '@/layout'

// camera module page - KnowBoot Camera Module
const CameraRoute: AppRoute = {
  path: '/camera',
  name: 'Camera',
  component: Layout,
  redirect: '/camera/device',
  meta: {
    title: '摄像头管理',
    icon: 'video',
    orderNo: 4
  },
  children: [
    {
      path: 'device',
      name: 'CameraDevice',
      component: () => import('@/views/system/camera/index.vue'),
      meta: {
        title: '设备管理'
      }
    },
    {
      path: 'wifi',
      name: 'CameraWifi',
      component: () => import('@/views/system/device/wifi.vue'),
      meta: {
        title: 'Wi-Fi管理'
      }
    },
    {
      path: 'records',
      name: 'CameraRecords',
      component: () => import('@/views/system/camera/records.vue'),
      meta: {
        title: '录像记录'
      }
    },
    {
      path: 'snapshots',
      name: 'CameraSnapshots',
      component: () => import('@/views/system/camera/snapshots.vue'),
      meta: {
        title: '截图记录'
      }
    }
  ]
}

export default CameraRoute
