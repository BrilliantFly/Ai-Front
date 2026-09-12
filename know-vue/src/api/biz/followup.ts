import { service } from '@/utils/axios'

export interface BizFollowupQuery {
  pageNum?: number
  pageSize?: number
  customerId?: number
  type?: string
  createUserName?: string
}

export interface BizCustomerFollowup {
  id?: number
  customerId?: number
  type?: string
  content?: string
  result?: string
  nextTime?: number
  createUser?: number
  createUserName?: string
  createTime?: number
}

// 跟进记录分页查询
export function getFollowupPage(params: BizFollowupQuery): Promise<any> {
  return service({
    url: '/api/biz/customer/followup/page',
    method: 'get',
    params
  })
}

// 跟进记录详情
export function getFollowupDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/followup/${id}`,
    method: 'get'
  })
}

// 新增跟进记录
export function addFollowup(data: BizCustomerFollowup): Promise<any> {
  return service({
    url: '/api/biz/customer/followup',
    method: 'post',
    data
  })
}

// 更新跟进记录
export function updateFollowup(data: BizCustomerFollowup): Promise<any> {
  return service({
    url: '/api/biz/customer/followup',
    method: 'put',
    data
  })
}

// 删除跟进记录
export function deleteFollowup(id: number): Promise<any> {
  return service({
    url: `/api/biz/customer/followup/${id}`,
    method: 'delete'
  })
}