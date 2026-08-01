<template>
  <div>
    <a-card title="截图记录" :bordered="false">
      <template #extra>
        <a-popconfirm
          :title="`确定删除选中的 ${selectedRowKeys.length} 条截图吗？`"
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

      <!-- 截图列表 -->
      <a-table
        :data-source="snapshotList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: CameraSnapshot) => record.id!"
        :row-selection="rowSelection"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: CameraSnapshot }">
          <template v-if="column.key === 'captureTime'">
            {{ formatTime(record.captureTime) }}
          </template>
          <template v-if="column.key === 'thumbnail'">
            <a-image
              v-if="record.thumbnail || record.filePath"
              :src="record.thumbnail || record.filePath"
              width="60"
              height="40"
              style="object-fit: cover; border-radius: 4px"
            />
            <div v-else class="thumbnail-placeholder">
              <picture-outlined style="font-size: 18px" />
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleDetail(record)">详情</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该截图吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal v-model:visible="detailVisible" title="截图详情" :footer="null" width="640px">
      <a-descriptions bordered size="small" :column="1">
        <a-descriptions-item label="ID">{{ detailData?.id ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="设备ID">{{ detailData?.deviceId ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="截图时间">{{ formatTime(detailData?.captureTime) }}</a-descriptions-item>
        <a-descriptions-item label="缩略图">
          <a-image
            v-if="detailData?.thumbnail || detailData?.filePath"
            :src="detailData?.thumbnail || detailData?.filePath"
            width="120"
            style="object-fit: cover; border-radius: 4px"
          />
          <span v-else>-</span>
        </a-descriptions-item>
        <a-descriptions-item label="文件路径">{{ detailData?.filePath || '-' }}</a-descriptions-item>
        <a-descriptions-item label="云存储地址">{{ detailData?.cloudUrl || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatTime(detailData?.createTime) }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, RedoOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons-vue'
import { getSnapshotPage, getSnapshotDetail, deleteSnapshot, deleteSnapshotBatch, type CameraSnapshot } from '@/api/camera'
import { formatToDateTime } from '@/utils/dateUtil'

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '设备ID', dataIndex: 'deviceId', key: 'deviceId', width: 100 },
  { title: '截图时间', dataIndex: 'captureTime', key: 'captureTime', width: 180 },
  { title: '缩略图', dataIndex: 'thumbnail', key: 'thumbnail', width: 100 },
  { title: '文件路径', dataIndex: 'filePath', key: 'filePath', ellipsis: true },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive({
  deviceId: undefined as number | undefined
})

// 数据状态
const snapshotList = ref<CameraSnapshot[]>([])
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
const detailData = ref<CameraSnapshot | null>(null)

// 时间格式化（毫秒时间戳）
const formatTime = (ts?: number) => (ts ? formatToDateTime(ts) : '-')

// 加载截图列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getSnapshotPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器已解包 data
    if (res) {
      snapshotList.value = res.records || []
      pagination.total = res.total || 0
      pagination.current = res.current || 1
    } else {
      snapshotList.value = []
      pagination.total = 0
    }
  } catch (e) {
    console.error('加载截图列表失败', e)
    snapshotList.value = []
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
const handleDetail = async (record: CameraSnapshot) => {
  detailData.value = record
  detailVisible.value = true
  try {
    const res: any = await getSnapshotDetail(record.id!)
    detailData.value = res?.data ?? res ?? record
  } catch (e) {
    console.error('获取截图详情失败', e)
  }
}

// 删除
const handleDelete = async (record: CameraSnapshot) => {
  try {
    await deleteSnapshot(record.id!)
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
    await deleteSnapshotBatch(selectedRowKeys.value)
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
.thumbnail-placeholder {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #bfbfbf;
}
</style>
