import { isDevMode } from '@/utils/env'

//#ifdef APP-PLUS
// App 原生端：HBuilderX 打包不会加载 .env.app，必须内置兜底域名，
// 否则 VITE_APP_BASE_URL 为空 → 相对路径 → 原生环境全部请求失败
const envBaseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://101.37.83.88'
// customer 模块暂未启用，与主服务同域名兜底
const envCustomerBaseUrl = import.meta.env.VITE_CUSTOMER_BASE_URL || 'http://101.37.83.88'
//#endif
//#ifndef APP-PLUS
const envBaseUrl = import.meta.env.VITE_APP_BASE_URL || ''
const envCustomerBaseUrl = import.meta.env.VITE_CUSTOMER_BASE_URL || ''
//#endif

let baseUrl = `${envBaseUrl}/`
let customerBaseUrl = `${envCustomerBaseUrl}/`

/*
 * 微信小程序在`VITE_APP_BASE_URL`存在或`dev`模式下
 * 使用`VITE_APP_BASE_URL`的值
 * 其他情况使用`[baseUrl]`，方便服务端替换
 */

//#ifdef MP-WEIXIN
baseUrl = isDevMode() || envBaseUrl ? baseUrl : '[baseUrl]'
customerBaseUrl = isDevMode() || envCustomerBaseUrl ? customerBaseUrl : '[customerBaseUrl]'
//#endif

const config = {
    version: '1.9.0', //版本号
    baseUrl, //请求接口域名
    customerBaseUrl, //客户管理服务域名
    urlPrefix: 'api', //请求默认前缀
    // Service path mapping - 服务路径映射
    serviceMap: {
        java: '/plan', // Java services (plan, system, etc.)
        python: '/python', // Python AI services
        customer: '/customer' // Customer CRM service
    },
    timeout: 60 * 1000 //请求超时时长
}

export default config
