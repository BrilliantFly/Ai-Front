import request from '@/utils/request'

/** 级联字典节点 */
export interface CascadeDictNode {
    id?: number | string
    dictTypeId?: number | string
    parentId?: number | string
    name: string
    value: string
    icon?: string
    color?: string
    sort?: number
    status?: number
    children?: CascadeDictNode[]
}

// ==================== 类型 ====================

/** 获取级联字典类型列表 */
export function getCascadeDictTypeList(params: { typeName?: string; typeCode?: string; status?: number } = {}) {
    return request.get({ url: '/system/cascade-dict/type/list', data: params }, { isAuth: true })
}

/** 获取级联字典类型详情 */
export function getCascadeDictType(id: number | string) {
    return request.get({ url: `/system/cascade-dict/type/${id}` }, { isAuth: true })
}

/** 新增级联字典类型 */
export function addCascadeDictType(data: any) {
    return request.post({ url: '/system/cascade-dict/type', data }, { isAuth: true })
}

/** 修改级联字典类型 */
export function updateCascadeDictType(data: any) {
    return request.put({ url: '/system/cascade-dict/type', data }, { isAuth: true })
}

/** 删除级联字典类型 */
export function deleteCascadeDictType(id: number | string) {
    return request.delete({ url: `/system/cascade-dict/type/${id}` }, { isAuth: true })
}

// ==================== 数据 ====================

/** 获取级联字典树 */
export function getCascadeDictTree(params: { typeCode?: string; typeId?: number | string; status?: number } = {}) {
    return request.get({ url: '/system/cascade-dict/data/tree', data: params }, { isAuth: true })
}

/** 获取级联字典数据平铺列表 */
export function getCascadeDictDataList(typeId: number | string) {
    return request.get({ url: '/system/cascade-dict/data/list', data: { typeId } }, { isAuth: true })
}

/** 新增级联字典数据 */
export function addCascadeDictData(data: any) {
    return request.post({ url: '/system/cascade-dict/data', data }, { isAuth: true })
}

/** 修改级联字典数据 */
export function updateCascadeDictData(data: any) {
    return request.put({ url: '/system/cascade-dict/data', data }, { isAuth: true })
}

/** 删除级联字典数据 */
export function deleteCascadeDictData(id: number | string) {
    return request.delete({ url: `/system/cascade-dict/data/${id}` }, { isAuth: true })
}

// ==================== 便捷方法 ====================

/** 计划类型级联树（仅启用节点） */
export function getPlanTypeTree() {
    return getCascadeDictTree({ typeCode: 'plan_type', status: 1 })
}
