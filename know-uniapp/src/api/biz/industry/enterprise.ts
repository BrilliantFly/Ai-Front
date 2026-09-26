import request from '@/utils/request'
import type { PageResult } from './index'

/**
 * 行业调研模块 API - 行业企业（统一走 /api/biz/industry/enterprise/*）
 * 对应后端：BizIndustryEnterpriseController
 * 注意：企业分页接口是 /list（非 /page），与行业不同，勿统一
 */

/** 行业企业（biz_industry_enterprise） */
export interface BizIndustryEnterprise {
    id: number | string
    /** 关联行业（列表返回 industryNames；提交用 industryIds） */
    industryIds?: number[]
    industryNames?: string[]
    /** 关联产品（列表返回 productNames；提交用 productIds） */
    productIds?: number[]
    productNames?: string[]
    /** 企业与平台 */
    enterpriseType?: string
    enterpriseName?: string
    /** 工商信息 */
    establishedDate?: string
    registeredCapital?: string
    paidCapital?: string
    /** 规模（大型/中型/小型） */
    scale?: string
    insuredCount?: number
    /** 是否上市（1 是 / 0 否） */
    isListed?: number
    /** 经营与技术 */
    mainBusiness?: string
    coreTechnology?: string
    products?: string
    marketPerformance?: string
    /** 竞争 */
    competitors?: string
    advantage?: string
    disadvantage?: string
    /** 上下游产业链 */
    upstreamChain?: string
    midstreamChain?: string
    downstreamChannel?: string
    downstreamMarketing?: string
    /** 动态/价值/资源/把握 */
    dynamicInfo?: string
    valueInfo?: string
    industryResources?: string
    strategy?: string
    createTime?: number | string
}

/** 企业分页参数 */
export interface EnterprisePageParams {
    pageNum: number
    pageSize: number
    industryId?: number
    enterpriseName?: string
    isListed?: number
}

/* ==================== API 函数 ==================== */

/** 企业分页（列表页；注意接口路径为 /list） */
export function getEnterprisePage(params: EnterprisePageParams) {
    return request.get<PageResult<BizIndustryEnterprise>>({
        url: '/biz/industry/enterprise/list',
        data: params as any
    })
}

/** 企业详情 */
export function getEnterpriseDetail(id: number | string) {
    return request.get<BizIndustryEnterprise>({ url: `/biz/industry/enterprise/${id}` })
}

/** 新增企业 */
export function createEnterprise(data: Record<string, any>) {
    return request.post<number | string>({ url: '/biz/industry/enterprise', data })
}

/** 更新企业（enterpriseType 数组需先 join(',') 再提交） */
export function updateEnterprise(data: Record<string, any> & { id: number | string }) {
    return request.put<boolean>({ url: '/biz/industry/enterprise', data })
}

/** 删除企业 */
export function deleteEnterprise(id: number | string) {
    return request.delete<boolean>({ url: `/biz/industry/enterprise/${id}` })
}

/** 设置企业关联行业（全量覆盖） */
export function setEnterpriseIndustries(id: number | string, industryIds: number[]) {
    return request.post<boolean>({
        url: `/biz/industry/enterprise/${id}/industries`,
        data: industryIds
    })
}

/** 设置企业关联产品（全量覆盖） */
export function setEnterpriseProducts(id: number | string, productIds: number[]) {
    return request.post<boolean>({
        url: `/biz/industry/enterprise/${id}/products`,
        data: productIds
    })
}