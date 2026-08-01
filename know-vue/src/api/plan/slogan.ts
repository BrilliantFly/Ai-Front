import { service } from '@/utils/axios'

// 首页标语 API
export function getSloganList(params) {
  return service({
    url: '/adminapi/plan/slogan/page',
    method: 'get',
    params
  })
}

export function getSloganAll(params) {
  return service({
    url: '/adminapi/plan/slogan/list',
    method: 'get',
    params
  })
}

export function getCurrentSlogan() {
  return service({
    url: '/adminapi/plan/slogan/current',
    method: 'get'
  })
}

export function addSlogan(data) {
  return service({
    url: '/adminapi/plan/slogan',
    method: 'post',
    data
  })
}

export function updateSlogan(data) {
  return service({
    url: '/adminapi/plan/slogan',
    method: 'put',
    data
  })
}

export function deleteSlogan(id) {
  return service({
    url: `/adminapi/plan/slogan/${id}`,
    method: 'delete'
  })
}
