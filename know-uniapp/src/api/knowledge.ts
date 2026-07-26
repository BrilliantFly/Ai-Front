import request from '@/utils/request'

// ========== 知识库API ==========
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

// ========== 目录API ==========
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

// ========== 文档API ==========
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
export function getRecentDocuments(data: Record<string, any>) {
  return request.get({ url: '/knowledge/document/recent', data })
}

// ========== 小记API ==========
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
export function toggleArchiveQuickNote(id: number) {
  return request.put({ url: `/knowledge/quick-note/${id}/archive` })
}

// ========== 标签API ==========
export function getTagList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/tag/page', data })
}
export function getTagAll() {
  return request.get({ url: '/knowledge/tag/page', data: { pageNum: 1, pageSize: 200 } })
}
export function addTag(data: any) {
  return request.post({ url: '/knowledge/tag', data })
}
export function updateTag(data: any) {
  return request.put({ url: '/knowledge/tag', data })
}
export function deleteTag(id: number) {
  return request.delete({ url: `/knowledge/tag/${id}` })
}

// ========== 评论API ==========
export function getCommentList(params: Record<string, any>) {
  return request.get({ url: '/knowledge/comment/list', data: params })
}
export function addComment(data: any) {
  return request.post({ url: '/knowledge/comment', data })
}
export function deleteComment(id: number) {
  return request.delete({ url: `/knowledge/comment/${id}` })
}

// ========== 版本历史API ==========
export function getVersionList(documentId: number) {
  return request.get({ url: '/knowledge/version/list', data: { documentId } })
}
export function getVersion(id: number) {
  return request.get({ url: `/knowledge/version/${id}` })
}
export function createVersionSnapshot(documentId: number) {
  return request.post({ url: '/knowledge/version/snapshot', data: { documentId } })
}
export function restoreVersion(id: number) {
  return request.post({ url: `/knowledge/version/restore/${id}` })
}

// ========== 点赞API ==========
export function toggleLike(documentId: number) {
  return request.post({ url: '/knowledge/like/toggle', data: { documentId } })
}
export function getLikeStatus(documentId: number) {
  return request.get({ url: '/knowledge/like/status', data: { documentId } })
}

// ========== 收藏API ==========
export function toggleFavorite(documentId: number) {
  return request.post({ url: '/knowledge/favorite/toggle', data: { documentId } })
}
export function getFavoriteStatus(documentId: number) {
  return request.get({ url: '/knowledge/favorite/status', data: { documentId } })
}
export function getFavoriteList(data: Record<string, any>) {
  return request.get({ url: '/knowledge/favorite/list', data })
}

// ========== 分享API ==========
export function createShare(data: any) {
  return request.post({ url: '/knowledge/share', data })
}
export function getShareInfo(token: string) {
  return request.get({ url: '/knowledge/share/info', data: { token } })
}

// ========== 搜索API ==========
export function searchAll(keyword: string) {
  return request.get({ url: '/knowledge/search', data: { q: keyword } })
}
export function getSearchHistory(limit?: number) {
  return request.get({ url: '/knowledge/search/history', data: { limit: limit || 20 } })
}
export function clearSearchHistory() {
  return request.delete({ url: '/knowledge/search/history' })
}

// ========== 图片API ==========
export function uploadImage(filePath: string) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: '/api/knowledge/image/upload',
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          reject(e)
        }
      },
      fail: reject
    })
  })
}
export function getImageUrl(id: number) {
  return request.get({ url: `/knowledge/image/url/${id}` })
}

// ========== 成员管理API ==========
export function getMemberList(knowledgeBaseId: number) {
  return request.get({ url: '/knowledge/base-member/list', data: { knowledgeBaseId } })
}
export function addMember(data: any) {
  return request.post({ url: '/knowledge/base-member', data })
}
export function removeMember(id: number) {
  return request.delete({ url: `/knowledge/base-member/${id}` })
}
