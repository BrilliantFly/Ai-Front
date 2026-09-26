import request from '@/utils/request'

/**
 * 行业调研模块 API - 行业（统一走 /api/biz/industry/*）
 * 对应后端：BizIndustryController（市场与行业调研子域）
 * 行业详情 GET /{id} 为全景聚合：{ ...industry, products[], enterprises[], market }
 */

/* ==================== 类型定义（对齐后端 BizIndustry 实体） ==================== */

/** 行业（biz_industry） */
export interface BizIndustry {
    id: number | string
    /** 基础信息 */
    industryName?: string
    industryCode?: string
    /** 标签（逗号分隔） */
    tags?: string
    /** 可见性（1 可见 / 0 隐藏） */
    visibility?: number
    sort?: number
    /** 行业定义 */
    definition?: string
    /** 技术 */
    technology?: string
    /** 上下游产业链 */
    upstreamChain?: string
    midstreamChain?: string
    downstreamChannel?: string
    downstreamMarketing?: string
    /** 行业发展概况 */
    developmentOverview?: string
    marketSize?: string
    growthPotential?: string
    /** 动态信息 */
    dynamicInfo?: string
    /** 价值信息 */
    valueInfo?: string
    /** 行业资源 */
    industryResources?: string
    /** 如何把握 */
    strategy?: string
    /** 财务指标 */
    grossProfit?: number
    grossMargin?: number
    netProfit?: number
    netMargin?: number
    createTime?: number | string
}

/** 行业全景详情（GET /{id} 聚合返回） */
export interface BizIndustryDetail extends BizIndustry {
    products?: BizIndustryProductLite[]
    enterprises?: BizIndustryEnterpriseLite[]
    market?: Record<string, any> | null
}

/** 行业详情内嵌产品列表项 */
export interface BizIndustryProductLite {
    id: number | string
    productName?: string
    category?: string
    productConcept?: string
    lifeCycle?: string
}

/** 行业详情内嵌企业列表项 */
export interface BizIndustryEnterpriseLite {
    id: number | string
    enterpriseName?: string
    enterpriseType?: string
    scale?: string
    isListed?: number
    mainBusiness?: string
}

/** 行业分页参数 */
export interface IndustryPageParams {
    pageNum: number
    pageSize: number
    industryName?: string
    industryCode?: string
    visibility?: number
    /** 0 未删除 / 1 已删除；列表不带 */
    delFlag?: number
}

/** 行业表单提交（数组字段已 join；与 sections.ts 配置同构） */
export interface IndustryFormData {
    id?: number | string
    industryName?: string
    industryCode?: string
    tags?: string
    visibility?: number
    sort?: number
    definition?: string
    technology?: string
    upstreamChain?: string
    midstreamChain?: string
    downstreamChannel?: string
    downstreamMarketing?: string
    developmentOverview?: string
    marketSize?: string
    growthPotential?: string
    dynamicInfo?: string
    valueInfo?: string
    industryResources?: string
    strategy?: string
    grossProfit?: number
    grossMargin?: number
    netProfit?: number
    netMargin?: number
}

/* ==================== API 函数 ==================== */

/** 行业分页（列表页） */
export function getIndustryPage(params: IndustryPageParams) {
    return request.get<PageResult<BizIndustry>>({
        url: '/biz/industry/page',
        data: params as any
    })
}

/** 行业全量列表（筛选下拉 / Picker 数据源） */
export function getIndustryList() {
    return request.get<BizIndustry[]>({ url: '/biz/industry/list' })
}

/** 行业全景详情（一次返回 industry + products + enterprises + market） */
export function getIndustryDetail(id: number | string) {
    return request.get<BizIndustryDetail>({ url: `/biz/industry/${id}` })
}

/** 新增行业（返回雪花 ID，字符串以避免精度丢失） */
export function createIndustry(data: IndustryFormData) {
    return request.post<number | string>({ url: '/biz/industry', data })
}

/** 更新行业 */
export function updateIndustry(data: IndustryFormData & { id: number | string }) {
    return request.put<boolean>({ url: '/biz/industry', data })
}

/** 删除行业（逻辑删除） */
export function deleteIndustry(id: number | string) {
    return request.delete<boolean>({ url: `/biz/industry/${id}` })
}

/** 行业拥有的客户（行业 ⇄ 客户多对多反查） */
export function getIndustryCustomers(id: number | string, params: { pageNum: number; pageSize: number }) {
    return request.get<PageResult<any>>({
        url: `/biz/industry/${id}/customers`,
        data: params as any
    })
}

/** 关联客户到行业（全量覆盖） */
export function linkIndustryCustomers(id: number | string, relations: { customerId: number | string; isMain?: number }[]) {
    return request.post<boolean>({
        url: `/biz/industry/${id}/customers`,
        data: relations
    })
}

/** 行业统计（列表页 StatBar：industryCount/enterpriseCount/productCount/relationCount） */
export function getIndustryStatistics() {
    return request.get<{ industryCount: number; enterpriseCount: number; productCount: number; relationCount: number }>({
        url: '/biz/industry/statistics'
    })
}

/** 分页响应（后端 IPage） */
export interface PageResult<T> {
    records: T[]
    total: number
    size: number
    current: number
    pages: number
}