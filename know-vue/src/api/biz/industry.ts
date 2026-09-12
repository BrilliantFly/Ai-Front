import { service } from '@/utils/axios'
import type { BizIndustryMarket } from './market'

export interface BizIndustryQuery {
  pageNum?: number
  pageSize?: number
  industryName?: string
  industryCode?: string
  visibility?: number
}

export interface BizIndustryProduct {
  id?: number
  industryIds?: number[]
  industryNames?: string[]
  category?: string
  productName?: string
  productConcept?: string
  consumerInsight?: string
  benefitPromise?: string
  supportPoint?: string
  coreProduct?: string
  basicProduct?: string
  additionalProduct?: string
  potentialProduct?: string
  lifeCycle?: string
  upstreamChain?: string
  midstreamChain?: string
  downstreamChannel?: string
  downstreamMarketing?: string
}

export interface BizIndustryEnterprise {
  id?: number
  industryIds?: number[]
  industryNames?: string[]
  productIds?: number[]
  productNames?: string[]
  enterpriseType?: string
  enterpriseName?: string
  establishedDate?: string
  registeredCapital?: string
  paidCapital?: string
  scale?: string
  insuredCount?: number
  isListed?: number
  mainBusiness?: string
  coreTechnology?: string
  products?: string
  marketPerformance?: string
  competitors?: string
  advantage?: string
  disadvantage?: string
  upstreamChain?: string
  midstreamChain?: string
  downstreamChannel?: string
  downstreamMarketing?: string
}

export interface BizIndustry {
  id?: number
  industryName?: string
  definition?: string
  technology?: string
  industryCode?: string
  tags?: string
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
  visibility?: number
  sort?: number
  market?: BizIndustryMarket
  products?: BizIndustryProduct[]
  enterprises?: BizIndustryEnterprise[]
  customerCount?: number
  createTime?: number
}

// 行业分页查询
export function getIndustryPage(params: BizIndustryQuery): Promise<any> {
  return service({
    url: '/api/biz/industry/page',
    method: 'get',
    params
  })
}

// 行业全量列表(下拉用)
export function getIndustryList(): Promise<any> {
  return service({
    url: '/api/biz/industry/list',
    method: 'get'
  })
}

// 行业详情(含市场)
export function getIndustryDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/${id}`,
    method: 'get'
  })
}

// 新增行业
export function addIndustry(data: BizIndustry): Promise<any> {
  return service({
    url: '/api/biz/industry',
    method: 'post',
    data
  })
}

// 更新行业
export function updateIndustry(data: BizIndustry): Promise<any> {
  return service({
    url: '/api/biz/industry',
    method: 'put',
    data
  })
}

// 删除行业
export function deleteIndustry(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/${id}`,
    method: 'delete'
  })
}

// 行业客户列表
export function getIndustryCustomers(id: number, params: { pageNum?: number; pageSize?: number }): Promise<any> {
  return service({
    url: `/api/biz/industry/${id}/customers`,
    method: 'get',
    params
  })
}

// 行业统计
export function getIndustryStatistics(): Promise<any> {
  return service({
    url: '/api/biz/industry/statistics',
    method: 'get'
  })
}