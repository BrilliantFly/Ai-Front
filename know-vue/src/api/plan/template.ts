import { service } from '@/utils/axios'

export function getTemplateList(params) {
  return service({
    url: '/adminapi/plan/template/list',
    method: 'get',
    params
  })
}

export function getTemplateDetail(id) {
  return service({
    url: `/adminapi/plan/template/${id}`,
    method: 'get'
  })
}

export function addTemplate(data) {
  return service({
    url: '/adminapi/plan/template',
    method: 'post',
    data
  })
}

export function updateTemplate(data) {
  return service({
    url: '/adminapi/plan/template',
    method: 'put',
    data
  })
}

export function deleteTemplate(id) {
  return service({
    url: `/adminapi/plan/template/${id}`,
    method: 'delete'
  })
}

export function getEventTemplateList(params) {
  return service({
    url: '/adminapi/plan/event-template/list',
    method: 'get',
    params
  })
}

export function getEventTemplateDetail(id) {
  return service({
    url: `/adminapi/plan/event-template/${id}`,
    method: 'get'
  })
}

export function addEventTemplate(data) {
  return service({
    url: '/adminapi/plan/event-template',
    method: 'post',
    data
  })
}

export function updateEventTemplate(data) {
  return service({
    url: '/adminapi/plan/event-template',
    method: 'put',
    data
  })
}

export function deleteEventTemplate(id) {
  return service({
    url: `/adminapi/plan/event-template/${id}`,
    method: 'delete'
  })
}

export function getHabitTemplateList(params) {
  return service({
    url: '/adminapi/plan/habit-template/list',
    method: 'get',
    params
  })
}

export function getHabitTemplateDetail(id) {
  return service({
    url: `/adminapi/plan/habit-template/${id}`,
    method: 'get'
  })
}

export function addHabitTemplate(data) {
  return service({
    url: '/adminapi/plan/habit-template',
    method: 'post',
    data
  })
}

export function updateHabitTemplate(data) {
  return service({
    url: '/adminapi/plan/habit-template',
    method: 'put',
    data
  })
}

export function deleteHabitTemplate(id) {
  return service({
    url: `/adminapi/plan/habit-template/${id}`,
    method: 'delete'
  })
}

// Get all templates (for parent selector dropdown) - flat list, no pagination
export function getAllTemplates(params?) {
  return service({ url: '/adminapi/plan/template/list', method: 'get', params: { pageNum: 1, pageSize: 200, ...params } })
}

// Get template tree (for detail preview)
export function getTemplateTree(id) {
  return service({ url: `/adminapi/plan/template/${id}/tree`, method: 'get' })
}

// Get children of a template
export function getTemplateChildren(id) {
  return service({ url: `/adminapi/plan/template/${id}/children`, method: 'get' })
}

// Get habit template list (for multi-select picker)
export function getHabitTemplateListAll(params?) {
  return service({ url: '/adminapi/plan/habit-template/list', method: 'get', params: { pageNum: 1, pageSize: 200, ...params } })
}

// Get event template list (for multi-select picker)
export function getEventTemplateListAll(params?) {
  return service({ url: '/adminapi/plan/event-template/list', method: 'get', params: { pageNum: 1, pageSize: 200, ...params } })
}

export function useTemplateApi(id: number, data: any) {
  return service({
    url: `/adminapi/plan/template/${id}/use`,
    method: 'post',
    data
  })
}

export function generateFromPlan(planId: number, data: any) {
  return service({
    url: `/adminapi/plan/template/from-plan/${planId}`,
    method: 'post',
    data
  })
}

export function getPlanList(params?) {
  return service({
    url: '/adminapi/plan/info/list',
    method: 'get',
    params: { pageNum: 1, pageSize: 200, ...params }
  })
}