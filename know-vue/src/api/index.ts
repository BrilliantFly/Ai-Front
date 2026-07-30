import type { LoginFormState } from '@/types'
import { service } from '@/utils/axios'

// User login api
export function loginApi(data: LoginFormState): Promise<any> {
  return service({
    url: '/api/login/account',
    method: 'post',
    data
  })
}

// Get User info
export function getUserInfo(): Promise<any> {
  return service({
    url: '/api/login/getUserInfo',
    method: 'get'
  })
}

// User logout api
export function logoutApi() {
  return service({
    url: '/api/login/logout',
    method: 'get'
  })
}

// Table list
export function getTableList(params) {
  return service({
    url: '/table/getTableList',
    method: 'get',
    params
  })
}
