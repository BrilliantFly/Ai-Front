import request from '@/utils/request'

export function getHabitTemplateList(params) {
    return request.get({ url: '/plan/habit-template/list', data: params })
}

export function getHotHabitTemplates(params) {
    return request.get({ url: '/plan/habit-template/hot', data: params })
}

export function getHabitTemplateDetail(id) {
    return request.get({ url: `/plan/habit-template/${id}` })
}

export function createHabitTemplate(data) {
    return request.post({ url: '/plan/habit-template', data })
}

export function updateHabitTemplate(data) {
    return request.put({ url: '/plan/habit-template', data })
}

export function deleteHabitTemplate(id) {
    return request.delete({ url: `/plan/habit-template/${id}` })
}
