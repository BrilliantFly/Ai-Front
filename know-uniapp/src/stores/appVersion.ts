import { defineStore } from 'pinia'
import type { AppVersionCheckResult, AppVersionLatest } from '@/api/system/app-version'

interface AppVersionState {
    /** 是否存在新版本 */
    hasUpdate: boolean
    /** 是否为强制更新 */
    forceUpdate: boolean
    /** 服务端下发的最新版本信息 */
    latest: AppVersionLatest | null
    /** 上次检测时间戳（ms），用于静默检测节流 */
    checkedAt: number
    /** 检测进行中标记，避免并发请求 */
    checking: boolean
}

export const useAppVersionStore = defineStore({
    id: 'appVersionStore',
    state: (): AppVersionState => ({
        hasUpdate: false,
        forceUpdate: false,
        latest: null,
        checkedAt: 0,
        checking: false
    }),
    getters: {
        getLatest: (state) => state.latest,
        getLatestVersionName: (state) => state.latest?.versionName || '',
        getDownloadUrl: (state) => state.latest?.downloadUrl || '',
        getUpdateDesc: (state) => state.latest?.updateDesc || '',
        isChecking: (state) => state.checking
    },
    actions: {
        /** 写入一次检测结果 */
        setResult(data?: AppVersionCheckResult | null) {
            if (!data) {
                this.hasUpdate = false
                this.forceUpdate = false
                this.latest = null
                return
            }
            this.hasUpdate = !!data.hasUpdate
            this.forceUpdate = !!data.forceUpdate
            this.latest = data.latest ?? null
        },
        setChecking(checking: boolean) {
            this.checking = checking
        },
        /** 记录检测时间（静默检测节流用） */
        markChecked() {
            this.checkedAt = Date.now()
        },
        /** 重置全部状态 */
        clear() {
            this.hasUpdate = false
            this.forceUpdate = false
            this.latest = null
            this.checkedAt = 0
            this.checking = false
        }
    }
})
