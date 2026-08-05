import { isObject } from '@vue/shared'
import { getToken } from './auth'
import { parseQuery } from 'uniapp-router-next'
import cache from './cache'
import { BACK_URL } from '@/enums/constantEnums'

/**
 * @description 获取元素节点信息（在组件中的元素必须要传ctx）
 * @param  { String } selector 选择器 '.app' | '#app'
 * @param  { Boolean } all 是否多选
 * @param  { ctx } context 当前组件实例
 */
export const getRect = (selector: string, all = false, context?: any) => {
    return new Promise((resolve, reject) => {
        let qurey = uni.createSelectorQuery()
        if (context) {
            qurey = uni.createSelectorQuery().in(context)
        }
        qurey[all ? 'selectAll' : 'select'](selector)
            .boundingClientRect(function (rect) {
                if (all && Array.isArray(rect) && rect.length) {
                    return resolve(rect)
                }
                if (!all && rect) {
                    return resolve(rect)
                }
                reject('找不到元素')
            })
            .exec()
    })
}

/**
 * @description 获取当前页面实例
 */
export function currentPage() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    return currentPage || {}
}

/**
 * @description 平台兼容的 tab 切换：
 * - App 端未配置原生 tabBar，复刻「首页标语」页的 navigateTo 压栈方式模拟 tab 切换：
 *   目标页已在栈中 → navigateBack 回到该页（避免重复压栈，并清理其上的页面）
 *   否则 → navigateTo 压栈（保留返回链，左滑/返回键可回到上一页，而非触发退出应用）
 * - H5 / 小程序端保留原生 tabBar 配置，继续使用 switchTab
 */
export function switchTabCompat(url: string) {
    // #ifdef APP-PLUS
    const stack = getCurrentPages()
    const target = url.split('?')[0]
    const targetIndex = stack.findIndex((page) => '/' + page.route === target)
    if (targetIndex >= 0) {
        const delta = stack.length - 1 - targetIndex
        if (delta > 0) {
            uni.navigateBack({ delta })
        }
        return
    }
    uni.navigateTo({ url })
    // #endif
    // #ifndef APP-PLUS
    uni.switchTab({ url })
    // #endif
}

/**
 * @description 登录拦截校验：
 * - 已登录 → 返回 true，放行
 * - 未登录 → 记录回跳地址到 BACK_URL 并跳转登录页，返回 false（调用方应中止跳转）
 * @param targetPath 登录成功后希望回跳的页面路径（tab 页或普通页）
 */
export function requireLogin(targetPath?: string): boolean {
    if (getToken()) return true
    if (targetPath) {
        cache.set(BACK_URL, targetPath)
    }
    uni.navigateTo({ url: '/pages/login/login' })
    return false
}

/**
 * @description 后台选择链接专用跳转
 */
interface Link {
    path: string
    name?: string
    type: string
    canTab: boolean
    query?: Record<string, any>
}

export enum LinkTypeEnum {
    'SHOP_PAGES' = 'shop',
    'CUSTOM_LINK' = 'custom',
    'MINI_PROGRAM' = 'mini_program',
    'WEBVIEW' = 'webview',
    'PHONE' = 'phone',
    'COPY' = 'copy'
}

export function navigateTo(
    link: Link,
    navigateType: 'navigateTo' | 'switchTab' | 'reLaunch' = 'navigateTo'
) {
    // H5外链
    if (link.type === LinkTypeEnum.WEBVIEW) {
        const url = encodeURIComponent(link.path)
        uni.navigateTo({ url: `/pages/webview/webview?url=${url}` })
        return
    }

    // 拨打电话
    if (link.type === LinkTypeEnum.PHONE) {
        uni.makePhoneCall({ phoneNumber: link.phoneNumber || link.path })
        return
    }

    // 复制内容
    if (link.type === LinkTypeEnum.COPY) {
        uni.setClipboardData({
            data: link.content || link.path,
            success: () => {
                uni.showToast({ title: '已复制' })
            }
        })
        return
    }

    // 小程序跳转
    if (link.type === LinkTypeEnum.MINI_PROGRAM) {
        navigateToMiniProgram(link)
        return
    }

    const url = link?.query ? `${link.path}?${objectToQuery(link?.query)}` : link.path

    ;(navigateType == 'switchTab' || link.canTab) && switchTabCompat(url)
    navigateType == 'navigateTo' && uni.navigateTo({ url })
    navigateType == 'reLaunch' && uni.reLaunch({ url })
}

/**
 * @description 小程序跳转
 * @param link 跳转信息，由装修数据进行输入
 */
export function navigateToMiniProgram(link: Link) {
    const query = link.query
    // #ifdef H5
    window.open(
        `weixin://dl/business/?appid=${query?.appId}&path=${query?.path}&env_version=${
            query?.env_version
        }&query=${encodeURIComponent(query?.query)}`
    )
    // #endif
    // #ifdef MP
    uni.navigateToMiniProgram({
        appId: query?.appId,
        path: query?.path,
        extraData: parseQuery(query?.query),
        envVersion: query?.env_version
    })
    // #endif
}

/**
 * @description 将一个数组分成几个同等长度的数组
 * @param  { Array } array[分割的原数组]
 * @param  { Number } size[每个子数组的长度]
 */
export const sliceArray = (array: any[], size: number) => {
    const result = []
    for (let x = 0; x < Math.ceil(array.length / size); x++) {
        const start = x * size
        const end = start + size
        result.push(array.slice(start, end))
    }
    return result
}

/**
 * @description 是否为空
 * @param {unknown} value
 * @return {Boolean}
 */
export const isEmpty = (value: unknown) => {
    return value == null && typeof value == 'undefined'
}

/**
 * @description 对象格式化为Query语法
 * @param { Object } params
 * @return {string} Query语法
 */
export function objectToQuery(params: Record<string, any>): string {
    let query = ''
    for (const props of Object.keys(params)) {
        const value = params[props]
        const part = encodeURIComponent(props) + '='
        if (!isEmpty(value)) {
            console.log(encodeURIComponent(props), isObject(value))
            if (isObject(value)) {
                for (const key of Object.keys(value)) {
                    if (!isEmpty(value[key])) {
                        const params = props + '[' + key + ']'
                        const subPart = encodeURIComponent(params) + '='
                        query += subPart + encodeURIComponent(value[key]) + '&'
                    }
                }
            } else {
                query += part + encodeURIComponent(value) + '&'
            }
        }
    }
    return query.slice(0, -1)
}

/**
 * @description 添加单位
 * @param {String | Number} value 值 100
 * @param {String} unit 单位 px em rem
 */
export const addUnit = (value: string | number, unit = 'rpx') => {
    return !Object.is(Number(value), NaN) ? `${value}${unit}` : value
}

/**
 * @description 格式化输出价格
 * @param  { string } price 价格
 * @param  { string } take 小数点操作
 * @param  { string } prec 小数位补
 */
export function formatPrice({ price, take = 'all', prec = undefined }: any) {
    const priceParts = (price + '').split('.')
    const integer = priceParts[0]
    let decimals = priceParts[1] || ''

    // 小数位补
    if (prec !== undefined) {
        const LEN = decimals.length
        for (let i = prec - LEN; i > 0; --i) decimals += '0'
        decimals = decimals.substr(0, prec)
    }

    switch (take) {
        case 'int':
            return integer
        case 'dec':
            return decimals
        case 'all':
            return integer + '.' + decimals
    }
}

/**
 * @description 组合异步任务
 * @param  { string } task 异步任务
 */

export function series(...task: Array<(_arg: any) => any>) {
    return function (): Promise<any> {
        return new Promise((resolve, reject) => {
            const iteratorTask = task.values()
            const next = (res?: any) => {
                const nextTask = iteratorTask.next()
                if (nextTask.done) {
                    resolve(res)
                } else {
                    Promise.resolve(nextTask.value(res)).then(next).catch(reject)
                }
            }
            next()
        })
    }
}
