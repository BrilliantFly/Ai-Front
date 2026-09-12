import { service } from '@/utils/axios'

export interface BizCustomerQuery {
  pageNum?: number
  pageSize?: number
  name?: string
  phone?: string
  customerType?: number
  status?: number
  source?: string
  companyId?: number
  industryId?: number
}

export interface BizCustomerCompany {
  id?: number
  name?: string
  industry?: string
  scale?: string
  business?: string
  mainProducts?: string
  establishedDate?: string
  capital?: string
  address?: string
  marketPerformance?: string
  competitiveAdvantage?: string
  contactName?: string
  contactPhone?: string
  contactPosition?: string
}

export interface BizCustomerProfile {
  id?: number
  customerId?: number
  dynamicInfo?: string
  valueLevel?: number
  valueExpect?: string
  valueInterest?: string
  strategy?: string
  talkScript?: string
  analysis?: string
}

export interface BizCustomerIndustry {
  id?: number
  customerId?: number
  industryId?: number
  relationType?: number
  isMain?: number
  remark?: string
  industryName?: string
}

export interface BizCustomer {
  id?: number
  name?: string
  gender?: number
  age?: number
  phone?: string
  email?: string
  address?: string
  regionCode?: string
  education?: string
  educationRaw?: string
  occupation?: string
  position?: string
  personality?: string
  hobby?: string
  valuesText?: string
  lifestyle?: string
  maritalStatus?: string
  familySituation?: string
  customerType?: number
  companyId?: number
  status?: number
  source?: string
  demandLevel?: number
  valueScore?: number
  demandWillingness?: number
  demandBudget?: number
  demandDecision?: string
  demandPriority?: number
  demandTags?: string
  demandDesc?: string
  profile?: BizCustomerProfile
  company?: BizCustomerCompany
  industries?: BizCustomerIndustry[]
  industryIds?: number[]
}

// 客户分页查询
export function getCustomerPage(params: BizCustomerQuery): Promise<any> {
  return service({
    url: '/api/biz/customer/page',
    method: 'get',
    params
  })
}

// 客户详情
export function getCustomerDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/${id}`,
    method: 'get'
  })
}

// 新增客户
export function addCustomer(data: BizCustomer): Promise<any> {
  return service({
    url: '/api/biz/customer',
    method: 'post',
    data
  })
}

// 更新客户
export function updateCustomer(data: BizCustomer): Promise<any> {
  return service({
    url: '/api/biz/customer',
    method: 'put',
    data
  })
}

// 删除客户
export function deleteCustomer(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/${id}`,
    method: 'delete'
  })
}

// 更新客户状态
export function updateCustomerStatus(id: number, status: number): Promise<any> {
  return service({
    url: `/api/biz/customer/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 设置客户所属行业
export function setCustomerIndustries(id: number, relations: BizCustomerIndustry[]): Promise<any> {
  return service({
    url: `/api/biz/customer/${id}/industries`,
    method: 'post',
    data: relations
  })
}

// 客户统计
export function getCustomerStatistics(): Promise<any> {
  return service({
    url: '/api/biz/customer/statistics',
    method: 'get'
  })
}