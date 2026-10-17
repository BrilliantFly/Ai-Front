import { merge } from 'lodash-es'
import { isFunction } from '@vue/shared'
import { HttpRequestOptions, RequestConfig, RequestOptions, UploadFileOption } from './type'
import { RequestErrMsgEnum, RequestMethodsEnum } from '@/enums/requestEnums'
import requestCancel from './cancel'

export default class HttpRequest {
    private readonly options: HttpRequestOptions
    constructor(options: HttpRequestOptions) {
        this.options = options
    }
    /**
     * @description 重新请求
     */
    retryRequest(options: RequestOptions, config: RequestConfig) {
        const { retryCount, retryTimeout } = config
        if (!retryCount || options.method?.toUpperCase() == RequestMethodsEnum.POST) {
            return Promise.reject()
        }
        uni.showLoading({ title: '加载中...' })
        config.hasRetryCount = config.hasRetryCount ?? 0
        if (config.hasRetryCount >= retryCount) {
            return Promise.reject()
        }
        config.hasRetryCount++
        config.requestHooks.requestInterceptorsHook = (options) => options
        return new Promise((resolve) => setTimeout(resolve, retryTimeout))
            .then(() => this.request(options, config))
            .finally(() => uni.hideLoading())
    }
    /**
     * @description get请求
     */
    get<T = any>(options: RequestOptions, config?: Partial<RequestConfig>): Promise<T> {
        return this.request({ ...options, method: RequestMethodsEnum.GET }, config)
    }

    /**
     * @description post请求
     */
    post<T = any>(options: RequestOptions, config?: Partial<RequestConfig>): Promise<T> {
        return this.request({ ...options, method: RequestMethodsEnum.POST }, config)
    }

    /**
     * @description put请求
     */
    put<T = any>(options: RequestOptions, config?: Partial<RequestConfig>): Promise<T> {
        return this.request({ ...options, method: RequestMethodsEnum.PUT }, config)
    }

    /**
     * @description delete请求
     */
    delete<T = any>(options: RequestOptions, config?: Partial<RequestConfig>): Promise<T> {
        return this.request({ ...options, method: RequestMethodsEnum.DELETE }, config)
    }

    /**
     * @description 上传图片
     */
    uploadFile(options: UploadFileOption, config?: Partial<RequestConfig>) {
        let mergeOptions: RequestOptions = merge({}, this.options.requestOptions, options)
        const mergeConfig: RequestConfig = merge({}, this.options, config)
        const { requestInterceptorsHook, responseInterceptorsHook, responseInterceptorsCatchHook } =
            mergeConfig.requestHooks || {}
        if (requestInterceptorsHook && isFunction(requestInterceptorsHook)) {
            mergeOptions = requestInterceptorsHook(mergeOptions, mergeConfig)
        }
        return new Promise((resolve, reject) => {
            uni.uploadFile({
                ...mergeOptions,
                success: async (response) => {
                    if (response.statusCode == 200) {
                        try {
                            response.data = JSON.parse(response.data)
                        } catch (error) {
                            // 服务端返回非 JSON（如网关错误页）时不能抛异常，否则会中断上传流程
                            reject({ errMsg: '上传响应解析失败', data: response.data })
                            return
                        }
                        if (responseInterceptorsHook && isFunction(responseInterceptorsHook)) {
                            try {
                                response = await responseInterceptorsHook(response, mergeConfig)
                                resolve(response)
                            } catch (error) {
                                reject(error)
                            }
                            return
                        }
                        resolve(response)
                    } else {
                        // 非 200 也要结束 Promise，否则上传页会一直停留在“上传中”
                        reject({ errMsg: `上传失败（${response.statusCode}）`, data: response.data })
                    }
                },
                fail: async (err) => {
                    if (
                        responseInterceptorsCatchHook &&
                        isFunction(responseInterceptorsCatchHook)
                    ) {
                        reject(await responseInterceptorsCatchHook(mergeOptions, err))
                        return
                    }
                    reject(err)
                }
            })
        })
    }
    /**
     * @description 请求函数
     */
    async request(options: RequestOptions, config?: Partial<RequestConfig>): Promise<any> {
        let mergeOptions: RequestOptions = merge({}, this.options.requestOptions, options)
        const mergeConfig: RequestConfig = merge({}, this.options, config)
        const { requestInterceptorsHook, responseInterceptorsHook, responseInterceptorsCatchHook } =
            mergeConfig.requestHooks || {}
        if (requestInterceptorsHook && isFunction(requestInterceptorsHook)) {
            mergeOptions = requestInterceptorsHook(mergeOptions, mergeConfig)
        }
        return new Promise((resolve, reject) => {
            const requestTask = uni.request({
                ...mergeOptions,
                async success(response) {
                    if (responseInterceptorsHook && isFunction(responseInterceptorsHook)) {
                        try {
                            response = await responseInterceptorsHook(response, mergeConfig)
                            resolve(response)
                        } catch (error) {
                            reject(error)
                        }
                        return
                    }
                    resolve(response)
                },
                fail: async (err) => {
                    // 防重复请求机制触发的取消：必须让 Promise 结束，
                    // 否则调用方的 await 会永久挂起，页面一直停在“加载中”。
                    if (err.errMsg == RequestErrMsgEnum.ABORT) {
                        reject(err)
                        return
                    }
                    if (err.errMsg == RequestErrMsgEnum.TIMEOUT) {
                        this.retryRequest(mergeOptions, mergeConfig)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err))
                        return
                    }

                    if (
                        responseInterceptorsCatchHook &&
                        isFunction(responseInterceptorsCatchHook)
                    ) {
                        reject(await responseInterceptorsCatchHook(mergeOptions, err))
                        return
                    }
                    reject(err)
                },
                complete(err) {
                    if (err.errMsg !== RequestErrMsgEnum.ABORT) {
                        requestCancel.remove(options.url)
                    }
                }
            })
            const { ignoreCancel } = mergeConfig
            !ignoreCancel && requestCancel.add(options.url, requestTask)
        })
    }
}
