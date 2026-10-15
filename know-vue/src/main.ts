import '@/design/index.less'
// register svg icon
import 'virtual:svg-icons-register'

import { createApp } from 'vue'
import { initAppConfigStore } from '@/logics/initAppConfig'

import App from './App'

import { setupRouter, router } from './router'
import { setupStore } from '@/stores'
import { setupRouterGuard } from '@/router/guard'
import { setupPlugins } from '@/plugins'
import { setupI18n } from '@/locales'

/**
 * 构建产物按内容哈希拆分 chunk。若某次发布替换了静态资源，而浏览器标签页
 * 仍停留在旧版本，则懒加载的路由 chunk 会请求已不存在的旧文件而 404。
 * 此时 Vue Router 会中断导航，表现为「只切换了 tab 页签，内容区空白」。
 * 这里捕获该错误并自动刷新一次，加载最新资源后即可恢复。
 */
const CHUNK_RELOAD_KEY = '__know_chunk_reload__'

function reloadForMissingChunk() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    // 10 秒内只自动刷新一次，避免资源真正缺失时陷入死循环
    if (Date.now() - last < 10000) return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage 不可用时（隐私模式等）直接刷新
  }
  window.location.reload()
}

// Vite 在动态 import（含 modulepreload 依赖）失败时派发该事件
window.addEventListener('vite:preloadError', (event: Event) => {
  event.preventDefault()
  reloadForMissingChunk()
})

async function launchApp() {
  const app = createApp(App)

  // Configure store
  setupStore(app)

  // Initialize internal system configuration
  initAppConfigStore()

  // Configure router
  setupRouter(app)

  setupRouterGuard(router)

  // 兜底：懒加载路由组件 import 失败（旧 chunk 已被发布替换）时同样自动刷新
  router.onError(error => {
    const msg = String((error as Error)?.message || error || '')
    if (/dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg)) {
      reloadForMissingChunk()
    }
  })

  setupI18n(app)

  setupPlugins(app)

  app.mount('#app')
}

launchApp()
