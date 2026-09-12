import { service } from '@/utils/axios'
import type { BizCustomerCompany } from './customer'

export interface BizCompanyQuery {
  pageNum?: number
  pageSize?: number
  name?: string
  industry?: string
  scale?: string
  contactName?: string
}

// 公司分页查询
export function getCompanyPage(params: BizCompanyQuery): Promise<any> {
  return service({
    url: '/api/biz/customer/company/page',
    method: 'get',
    params
  })
}

// 公司详情
export function getCompanyDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/company/${id}`,
    method: 'get'
  })
}

// 新增公司
export function addCompany(data: BizCustomerCompany): Promise<any> {
  return service({
    url: '/api/biz/customer/company',
    method: 'post',
    data
  })
}

// 更新公司
export function updateCompany(data: BizCustomerCompany): Promise<any> {
  return service({
    url: '/api/biz/customer/company',
    method: 'put',
    data
  })
}

// 删除公司
export function deleteCompany(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/company/${id}`,
    method: 'delete'
  })
}