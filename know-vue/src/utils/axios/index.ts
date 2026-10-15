import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { message } from 'ant-design-vue'

import { router } from '@/router'
import { getToken, clearAuthCache, getAuthCache } from '@/utils/auth'
import { TENANT_KEY } from '@/enums/cacheEnum'

// Determine if running in production mode
const isProduction = import.meta.env.PROD

// Service configuration
const serviceConfig = {
  // Gateway base URL - production uses env var, dev uses proxy
  // 后端不需要 /api 前缀，所以这里留空
  baseURL: isProduction ? (import.meta.env.VITE_API_BASE_URL || '') : '',

  // Service path mapping
  serviceMap: {
    java: '', // 直接代理到后端
    python: '/python' // Python AI services
  },
  timeout: 10 * 1000
}

// Create axios instance
const service = axios.create({
  baseURL: serviceConfig.baseURL,
  timeout: serviceConfig.timeout
})

// Handle Error
const handleError = (error: AxiosError): Promise<AxiosError> => {
  if (error.response?.status === 401 || error.response?.status === 504) {
    clearAuthCache()
    router.push({ path: '/login' })
  }
  message.error(error.message || 'error')
  return Promise.reject(error)
}

// Request interceptors configuration
service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 统一使用本应用的登录态 token（Persistent 缓存的 TOKEN_KEY）。
  // 不再优先读取裸 localStorage['token']：该键本应用从不写入，可能被同源其他应用或历史数据污染，
  // 会导致重新登录后仍然发送过期 token（后端返回“token参数无效”）。
  const token = getToken() as string
  if (token) {
    ;(config as Recordable).headers['token'] = `${token}`
  }

  // 添加租户ID
  const tenant = getAuthCache(TENANT_KEY)
  if (tenant?.id) {
    ;(config as Recordable).headers['X-Tenant-Id'] = tenant.id
  }

  ;(config as Recordable).headers['Content-Type'] = 'application/json'
  return config
}, handleError)

// 登录态失效统一处理：清除本地登录态并跳转登录页
const handleInvalidToken = (msg?: string) => {
  clearAuthCache()
  // 清理可能存在的裸 token 键（历史/同源污染），避免下次继续发送无效 token
  localStorage.removeItem('token')
  message.error(msg || '登录状态已失效，请重新登录')
  const current = router.currentRoute.value
  if (current.path !== '/login') {
    router.replace({
      path: '/login',
      query: current.fullPath ? { redirect: current.fullPath } : undefined
    })
  }
}

// Respose interceptors configuration
service.interceptors.response.use((response: AxiosResponse) => {
  const data = response.data
  console.log('Axios 响应原始数据:', data)

  // token 无效：后端 TOKEN_INVALID 返回 code=-1（注意是 HTTP 200，需在此单独处理，否则会卡在错误提示）
  if (data.code === -1) {
    console.log('Axios 检测到 token 无效(code=-1)，清除登录态并跳转登录页')
    handleInvalidToken(data.msg)
    return Promise.reject(new Error(data.msg || 'token参数无效'))
  }

  // token 为空/登录超时：后端 TOKEN_EMPTY 返回 code=0 且 msg 含“登录超时”
  if (data.code === 0 && typeof data.msg === 'string' && data.msg.indexOf('登录超时') !== -1) {
    console.log('Axios 检测到登录超时，清除登录态并跳转登录页')
    handleInvalidToken(data.msg)
    return Promise.reject(new Error(data.msg))
  }

  // 后端成功 code=0 或 code=1 或 code=2
  if (data.code === 0 || data.code === 1 || data.code === 2 || data.code === 200) {
    console.log('Axios 判定为成功')
    // 统一返回 data
    return data
  } else {
    console.log('Axios 判定为失败，code:', data.code, 'msg:', data.msg)
    message.error(data.msg || data.message || '操作失败')
    return Promise.reject('error')
  }
}, handleError)

// Export service and config
export { service, serviceConfig }
export default service
