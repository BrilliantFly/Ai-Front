import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { checkAppVersion } from '@/api/system/app-version'
import { useAppVersionStore } from '@/stores/appVersion'

/**
 * @description App 版本检测 hook
 * - 负责读取客户端当前版本、调用检测接口、维护检测结果（存入 appVersionStore）
 * - 纯 store 单例，无实例化开销，可在 App.vue / 组件中直接调用
 */

/** 静默检测的最小间隔：10 分钟内不重复请求 */
const SILENT_CHECK_INTERVAL = 10 * 60 * 1000

/** 非 App 端（H5 / 小程序）兜底版本 */
const FALLBACK_VERSION = { name: '1.0.0', code: 100 }

/** 由版本名推导版本号：1.9.0 -> 10900 */
const versionNameToCode = (name: string) => {
    const nums = String(name)
        .split('.')
        .map((n) => parseInt(n, 10))
    if (!nums.length || nums.some((n) => Number.isNaN(n))) return 0
    const [major = 0, minor = 0, patch = 0] = nums
    return major * 10000 + minor * 100 + patch
}

/**
 * 当前是否为 App 原生端
 * 热更新（整包覆盖安装）仅 App 端可用，H5/小程序跳过检测，避免误报新版本
 */
export const isAppPlatform = (): boolean => {
    // #ifdef APP-PLUS
    return true
    // #endif
    // #ifndef APP-PLUS
    return false
    // #endif
}

/**
 * 获取当前客户端版本
 * - App 端读 plus.runtime（version 为版本名，versionCode 为版本号）
 * - 其余端返回兜底常量
 */
export function getCurrentVersion(): { name: string; code: number } {
    // #ifdef APP-PLUS
    const name = plus.runtime.version || FALLBACK_VERSION.name
    const rawCode = Number(plus.runtime.versionCode)
    const code =
        (Number.isFinite(rawCode) && rawCode > 0 ? rawCode : versionNameToCode(name)) ||
        FALLBACK_VERSION.code
    return { name, code }
    // #endif
    // #ifndef APP-PLUS
    return { ...FALLBACK_VERSION }
    // #endif
}

/** 当前平台：ios / android */
export const getAppPlatform = (): 'ios' | 'android' => {
    try {
        return uni.getSystemInfoSync().platform === 'ios' ? 'ios' : 'android'
    } catch (_e) {
        return 'android'
    }
}

export function useAppVersion() {
    const store = useAppVersionStore()
    const { hasUpdate, forceUpdate, latest } = storeToRefs(store)

    const currentVersion = getCurrentVersion()
    const isChecking = computed(() => store.checking)

    /** 强制检测一次（失败静默，不打断业务流程） */
    const check = async (): Promise<boolean> => {
        if (store.checking) return hasUpdate.value
        // 非 App 端不支持整包热更新，直接跳过
        if (!isAppPlatform()) return hasUpdate.value
        store.setChecking(true)
        try {
            const data = await checkAppVersion({
                platform: getAppPlatform(),
                versionCode: currentVersion.code
            })
            store.setResult(data)
            store.markChecked()
            return store.hasUpdate
        } catch (e) {
            console.warn('[app-version] 版本检测失败', e)
            return false
        } finally {
            store.setChecking(false)
        }
    }

    /** 静默检测：10 分钟内已检测过 / 正在检测中则跳过 */
    const checkSilently = async (): Promise<boolean> => {
        if (store.checking) return hasUpdate.value
        if (store.checkedAt && Date.now() - store.checkedAt < SILENT_CHECK_INTERVAL) {
            return hasUpdate.value
        }
        return check()
    }

    return {
        currentVersion,
        hasUpdate,
        forceUpdate,
        latest,
        isChecking,
        check,
        checkSilently
    }
}
