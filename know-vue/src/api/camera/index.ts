import { service } from '@/utils/axios'

// ==================== 类型定义 ====================

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
  status?: number // 0=离线, 1=在线
  position?: string
  remark?: string
  userId?: number
  createBy?: number
  createTime?: number
  updateBy?: number
  updateTime?: number
}

export interface CameraRecord {
  id?: number
  deviceId: number
  recordType?: number // 1=手动, 2=定时, 3=移动侦测
  startTime?: number
  endTime?: number
  duration?: number
  filePath?: string
  fileSize?: number
  cloudUrl?: string
  status?: number // 0=录制中, 1=已完成, 2=已上传
  createBy?: number
  createTime?: number
}

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

export interface CameraFavorite {
  id: number
  deviceId: number
  userId: number
  sort: number
  createTime: number
}

// ==================== 设备管理 ====================

export function getCameraPage(params: { pageNum?: number; pageSize?: number; deviceName?: string; [key: string]: any }) {
  return service({
    url: '/adminapi/camera/device/page',
    method: 'get',
    params
  })
}

export function getCameraList() {
  return service({
    url: '/adminapi/camera/device/list',
    method: 'get'
  })
}

export function getCameraFavorites() {
  return service({
    url: '/adminapi/camera/device/favorites',
    method: 'get'
  })
}

export function getCameraDetail(id: number) {
  return service({
    url: `/adminapi/camera/device/${id}`,
    method: 'get'
  })
}

export function addCamera(data: Partial<CameraDevice>) {
  return service({
    url: '/adminapi/camera/device',
    method: 'post',
    data
  })
}

export function updateCamera(data: Partial<CameraDevice>) {
  return service({
    url: '/adminapi/camera/device',
    method: 'put',
    data
  })
}

export function deleteCamera(id: number) {
  return service({
    url: `/adminapi/camera/device/${id}`,
    method: 'delete'
  })
}

export function checkDeviceCode(deviceCode: string, excludeId?: number) {
  return service({
    url: '/adminapi/camera/device/check',
    method: 'get',
    params: { deviceCode, excludeId }
  })
}

export function updateCameraStatus(id: number, status: number) {
  return service({
    url: `/camera/device/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// ==================== 录像管理 ====================

export function getRecordPage(params: { deviceId?: number; pageNum?: number; pageSize?: number }) {
  return service({
    url: '/adminapi/camera/record/page',
    method: 'get',
    params
  })
}

export function getRecordDetail(id: number) {
  return service({
    url: `/camera/record/${id}`,
    method: 'get'
  })
}

export function startRecord(deviceId: number, recordType?: number) {
  return service({
    url: '/adminapi/camera/record/start',
    method: 'post',
    params: { deviceId, recordType: recordType || 1 }
  })
}

export function stopRecord(id: number) {
  return service({
    url: `/camera/record/stop/${id}`,
    method: 'post'
  })
}

export function deleteRecord(id: number) {
  return service({
    url: `/camera/record/${id}`,
    method: 'delete'
  })
}

export function deleteRecordBatch(ids: number[]) {
  return service({
    url: '/adminapi/camera/record/batch',
    method: 'delete',
    data: ids
  })
}

export function getRecordingByDevice(deviceId: number) {
  return service({
    url: '/adminapi/camera/record/recording',
    method: 'get',
    params: { deviceId }
  })
}

// ==================== 截图管理 ====================

export function getSnapshotPage(params: { deviceId?: number; pageNum?: number; pageSize?: number }) {
  return service({
    url: '/adminapi/camera/snapshot/page',
    method: 'get',
    params
  })
}

export function getSnapshotDetail(id: number) {
  return service({
    url: `/camera/snapshot/${id}`,
    method: 'get'
  })
}

export function getLatestSnapshot(deviceId: number) {
  return service({
    url: '/adminapi/camera/snapshot/latest',
    method: 'get',
    params: { deviceId }
  })
}

export function saveSnapshot(deviceId: number, filePath: string, thumbnail?: string) {
  return service({
    url: '/adminapi/camera/snapshot',
    method: 'post',
    params: { deviceId, filePath, thumbnail }
  })
}

export function deleteSnapshot(id: number) {
  return service({
    url: `/camera/snapshot/${id}`,
    method: 'delete'
  })
}

export function deleteSnapshotBatch(ids: number[]) {
  return service({
    url: '/adminapi/camera/snapshot/batch',
    method: 'delete',
    data: ids
  })
}

// ==================== 收藏管理 ====================

export function getFavoriteList() {
  return service({
    url: '/adminapi/camera/favorite/list',
    method: 'get'
  })
}

export function checkFavorite(deviceId: number) {
  return service({
    url: '/adminapi/camera/favorite/check',
    method: 'get',
    params: { deviceId }
  })
}

export function addFavorite(deviceId: number) {
  return service({
    url: '/adminapi/camera/favorite',
    method: 'post',
    params: { deviceId }
  })
}

export function removeFavorite(deviceId: number) {
  return service({
    url: '/adminapi/camera/favorite',
    method: 'delete',
    params: { deviceId }
  })
}

export function toggleFavorite(deviceId: number) {
  return service({
    url: '/adminapi/camera/favorite/toggle',
    method: 'post',
    params: { deviceId }
  })
}
