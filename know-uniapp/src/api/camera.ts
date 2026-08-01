import request, { createRequest } from '@/utils/request'

/**
 * 摄像头服务请求实例
 * 请求经 /adminapi/camera/* → rewrite → /api/camera/*
 * standalone 模式: 由 know-boot-system(8082) 提供服务
 * 微服务模式: 经 Gateway 路由到 camera 服务
 */
const cameraRequest = createRequest({
    baseUrl: '',       // 使用相对路径，经 Nginx 代理
    urlPrefix: '',     // URL 已以 /camera 开头
    withToken: true    // 携带认证 Token
})

/**
 * 摄像头设备相关接口
 */

// 设备状态枚举
export enum CameraStatus {
    Offline = 0,
    Online = 1
}

// 录像类型枚举
export enum RecordType {
    Manual = 1, // 手动录制
    Timed = 2, // 定时录制
    Motion = 3 // 移动侦测
}

// 录像状态枚举
export enum RecordStatus {
    Recording = 0, // 录制中
    Completed = 1, // 已完成
    Uploaded = 2 // 已上传
}

// 设备接口
export interface CameraDevice {
    id?: number
    deviceName: string
    deviceCode: string
    deviceModel?: string
    manufacturer?: string
    ipAddress?: string
    macAddress?: string
    port?: number
    username?: string
    password?: string
    streamUrl?: string
    snapshotUrl?: string
    status?: CameraStatus
    position?: string
    remark?: string
    userId?: number
    createBy?: number
    createTime?: number
    updateBy?: number
    updateTime?: number
}

// 录像记录接口
export interface CameraRecord {
    id?: number
    deviceId: number
    recordType?: RecordType
    startTime?: number
    endTime?: number
    duration?: number
    filePath?: string
    fileSize?: number
    cloudUrl?: string
    status?: RecordStatus
    createBy?: number
    createTime?: number
}

// 截图记录接口
export interface CameraSnapshot {
    id?: number
    deviceId: number
    captureTime?: number
    filePath?: string
    cloudUrl?: string
    thumbnail?: string
    createBy?: number
    createTime?: number
}

// 分页参数
export interface PageParams {
    pageNum?: number
    pageSize?: number
    [key: string]: any
}

// 分页结果
export interface PageResult<T> {
    records: T[]
    total: number
    size: number
    current: number
    pages: number
}

// ==================== 设备管理接口 ====================

/**
 * 分页查询设备列表
 */
export function getCameraPage(params: PageParams): Promise<PageResult<CameraDevice>> {
    return cameraRequest.get({
        url: '/adminapi/camera/device/page',
        data: params
    })
}

/**
 * 获取设备列表
 */
export function getCameraList(): Promise<CameraDevice[]> {
    return cameraRequest.get({
        url: '/adminapi/camera/device/list'
    })
}

/**
 * 获取收藏设备
 */
export function getCameraFavorites(): Promise<CameraDevice[]> {
    return cameraRequest.get({
        url: '/adminapi/camera/device/favorites'
    })
}

/**
 * 获取设备详情
 */
export function getCameraDetail(id: number): Promise<CameraDevice> {
    return cameraRequest.get({
        url: `/adminapi/camera/device/${id}`
    })
}

/**
 * 新增设备
 */
export function addCamera(data: Partial<CameraDevice>): Promise<boolean> {
    return cameraRequest.post({
        url: '/adminapi/camera/device',
        data
    })
}

/**
 * 修改设备
 */
export function updateCamera(data: Partial<CameraDevice>): Promise<boolean> {
    return cameraRequest.put({
        url: '/adminapi/camera/device',
        data
    })
}

/**
 * 删除设备
 */
export function deleteCamera(id: number): Promise<boolean> {
    return cameraRequest.delete({
        url: `/adminapi/camera/device/${id}`
    })
}

/**
 * 检查设备编号是否存在
 */
export function checkDeviceCode(deviceCode: string, excludeId?: number): Promise<boolean> {
    return cameraRequest.get({
        url: '/adminapi/camera/device/check',
        data: { deviceCode, excludeId }
    })
}

/**
 * 更新设备状态
 * 后端 @RequestParam 接收，参数须拼在 URL query 上（PUT 的 data 会作为请求体）
 */
export function updateCameraStatus(id: number, status: CameraStatus): Promise<boolean> {
    return cameraRequest.put({
        url: `/adminapi/camera/device/status/${id}?status=${status}`
    })
}

// ==================== 设备发现 ====================

// 局域网发现的设备
export interface DiscoveredCamera {
    ipAddress?: string
    port?: number
    brand?: string
    online?: boolean
    isAdded?: boolean
    deviceId?: number
    deviceName?: string
}

/**
 * 局域网发现设备（后端真实 TCP 端口探测）
 */
export function discoverCamera(): Promise<DiscoveredCamera[]> {
    return cameraRequest.get({
        url: '/adminapi/camera/device/discover'
    })
}

// ==================== 录像管理接口 ====================

/**
 * 分页查询录像列表
 */
export function getRecordPage(
    params: { deviceId?: number } & PageParams
): Promise<PageResult<CameraRecord>> {
    return cameraRequest.get({
        url: '/adminapi/camera/record/page',
        data: params
    })
}

/**
 * 开始录制
 * 后端 @RequestParam 接收，参数须拼在 URL query 上（POST 的 data 会作为请求体）
 */
export function startRecord(deviceId: number, recordType?: RecordType): Promise<CameraRecord> {
    return cameraRequest.post({
        url: `/adminapi/camera/record/start?deviceId=${deviceId}&recordType=${recordType || RecordType.Manual}`
    })
}

/**
 * 停止录制
 */
export function stopRecord(id: number): Promise<boolean> {
    return cameraRequest.post({
        url: `/adminapi/camera/record/stop/${id}`
    })
}

/**
 * 删除录像
 */
export function deleteRecord(id: number): Promise<boolean> {
    return cameraRequest.delete({
        url: `/adminapi/camera/record/${id}`
    })
}

// ==================== 截图管理接口 ====================

/**
 * 分页查询截图列表
 */
export function getSnapshotPage(
    params: { deviceId?: number } & PageParams
): Promise<PageResult<CameraSnapshot>> {
    return cameraRequest.get({
        url: '/adminapi/camera/snapshot/page',
        data: params
    })
}

/**
 * 保存截图
 * 后端 @RequestParam 接收，参数须拼在 URL query 上（POST 的 data 会作为请求体）
 */
export function saveSnapshot(
    deviceId: number,
    filePath: string,
    thumbnail?: string
): Promise<CameraSnapshot> {
    const query = `deviceId=${deviceId}&filePath=${encodeURIComponent(filePath)}${
        thumbnail ? `&thumbnail=${encodeURIComponent(thumbnail)}` : ''
    }`
    return cameraRequest.post({
        url: `/adminapi/camera/snapshot?${query}`
    })
}

/**
 * 删除截图
 */
export function deleteSnapshot(id: number): Promise<boolean> {
    return cameraRequest.delete({
        url: `/adminapi/camera/snapshot/${id}`
    })
}

export interface WifiInfo {
    SSID: string
    BSSID: string
    secure: boolean
    signalStrength: number
}

export function getWifiList(): Promise<WifiInfo[]> {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN || APP-PLUS
        uni.startWifi({
            success: () => {
                uni.getWifiList({
                    success: (res: any) => {
                        try {
                            const wifiList = res.wifiList || []
                            resolve(
                                wifiList.map((wifi: any) => ({
                                    SSID: wifi.SSID || '',
                                    BSSID: wifi.BSSID || '',
                                    secure: wifi.secure || false,
                                    signalStrength: wifi.signalStrength || 0
                                }))
                            )
                        } catch (e) {
                            reject(new Error('解析WiFi列表失败'))
                        }
                    },
                    fail: (err: any) => reject(new Error(err.errMsg || '获取WiFi列表失败'))
                })
            },
            fail: (err: any) => reject(new Error(err.errMsg || '启动WiFi失败'))
        })
        // #endif
        // #ifndef MP-WEIXIN || APP-PLUS
        reject(new Error('当前平台不支持获取WiFi列表'))
        // #endif
    })
}

export function getConnectedWifi(): Promise<WifiInfo> {
    return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN || APP-PLUS
        uni.startWifi({
            success: () => {
                uni.getConnectedWifi({
                    success: (res: any) => {
                        resolve({
                            SSID: res.wifi?.SSID || '',
                            BSSID: res.wifi?.BSSID || '',
                            secure: res.wifi?.secure || false,
                            signalStrength: res.wifi?.signalStrength || 0
                        })
                    },
                    fail: (err: any) => reject(new Error(err.errMsg || '获取已连接WiFi失败'))
                })
            },
            fail: (err: any) => reject(new Error(err.errMsg || '启动WiFi失败'))
        })
        // #endif
        // #ifndef MP-WEIXIN || APP-PLUS
        reject(new Error('当前平台不支持获取WiFi信息'))
        // #endif
    })
}
