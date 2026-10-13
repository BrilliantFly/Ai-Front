import { service } from '@/utils/axios'

// ==================== 类型 ====================
export interface CascadeDictType {
  id?: number
  typeName: string
  typeCode: string
  status?: number
  remark?: string
  createTime?: number
  updateTime?: number
}

export interface CascadeDictTypeQuery {
  typeName?: string
  typeCode?: string
  status?: number
}

// ==================== 数据 ====================
export interface CascadeDictData {
  id?: number
  dictTypeId: number
  parentId?: number
  name: string
  value: string
  icon?: string
  color?: string
  sort?: number
  status?: number
}

export interface CascadeDictNode extends CascadeDictData {
  children?: CascadeDictNode[]
}

export interface CascadeDictTreeQuery {
  typeCode?: string
  typeId?: number
  status?: number
}

// ==================== 类型 API ====================
export function getCascadeDictTypeList(params: CascadeDictTypeQuery): Promise<any> {
  return service({
    url: '/system/cascade-dict/type/list',
    method: 'get',
    params
  })
}

export function getCascadeDictType(id: number): Promise<any> {
  return service({
    url: `/system/cascade-dict/type/${id}`,
    method: 'get'
  })
}

export function addCascadeDictType(data: CascadeDictType): Promise<any> {
  return service({
    url: '/system/cascade-dict/type',
    method: 'post',
    data
  })
}

export function updateCascadeDictType(data: CascadeDictType): Promise<any> {
  return service({
    url: '/system/cascade-dict/type',
    method: 'put',
    data
  })
}

export function deleteCascadeDictType(id: number): Promise<any> {
  return service({
    url: `/system/cascade-dict/type/${id}`,
    method: 'delete'
  })
}

// ==================== 数据 API ====================
export function getCascadeDictTree(params: CascadeDictTreeQuery): Promise<any> {
  return service({
    url: '/system/cascade-dict/data/tree',
    method: 'get',
    params
  })
}

export function getCascadeDictDataList(typeId: number): Promise<any> {
  return service({
    url: '/system/cascade-dict/data/list',
    method: 'get',
    params: { typeId }
  })
}

export function addCascadeDictData(data: CascadeDictData): Promise<any> {
  return service({
    url: '/system/cascade-dict/data',
    method: 'post',
    data
  })
}

export function updateCascadeDictData(data: CascadeDictData): Promise<any> {
  return service({
    url: '/system/cascade-dict/data',
    method: 'put',
    data
  })
}

export function deleteCascadeDictData(id: number): Promise<any> {
  return service({
    url: `/system/cascade-dict/data/${id}`,
    method: 'delete'
  })
}

// ==================== 便捷方法 ====================

/** 计划类型级联树（仅启用节点） */
export function getPlanTypeTree(): Promise<any> {
  return getCascadeDictTree({ typeCode: 'plan_type', status: 1 })
}

/** 行业类型级联树（仅启用节点，数据源：sys_cascade_dict type_code=industry_type） */
export function getIndustryTypeTree(): Promise<any> {
  return getCascadeDictTree({ typeCode: 'industry_type', status: 1 })
}
