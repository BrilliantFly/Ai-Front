import request from '@/utils/request'

/**
 * @description App 版本检测（整包热更新）
 * - 免登录接口，启动阶段即可调用
 * - 返回值已被 response 拦截器解包，此处即业务 data
 */

/** 检测入参 */
export interface AppVersionCheckParams {
    /** 平台：android / ios */
    platform: string
    /** 客户端当前版本号（数字） */
    versionCode: number
}

/** 服务端下发的最新版本信息 */
export interface AppVersionLatest {
    versionCode: number
    versionName: string
    downloadUrl: string
    fileSize?: number | null
    md5?: string | null
    updateDesc?: string | null
}

/** 检测结果 */
export interface AppVersionCheckResult {
    hasUpdate: boolean
    forceUpdate: boolean
    latest: AppVersionLatest | null
}

/**
 * 查询当前平台是否有新版本
 * 免登录接口，因此不传 isAuth
 */
export function checkAppVersion(data: AppVersionCheckParams) {
    return request.get<AppVersionCheckResult>({
        url: '/system/app/version/latest',
        data
    })
}
