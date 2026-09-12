import { service } from '@/utils/axios'

export interface BizIndustryMarket {
  id?: number
  industryIds?: number[]
  industryNames?: string[]
  demand?: string
  opportunity?: string
  valueProposition?: string
  customerSegment?: string
  channel?: string
  customerRelation?: string
  revenueSource?: string
  keyResource?: string
  keyPartner?: string
  keyActivity?: string
  costStructure?: string
  valueEvaluation?: string
  valueDistribution?: string
  competitionMethod?: string
  promoChannel?: string
}

// 获取行业市场信息(该行业关联的首个市场)
export function getMarketByIndustryId(industryId: number): Promise<any> {
  return service({
    url: `/api/biz/industry/market/${industryId}`,
    method: 'get'
  })
}

// 获取行业关联的市场列表(M:N)
export function getMarketsByIndustryId(industryId: number): Promise<any> {
  return service({
    url: '/api/biz/industry/market/list',
    method: 'get',
    params: { industryId }
  })
}

// 保存行业市场信息(按市场id upsert)
export function saveMarket(industryId: number, data: BizIndustryMarket): Promise<any> {
  return service({
    url: `/api/biz/industry/market/${industryId}`,
    method: 'put',
    data
  })
}

// 新增市场(可携带 industryIds 关联行业)
export function addMarket(data: BizIndustryMarket): Promise<any> {
  return service({
    url: '/api/biz/industry/market',
    method: 'post',
    data
  })
}