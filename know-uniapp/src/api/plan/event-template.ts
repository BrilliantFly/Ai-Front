import request from '@/utils/request'

export function getEventTemplateList(params) {
    return request.get({ url: '/plan/event-template/list', data: params })
}

export function getHotEventTemplates(params) {
    return request.get({ url: '/plan/event-template/hot', data: params })
}

export function getEventTemplateDetail(id) {
    return request.get({ url: `/plan/event-template/${id}` })
}

export function createEventTemplate(data) {
    return request.post({ url: '/plan/event-template', data })
}

export function updateEventTemplate(data) {
    return request.put({ url: '/plan/event-template', data })
}

export function deleteEventTemplate(id) {
    return request.delete({ url: `/plan/event-template/${id}` })
}
