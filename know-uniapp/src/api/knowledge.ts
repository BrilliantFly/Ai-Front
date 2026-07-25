import request from '@/utils/request'

// 知识库API
export function getKnowledgeBaseList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/base/page', data })
}
export function getKnowledgeBase(id: number) {
  return request.get({ url: `/knowledge/base/${id}` })
}
export function addKnowledgeBase(data: any) {
  return request.post({ url: '/knowledge/base', data })
}
export function updateKnowledgeBase(data: any) {
  return request.put({ url: '/knowledge/base', data })
}
export function deleteKnowledgeBase(id: number) {
  return request.delete({ url: `/knowledge/base/${id}` })
}

// 目录API
export function getDirectoryTree(knowledgeBaseId: number) {
  return request.get({ url: '/knowledge/directory/tree', data: { knowledgeBaseId } })
}
export function addDirectory(data: any) {
  return request.post({ url: '/knowledge/directory', data })
}
export function updateDirectory(data: any) {
  return request.put({ url: '/knowledge/directory', data })
}
export function deleteDirectory(id: number) {
  return request.delete({ url: `/knowledge/directory/${id}` })
}

// 文档API
export function getDocumentList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/document/page', data })
}
export function getDocument(id: number) {
  return request.get({ url: `/knowledge/document/${id}` })
}
export function addDocument(data: any) {
  return request.post({ url: '/knowledge/document', data })
}
export function updateDocument(data: any) {
  return request.put({ url: '/knowledge/document', data })
}
export function deleteDocument(id: number) {
  return request.delete({ url: `/knowledge/document/${id}` })
}

// 小记API
export function getQuickNoteList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/quick-note/page', data })
}
export function addQuickNote(data: any) {
  return request.post({ url: '/knowledge/quick-note', data })
}
export function updateQuickNote(data: any) {
  return request.put({ url: '/knowledge/quick-note', data })
}
export function deleteQuickNote(id: number) {
  return request.delete({ url: `/knowledge/quick-note/${id}` })
}

// 标签API
export function getTagList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/tag/page', data })
}
