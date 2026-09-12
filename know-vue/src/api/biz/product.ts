import { service } from '@/utils/axios'
import type { BizIndustryProduct } from './industry'

export interface BizProductQuery {
  pageNum?: number
  pageSize?: number
  industryId?: number
  category?: string
  productName?: string
}

// 行业产品分页查询
export function getProductPage(params: BizProductQuery): Promise<any> {
  return service({
    url: '/api/biz/industry/product/list',
    method: 'get',
    params
  })
}

// 行业产品详情
export function getProductDetail(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/product/${id}`,
    method: 'get'
  })
}

// 新增行业产品
export function addProduct(data: BizIndustryProduct): Promise<any> {
  return service({
    url: '/api/biz/industry/product',
    method: 'post',
    data
  })
}

// 更新行业产品
export function updateProduct(data: BizIndustryProduct): Promise<any> {
  return service({
    url: '/api/biz/industry/product',
    method: 'put',
    data
  })
}

// 删除行业产品
export function deleteProduct(id: number): Promise<any> {
  return service({
    url: `/api/biz/industry/product/${id}`,
    method: 'delete'
  })
}

// 设置产品的关联行业(全量替换)
export function setProductIndustries(id: number, industryIds: number[]): Promise<any> {
  return service({
    url: `/api/biz/industry/product/${id}/industries`,
    method: 'post',
    data: industryIds
  })
}