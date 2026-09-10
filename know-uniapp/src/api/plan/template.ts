import request from '@/utils/request'

export function getTemplateList(params) {
    return request.get({ url: '/plan/template/list', data: params })
}

export function getHotTemplates(params) {
    return request.get({ url: '/plan/template/hot', data: params })
}

export function getTemplateDetail(id) {
    return request.get({ url: `/plan/template/${id}` })
}

export function getTemplateChildren(id) {
    return request.get({ url: `/plan/template/${id}/children` })
}

export function createTemplate(data) {
    return request.post({ url: '/plan/template', data })
}

export function updateTemplate(data) {
    return request.put({ url: '/plan/template', data })
}

export function deleteTemplate(id) {
    return request.delete({ url: `/plan/template/${id}` })
}

export function useTemplate(data) {
    return request.post({ url: '/plan/template/use', data })
}

export function useInPlan(data) {
    return request.post({ url: '/plan/template/use-in-plan', data })
}

export function generateTemplateFromPlan(planId, data) {
    return request.post({ url: `/plan/template/from-plan/${planId}`, data })
}
