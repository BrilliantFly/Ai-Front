import request from '@/utils/request'

/**
 * 客户模块 API（统一走 /api/biz/customer/*，复用标准 request 的 api 前缀 + token 注入）
 * 对应后端：BizCustomerController / BizCustomerFollowupController / BizCustomerCompanyController / BizIndustryController
 */

/* ==================== 类型定义（对齐后端 BizCustomer 实体） ==================== */

/** 客户画像（biz_customer_profile） */
export interface CustomerProfile {
    id?: number
    customerId?: number
    /** 动态信息（人性/心理学/读心术；制度对人的影响） */
    dynamicInfo?: string
    /** 价值层级（1 生理 / 2 安全 / 3 社交 / 4 尊重 / 5 自我实现） */
    valueLevel?: number
    /** 价值期望 */
    valueExpect?: string
    /** 价值兴趣 */
    valueInterest?: string
    /** 应对策略 */
    strategy?: string
    /** 话术设计 */
    talkScript?: string
    /** 分析 */
    analysis?: string
}

/** 客户企业（biz_customer_company） */
export interface CustomerCompany {
    id?: number
    name?: string
    industry?: string
    scale?: string
    establishedDate?: string
    capital?: string
    address?: string
    business?: string
    mainProducts?: string
    marketPerformance?: string
    competitiveAdvantage?: string
    contactName?: string
    contactPhone?: string
    contactPosition?: string
}

/** 客户行业关联（biz_customer_industry + 行业名） */
export interface CustomerIndustry {
    id?: number
    customerId?: number
    industryId: number
    industryName?: string
    /** 关联类型（1=客户行业） */
    relationType?: number
    /** 是否主营（1 是 / 0 否） */
    isMain?: number
    remark?: string
}

/** 行业（biz_industry） */
export interface IndustryItem {
    id: number
    industryName: string
    industryCode?: string
    sort?: number
}

/** 客户实体（列表 record 与详情 base 均为此结构）
 * id 为雪花 ID（如 2103742838915026946）超出 JS 安全整数，后端序列化为 string，故类型为 number | string
 */
export interface CustomerInfo {
    id: number | string
    name: string
    gender?: number
    age?: number
    /** 手机号（后端 AES 加密，列表/详情已脱敏 138****8000） */
    phone?: string
    email?: string
    address?: string
    regionCode?: string
    // ---- 基础认识 ----
    appearance?: string
    personality?: string
    lifestyle?: string
    hobby?: string
    occupation?: string
    position?: string
    /** 赚钱方式（逗号分隔多选：体力层/技能层/资源层/资本层/创业层/投资层/高级管理层/专家顾问层/科技创新层/社会影响层） */
    earningWay?: string
    /** 社会阶层（逗号分隔多选：思想层/投资层/创业层/生意层/打工人） */
    socialClass?: string
    socialCircle?: string
    // ---- 详细认识 ----
    maritalStatus?: string
    familySituation?: string
    familyAddress?: string
    education?: string
    educationRaw?: string
    valuesText?: string
    basicLifeSkill?: string
    vocationalSkill?: string
    sportsSkill?: string
    artSkill?: string
    techSkill?: string
    // ---- 基础/业务情况 ----
    customerType?: number
    source?: string
    status?: number
    demandLevel?: number
    valueScore?: number
    demandWillingness?: number
    demandBudget?: number | string
    demandDecision?: string
    demandPriority?: number
    demandTags?: string
    demandDesc?: string
    // ---- 关联 ----
    companyId?: number
    profile?: CustomerProfile | null
    company?: CustomerCompany | null
    industries?: CustomerIndustry[] | null
    industryIds?: number[]
    createTime?: number | string
}

/** 客户详情（GET /{id} 全量返回 customer + profile + company + industries） */
export type CustomerDetail = CustomerInfo

/** 客户表单提交（配置驱动表单层数据；数组字段在提交时 join） */
export interface CustomerFormData {
    name: string
    gender?: number
    age?: number
    phone?: string
    email?: string
    address?: string
    regionCode?: string
    appearance?: string
    personality?: string
    lifestyle?: string
    hobby?: string
    occupation?: string
    position?: string
    earningWay?: string
    socialClass?: string
    socialCircle?: string
    maritalStatus?: string
    familySituation?: string
    familyAddress?: string
    education?: string
    valuesText?: string
    basicLifeSkill?: string
    vocationalSkill?: string
    sportsSkill?: string
    artSkill?: string
    techSkill?: string
    customerType?: number
    source?: string
    status?: number
    demandLevel?: number
    valueScore?: number
    demandWillingness?: number
    demandBudget?: number | string
    demandDecision?: string
    demandPriority?: number
    demandTags?: string
    demandDesc?: string
    companyId?: number
    company?: Partial<CustomerCompany> | null
    profile?: Partial<CustomerProfile> | null
    industryIds?: number[]
}

/** 客户跟进记录 */
export interface CustomerFollowup {
    id: number
    customerId: number
    /** 跟进方式（电话/微信/拜访/邮件/其他） */
    type?: string
    content?: string
    result?: string
    /** 下次跟进时间（毫秒时间戳，可空） */
    nextTime?: number | null
    createUser?: number
    createUserName?: string
    createTime?: number | string
}

/** 分页响应（后端 IPage） */
export interface PageResult<T> {
    records: T[]
    total: number
    size: number
    current: number
    pages: number
}

/** 客户统计（后端 statistics + 前端派生 total/following/monthly） */
export interface CustomerStats {
    total: number
    monthly: number
    following: number
    industryDistribution?: { industryId: number; industryName: string; cnt: number }[]
    statusDistribution?: { status: number; cnt: number }[]
}

/* ==================== API 函数 ==================== */

/** 客户分页（列表页） */
export function getCustomerPage(params: {
    pageNum: number
    pageSize: number
    name?: string
    phone?: string
    status?: number
    customerType?: number
    source?: string
    regionCode?: string
    companyId?: number
}) {
    return request.get<PageResult<CustomerInfo>>({
        url: '/biz/customer/page',
        data: params as any
    })
}

/** 客户详情（全量：customer + profile + company + industries） */
export function getCustomerDetail(id: number | string) {
    return request.get<CustomerDetail>({ url: `/biz/customer/${id}` })
}

/** 新增客户（返回雪花 ID，字符串以避免精度丢失） */
export function createCustomer(data: CustomerFormData) {
    return request.post<number | string>({ url: '/biz/customer', data })
}

/** 更新客户 */
export function updateCustomer(data: CustomerFormData & { id: number | string }) {
    return request.put<boolean>({ url: '/biz/customer', data })
}

/** 删除客户（逻辑删除）
 * @deprecated 列表暂不提供删除入口，保留供长按操作扩展
 */
export function deleteCustomer(id: number | string) {
    return request.delete<boolean>({ url: `/biz/customer/${id}` })
}

/** 更新客户状态 */
export function updateCustomerStatus(id: number | string, status: number) {
    return request.put<boolean>({ url: `/biz/customer/${id}/status`, data: { status } })
}

/** 设置客户行业（全量覆盖关系；relations 至少带 industryId，isMain 首项为 1） */
export function setCustomerIndustries(id: number | string, relations: { industryId: number; isMain?: number }[]) {
    return request.post<boolean>({ url: `/biz/customer/${id}/industries`, data: relations })
}

/** 客户统计（列表统计卡 / 首页概览 / 用户信息 widget）
 * 后端返回 industryDistribution + statusDistribution；此处派生 total/following，后端增强后 monthly 自动生效
 */
export async function getCustomerStats(): Promise<CustomerStats> {
    const res = await request.get<any>({ url: '/biz/customer/statistics' })
    const raw = res || {}
    const statusRows: { status: number; cnt: number }[] =
        (raw.statusDistribution || []).map((row: any) => ({
            status: Number(row.status || 0),
            cnt: Number(row.cnt || 0)
        }))
    let total = 0
    let following = 0
    for (const row of statusRows) {
        const cnt = Number(row.cnt || 0)
        total += cnt
        if (Number(row.status) === 2) following = cnt
    }
    return {
        total: Number(raw.total ?? total),
        monthly: Number(raw.monthly || 0),
        following: Number(raw.following ?? following),
        industryDistribution: raw.industryDistribution,
        statusDistribution: statusRows
    }
}

/** 跟进记录分页（详情页时间线 / 跟进页历史列表，时间倒序） */
export function getFollowupPage(params: { customerId: number | string; pageNum: number; pageSize: number; type?: string }) {
    return request.get<PageResult<CustomerFollowup>>({
        url: '/biz/customer/followup/page',
        data: params as any
    })
}

/** 新增跟进记录 */
export function createFollowup(data: {
    customerId: number | string
    content: string
    type?: string
    result?: string
    nextTime?: number | null
}) {
    return request.post<number>({ url: '/biz/customer/followup', data })
}

/** 行业列表（全量，IndustryPicker 数据源；也可用 getIndustryPage 分页） */
export function getIndustryList() {
    return request.get<IndustryItem[]>({ url: '/biz/industry/list' })
}

/** 行业分页（搜索/大数据量场景） */
export function getIndustryPage(params: { pageNum: number; pageSize: number; name?: string }) {
    return request.get<PageResult<IndustryItem>>({
        url: '/biz/industry/page',
        data: params as any
    })
}

/** 公司分页（公司列表页 / 表单选择已有公司） */
export function getCompanyPage(params: { pageNum: number; pageSize: number; name?: string }) {
    return request.get<PageResult<CustomerCompany>>({
        url: '/biz/customer/company/page',
        data: params as any
    })
}