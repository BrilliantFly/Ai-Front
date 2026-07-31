/**
 * Used to parse the .env.development proxy configuration
 */
import type { ProxyOptions } from 'vite'

type ProxyItem = [string, string]

type ProxyList = ProxyItem[]

type ProxyTargetList = Record<string, ProxyOptions>

const httpsRE = /^https:\/\//

export function createProxy(list: ProxyList = []) {
  const ret: ProxyTargetList = {}
  
  // 首先添加固定的登录相关代理
  ret['/login'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/login/, '/api/login/account')
  }
  ret['/logout'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/logout/, '/api/login/logout')
  }
  ret['/getUserInfo'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/getUserInfo/, '/api/login/getUserInfo')
  }
  
  // 系统管理 /system/* - 重写为 /api/system/*（后端统一 /api 前缀）
  ret['/system'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => '/api' + path
  }
  
  // 计划管理 /adminapi/plan/* - 重写为 /api/plan/*（单机模式，控制器已打包进 8082）
  ret['/adminapi/plan'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/adminapi\/plan/, '/api/plan')
  }
  
  // 摄像头管理 /adminapi/camera/* - 重写为 /api/camera/*（后端控制器映射为 /api/camera/*）
  ret['/adminapi/camera'] = {
    target: 'http://localhost:8082',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/adminapi\/camera/, '/api/camera')
  }
  
  // 然后处理环境变量中的代理配置
  for (const [prefix, target] of list) {
    const isHttps = httpsRE.test(target)

    const proxyConfig: ProxyOptions = {
      target: target,
      changeOrigin: true,
      ws: true
    }

    // /api 保持原路径（后端控制器映射了 /api 前缀）
    if (prefix === '/api') {
      proxyConfig.rewrite = path => path
    }
    // login/logout/getUserInfo 保持原路径
    else {
      proxyConfig.rewrite = path => path
    }

    if (isHttps) {
      proxyConfig.secure = false
    }

    ret[prefix] = proxyConfig
  }
  return ret
}