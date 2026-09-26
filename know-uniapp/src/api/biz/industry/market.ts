import request from '@/utils/request'
import type { PageResult } from './index'

/**
 * 行业调研模块 API - 行业市场（统一走 /api/biz/industry/market/*）
 * 对应后端：BizIndustryMarketController
 * 注意：
 * 1. 市场与行业多对多（industryIds 数组）；编辑提交走 PUT /market/{industryId}，
 *    路径参数取 industryIds[0] || 0，实际主键在 body.id
 * 2. 市场规模/增长潜力在 industry 域；此处含商业模式九要素 + 财务指标
 */

/** 行业市场（biz_industry_market） */
export interface BizIndustryMarket {
    id: number | string
    /** 需求与商机 */
    industryIds?: number[]
    industryNames?: string[]
    demand?: string
    opportunity?: string
    /** 商业（商业模式九要素） */
    valueProposition?: string
    customerSegment?: string
    channel?: string
    customerRelation?: string
    revenueSource?: string
    keyResource?: string
    keyPartner?: string
    keyActivity?: string
    costStructure?: string
    /** 价值评价与分配 */
    valueEvaluation?: string
    valueDistribution?: string
    /** 竞争手段 */
    competitionMethod?: string
    /** 营销（推广引流） */
    promoChannel?: string
    /** 动态/价值/把握 */
    dynamicInfo?: string
    valueInfo?: string
    strategy?: string
    /** 财务指标 */
    grossProfit?: number
    grossMargin?: number
    netProfit?: number
    netMargin?: number
    createTime?: number | string
}

/** 市场分页参数 */
export interface MarketPageParams {
    pageNum: number
    pageSize: number
    industryId?: number
    /** 关键字（匹配 市场需求/商机） */
    keyword?: string
}

/* ==================== API 函数 ==================== */

/** 市场分页（列表页） */
export function getMarketPage(params: MarketPageParams) {
    return request.get<PageResult<BizIndustryMarket>>({
        url: '/biz/industry/market/page',
        data: params as any
    })
}

/** 按行业取市场（行业全景详情 tab 可复用；无则返回 null/空对象） */
export function getMarketByIndustryId(industryId: number | string) {
    return request.get<BizIndustryMarket | null>({ url: `/biz/industry/market/${industryId}` })
}

/** 按行业取市场列表（可返回多条） */
export function getMarketsByIndustryId(industryId: number | string) {
    return request.get<BizIndustryMarket[]>({
        url: '/biz/industry/market/list',
        data: { industryId } as any
    })
}

/** 新增市场 */
export function createMarket(data: Record<string, any>) {
    return request.post<number | string>({ url: '/biz/industry/market', data })
}

/** 保存市场（编辑：PUT /market/{industryId}，industryId 取 industryIds[0] || 0） */
export function saveMarket(industryId: number | string, data: Record<string, any> & { id: number | string }) {
    return request.put<boolean>({ url: `/biz/industry/market/${industryId}`, data })
}

/** 删除市场 */
export function deleteMarket(id: number | string) {
    return request.delete<boolean>({ url: `/biz/industry/market/${id}` })
}