import request from '@/utils/request'
import type { PageResult } from './index'

/**
 * 行业调研模块 API - 行业产品（统一走 /api/biz/industry/product/*）
 * 对应后端：BizIndustryProductController
 * 注意：产品分页接口是 /list（非 /page），与行业不同，勿统一
 */

/** 行业产品（biz_industry_product） */
export interface BizIndustryProduct {
    id: number | string
    /** 归属与分类 */
    industryIds?: number[]
    industryNames?: string[]
    category?: string
    /** 产品本体 */
    productName?: string
    productConcept?: string
    /** 消费者洞察 */
    consumerInsight?: string
    benefitPromise?: string
    supportPoint?: string
    /** 产品细分（四层） */
    coreProduct?: string
    basicProduct?: string
    additionalProduct?: string
    potentialProduct?: string
    /** 生命周期（产品研发/引入期/成长期/饱和期/衰退期） */
    lifeCycle?: string
    /** 上下游产业链 */
    upstreamChain?: string
    midstreamChain?: string
    downstreamChannel?: string
    downstreamMarketing?: string
    /** 动态/价值/把握 */
    dynamicInfo?: string
    valueInfo?: string
    strategy?: string
    createTime?: number | string
}

/** 产品分页参数 */
export interface ProductPageParams {
    pageNum: number
    pageSize: number
    industryId?: number
    productName?: string
}

/* ==================== API 函数 ==================== */

/** 产品分页（列表页；注意接口路径为 /list） */
export function getProductPage(params: ProductPageParams) {
    return request.get<PageResult<BizIndustryProduct>>({
        url: '/biz/industry/product/list',
        data: params as any
    })
}

/** 产品详情（远程数据源：编辑回显） */
export function getProductDetail(id: number | string) {
    return request.get<BizIndustryProduct>({ url: `/biz/industry/product/${id}` })
}

/** 新增产品 */
export function createProduct(data: Record<string, any>) {
    return request.post<number | string>({ url: '/biz/industry/product', data })
}

/** 更新产品 */
export function updateProduct(data: Record<string, any> & { id: number | string }) {
    return request.put<boolean>({ url: '/biz/industry/product', data })
}

/** 删除产品 */
export function deleteProduct(id: number | string) {
    return request.delete<boolean>({ url: `/biz/industry/product/${id}` })
}

/** 设置产品关联行业（全量覆盖） */
export function setProductIndustries(id: number | string, industryIds: number[]) {
    return request.post<boolean>({
        url: `/biz/industry/product/${id}/industries`,
        data: industryIds
    })
}