/**
 * @description App 整包热更新工具
 * - 下载更新包（wgt/apk/ipa）→ plus.runtime.install → 重启应用
 * - 非 App 端（无 plus 运行时）为安全的降级提示，不会抛错
 */

/** 更新包信息（与服务端 latest 结构对齐） */
export interface AppUpdateInfo {
    versionCode?: number
    versionName: string
    downloadUrl: string
    fileSize?: number | null
    md5?: string | null
    updateDesc?: string | null
}

export interface DownloadInstallOptions {
    /** 强制安装（忽略版本号校验），强制更新时需要 */
    force?: boolean
    /** 静默模式：不弹 toast */
    silent?: boolean
    /** 安装完成回调（重启前触发） */
    onDone?: () => void
}

const closeLoading = () => {
    try {
        uni.hideLoading()
    } catch (_e) {
        // 忽略：页面未渲染时 hideLoading 可能异常
    }
}

const toast = (title: string, silent?: boolean) => {
    if (silent) return
    uni.showToast({ title, icon: 'none', duration: 2500 })
}

/** 字节数转可读文本 */
const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return ''
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 退出应用（仅 App 端有效） */
const quitApp = () => {
    // #ifdef APP-PLUS
    plus.runtime.quit()
    // #endif
}

/**
 * 下载并安装更新包
 */
export function downloadAndInstall(url: string, opts: DownloadInstallOptions = {}) {
    if (!url) {
        toast('更新包地址无效', opts.silent)
        return
    }

    // #ifdef APP-PLUS
    uni.showLoading({ title: '下载更新包...', mask: true })
    uni.downloadFile({
        url,
        success: (res) => {
            if (res.statusCode !== 200 || !res.tempFilePath) {
                closeLoading()
                console.warn('[app-update] 下载响应异常', res.statusCode)
                toast('更新包下载失败，请稍后重试', opts.silent)
                return
            }
            uni.showLoading({ title: '正在安装...', mask: true })
            plus.runtime.install(
                res.tempFilePath,
                { force: !!opts.force },
                () => {
                    closeLoading()
                    opts.onDone?.()
                    plus.runtime.restart()
                },
                (err) => {
                    closeLoading()
                    console.error('[app-update] 安装失败', err)
                    toast('更新包安装失败，请稍后重试', opts.silent)
                }
            )
        },
        fail: (err) => {
            closeLoading()
            console.error('[app-update] 下载失败', err)
            toast('更新包下载失败，请检查网络', opts.silent)
        }
    })
    // #endif

    // #ifndef APP-PLUS
    toast('热更新仅在 App 端可用，请在「我的 - 关于我们」查看', opts.silent)
    // #endif
}

/**
 * 弹出更新提示弹窗
 * @param latest 服务端下发的最新版本信息
 * @param forceUpdate 是否强制更新（强制更新不提供取消入口）
 */
export function showUpdateModal(latest: AppUpdateInfo | null | undefined, forceUpdate = false) {
    if (!latest?.downloadUrl) {
        toast('未获取到更新包，请稍后重试')
        return
    }
    const downloadUrl: string = latest.downloadUrl
    const versionName: string = latest.versionName

    const sizeText = formatFileSize(latest.fileSize)
    const descText = (latest.updateDesc || '').trim()
    const content =
        [descText ? `更新内容：${descText}` : '', sizeText ? `安装包大小：${sizeText}` : '']
            .filter(Boolean)
            .join('\n') || `是否更新到 v${versionName}？`

    uni.showModal({
        title: forceUpdate ? '需要更新后才能使用' : '发现新版本',
        content,
        confirmText: '立即更新',
        cancelText: '稍后再说',
        confirmColor: '#ff4d4f',
        showCancel: !forceUpdate,
        success: ({ confirm }) => {
            if (confirm) {
                downloadAndInstall(downloadUrl, { force: forceUpdate })
                return
            }
            // 强制更新不允许忽略：再次提示，仍不更新则退出应用
            if (!forceUpdate) return
            uni.showModal({
                title: '需要更新',
                content: `当前版本已停止服务，请更新到 v${versionName} 后继续使用`,
                showCancel: false,
                confirmText: '去更新',
                confirmColor: '#ff4d4f',
                success: ({ confirm: retry }) => {
                    if (retry) {
                        downloadAndInstall(downloadUrl, { force: true })
                        return
                    }
                    quitApp()
                }
            })
        }
    })
}
