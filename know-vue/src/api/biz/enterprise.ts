import { service } from '@/utils/axios'
import type { BizIndustryEnterprise } from './industry'

export interface BizEnterpriseQuery {
  pageNum?: number
  pageSize?: number
  industryId?: number
  enterpriseType?: string
  enterpriseName?: string
  isListed?: number
}

// 行业企业分页查询
export function getEnterprisePage(params: BizEnterpriseQuery): Promise<any> {
  return service({
    url: '/api/biz/industry/enterprise/list',
    method: 'get',
    params
  })
}

// 行业企业详情
export function getEnterpriseDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/enterprise/${id}`,
    method: 'get'
  })
}

// 新增行业企业
export function addEnterprise(data: BizIndustryEnterprise): Promise<any> {
  return service({
    url: '/api/biz/industry/enterprise',
    method: 'post',
    data
  })
}

// 更新行业企业
export function updateEnterprise(data: BizIndustryEnterprise): Promise<any> {
  return service({
    url: '/api/biz/industry/enterprise',
    method: 'put',
    data
  })
}

// 删除行业企业
export function deleteEnterprise(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/enterprise/${id}`,
    method: 'delete'
  })
}

// 设置企业的关联行业(全量替换)
export function setEnterpriseIndustries(id: number, industryIds: number[]): Promise<any> {
  return service({
    url: `/api/biz/industry/enterprise/${id}/industries`,
    method: 'post',
    data: industryIds
  })
}

// 设置企业的关联产品(全量替换)
export function setEnterpriseProducts(id: number, productIds: number[]): Promise<any> {
  return service({
    url: `/api/biz/industry/enterprise/${id}/products`,
    method: 'post',
    data: productIds
  })
}