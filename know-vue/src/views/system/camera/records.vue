<template>
  <div>
    <a-card title="录像记录" :bordered="false">
      <template #extra>
        <a-popconfirm
          :title="`确定删除选中的 ${selectedRowKeys.length} 条录像吗？`"
          :disabled="selectedRowKeys.length === 0"
          @confirm="handleBatchDelete"
        >
          <a-button type="primary" danger :disabled="selectedRowKeys.length === 0">
            <template #icon><delete-outlined /></template>
            批量删除
          </a-button>
        </a-popconfirm>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="设备ID">
          <a-input-number
            v-model:value="queryParams.deviceId"
            placeholder="请输入设备ID"
            allow-clear
            :min="1"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleQuery">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><redo-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 录像列表 -->
      <a-table
        :data-source="recordList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: CameraRecord) => record.id!"
        :row-selection="rowSelection"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: CameraRecord }">
          <template v-if="column.key === 'recordType'">
            <a-tag :color="recordTypeColor(record.recordType)">{{ recordTypeText(record.recordType) }}</a-tag>
          </template>
          <template v-if="column.key === 'startTime'">
            {{ formatTime(record.startTime) }}
          </template>
          <template v-if="column.key === 'duration'">
            {{ formatDuration(record.duration) }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleDetail(record)">详情</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该录像吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal v-model:visible="detailVisible" title="录像详情" :footer="null" width="640px">
      <a-descriptions bordered size="small" :column="1">
        <a-descriptions-item label="ID">{{ detailData?.id ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="设备ID">{{ detailData?.deviceId ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="录像类型">{{ recordTypeText(detailData?.recordType) }}</a-descriptions-item>
        <a-descriptions-item label="开始时间">{{ formatTime(detailData?.startTime) }}</a-descriptions-item>
        <a-descriptions-item label="结束时间">{{ formatTime(detailData?.endTime) }}</a-descriptions-item>
        <a-descriptions-item label="时长">{{ formatDuration(detailData?.duration) }}</a-descriptions-item>
        <a-descriptions-item label="文件路径">{{ detailData?.filePath || '-' }}</a-descriptions-item>
        <a-descriptions-item label="文件大小">{{ formatFileSize(detailData?.fileSize) }}</a-descriptions-item>
        <a-descriptions-item label="云存储地址">{{ detailData?.cloudUrl || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ statusText(detailData?.status) }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatTime(detailData?.createTime) }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, RedoOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { getRecordPage, getRecordDetail, deleteRecord, deleteRecordBatch, type CameraRecord } from '@/api/camera'
import { formatToDateTime } from '@/utils/dateUtil'

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '设备ID', dataIndex: 'deviceId', key: 'deviceId', width: 100 },
  { title: '录像类型', dataIndex: 'recordType', key: 'recordType', width: 110 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '时长', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: '文件路径', dataIndex: 'filePath', key: 'filePath', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive({
  deviceId: undefined as number | undefined
})

// 数据状态
const recordList = ref<CameraRecord[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 多选状态
const selectedRowKeys = ref<number[]>([])
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: any[]) => {
    selectedRowKeys.value = keys
  }
}))

// 详情状态
const detailVisible = ref(false)
const detailData = ref<CameraRecord | null>(null)

// 录像类型映射
const recordTypeMap: Record<number, { text: string; color: string }> = {
  1: { text: '手动', color: 'blue' },
  2: { text: '定时', color: 'purple' },
  3: { text: '移动侦测', color: 'orange' }
}
const recordTypeText = (type?: number) => (type != null && recordTypeMap[type] ? recordTypeMap[type].text : '-')
const recordTypeColor = (type?: number) => (type != null && recordTypeMap[type] ? recordTypeMap[type].color : 'default')

// 状态映射
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '录制中', color: 'warning' },
  1: { text: '已完成', color: 'success' },
  2: { text: '已上传', color: 'processing' }
}
const statusText = (status?: number) => (status != null && statusMap[status] ? statusMap[status].text : '-')
const statusColor = (status?: number) => (status != null && statusMap[status] ? statusMap[status].color : 'default')

// 时间格式化（毫秒时间戳）
const formatTime = (ts?: number) => (ts ? formatToDateTime(ts) : '-')

// 时长格式化（秒 -> 时:分:秒）
const formatDuration = (seconds?: number) => {
  if (seconds == null || seconds < 0) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// 文件大小格式化
const formatFileSize = (bytes?: number) => {
  if (bytes == null || bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// 加载录像列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getRecordPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器已解包 data
    if (res) {
      recordList.value = res.records || []
      pagination.total = res.total || 0
      pagination.current = res.current || 1
    } else {
      recordList.value = []
      pagination.total = 0
    }
  } catch (e) {
    console.error('加载录像列表失败', e)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  queryParams.deviceId = undefined
  selectedRowKeys.value = []
  pagination.current = 1
  loadData()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 详情
const handleDetail = async (record: CameraRecord) => {
  detailData.value = record
  detailVisible.value = true
  try {
    const res: any = await getRecordDetail(record.id!)
    detailData.value = res?.data ?? res ?? record
  } catch (e) {
    console.error('获取录像详情失败', e)
  }
}

// 删除
const handleDelete = async (record: CameraRecord) => {
  try {
    await deleteRecord(record.id!)
    message.success('删除成功')
    selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== record.id)
    loadData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) return
  try {
    await deleteRecordBatch(selectedRowKeys.value)
    message.success('批量删除成功')
    selectedRowKeys.value = []
    loadData()
  } catch (e: any) {
    message.error(e?.message || '批量删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
