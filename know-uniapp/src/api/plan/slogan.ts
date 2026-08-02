import request from '@/utils/request'

/**
 * 分页查询首页标语
 */
export function getSloganPage(params) {
    return request.get({ url: '/plan/slogan/page', data: params })
}

/**
 * 查询启用标语列表（首页轮播用，按 sort 升序）
 */
export function getSloganList(params) {
    return request.get({ url: '/plan/slogan/list', data: params })
}

/**
 * 新增首页标语
 */
export function addSlogan(data) {
    return request.post({ url: '/plan/slogan', data })
}

/**
 * 修改首页标语
 */
export function updateSlogan(data) {
    return request.put({ url: '/plan/slogan', data })
}

/**
 * 删除首页标语
 */
export function deleteSlogan(id) {
    return request.delete({ url: `/plan/slogan/${id}` })
}
