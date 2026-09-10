import { service } from '@/utils/axios'

export function getPlanInfoPage(params) {
  return service({
    url: '/adminapi/plan/info/page',
    method: 'get',
    params
  })
}

export function getPlanInfoListByQuadrant(quadrantId, params) {
  return service({
    url: `/adminapi/plan/info/quadrant/${quadrantId}`,
    method: 'get',
    params
  })
}

export function getPlanInfoDetail(id) {
  return service({
    url: `/adminapi/plan/info/${id}`,
    method: 'get'
  })
}

export function addPlanInfo(data) {
  return service({
    url: '/adminapi/plan/info',
    method: 'post',
    data
  })
}

export function updatePlanInfo(data) {
  return service({
    url: '/adminapi/plan/info',
    method: 'put',
    data
  })
}

export function deletePlanInfo(id) {
  return service({
    url: `/adminapi/plan/info/${id}`,
    method: 'delete'
  })
}

export function updatePlanInfoProgress(id, progress) {
  return service({
    url: `/adminapi/plan/info/${id}/progress`,
    method: 'put',
    params: { progress }
  })
}

export function toScheduleFromPlan(id, startTime, endTime) {
  return service({
    url: `/adminapi/plan/info/${id}/to-schedule`,
    method: 'post',
    params: { startTime, endTime }
  })
}