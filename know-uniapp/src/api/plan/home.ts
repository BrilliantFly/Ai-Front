import request from '@/utils/request'

export function getHomeConfig(params) {
    return request.get({ url: '/plan/home/config', data: params })
}

export function getCurrentSlogan() {
    return request.get({ url: '/plan/slogan/current' })
}
