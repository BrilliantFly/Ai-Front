import { service } from '@/utils/axios'

// 知识库API
export function getKnowledgeBaseList(params) {
  return service({
    url: '/api/knowledge/base/page',
    method: 'get',
    params
  })
}

export function getKnowledgeBase(id) {
  return service({
    url: `/api/knowledge/base/${id}`,
    method: 'get'
  })
}

export function addKnowledgeBase(data) {
  return service({
    url: '/api/knowledge/base',
    method: 'post',
    data
  })
}

export function updateKnowledgeBase(data) {
  return service({
    url: '/api/knowledge/base',
    method: 'put',
    data
  })
}

export function deleteKnowledgeBase(id) {
  return service({
    url: `/api/knowledge/base/${id}`,
    method: 'delete'
  })
}

// 目录API
export function getDirectoryList(params) {
  return service({
    url: '/api/knowledge/directory/list',
    method: 'get',
    params
  })
}

export function addDirectory(data) {
  return service({
    url: '/api/knowledge/directory',
    method: 'post',
    data
  })
}

export function updateDirectory(data) {
  return service({
    url: '/api/knowledge/directory',
    method: 'put',
    data
  })
}

export function deleteDirectory(id) {
  return service({
    url: `/api/knowledge/directory/${id}`,
    method: 'delete'
  })
}

// 文档API
export function getDocumentList(params) {
  return service({
    url: '/api/knowledge/document/page',
    method: 'get',
    params
  })
}

export function getDocument(id) {
  return service({
    url: `/api/knowledge/document/${id}`,
    method: 'get'
  })
}

export function addDocument(data) {
  return service({
    url: '/api/knowledge/document',
    method: 'post',
    data
  })
}

export function updateDocument(data) {
  return service({
    url: '/api/knowledge/document',
    method: 'put',
    data
  })
}

export function deleteDocument(id) {
  return service({
    url: `/api/knowledge/document/${id}`,
    method: 'delete'
  })
}

// 标签API
export function getTagList(params) {
  return service({
    url: '/api/knowledge/tag/list',
    method: 'get',
    params
  })
}

export function addTag(data) {
  return service({
    url: '/api/knowledge/tag',
    method: 'post',
    data
  })
}

export function updateTag(data) {
  return service({
    url: '/api/knowledge/tag',
    method: 'put',
    data
  })
}

export function deleteTag(id) {
  return service({
    url: `/api/knowledge/tag/${id}`,
    method: 'delete'
  })
}

// 小记API
export function getQuickNoteList(params) {
  return service({
    url: '/api/knowledge/quickNote/page',
    method: 'get',
    params
  })
}

export function addQuickNote(data) {
  return service({
    url: '/api/knowledge/quickNote',
    method: 'post',
    data
  })
}

export function updateQuickNote(data) {
  return service({
    url: '/api/knowledge/quickNote',
    method: 'put',
    data
  })
}

export function deleteQuickNote(id) {
  return service({
    url: `/api/knowledge/quickNote/${id}`,
    method: 'delete'
  })
}
