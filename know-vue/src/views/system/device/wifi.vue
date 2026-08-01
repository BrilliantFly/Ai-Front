<template>
  <div class="p-4">
    <a-card title="Wi-Fi管理">
      <template #extra>
        <a-button type="primary" :loading="loading" @click="loadData">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>

      <a-alert
        v-if="loadError"
        type="warning"
        show-icon
        message="Wi-Fi接口暂不可用"
        description="无法连接 Wi-Fi 服务接口，请确认后端 /adminapi/wifi/list 接口是否已部署后重试。"
        closable
        style="margin-bottom: 16px"
        @close="loadError = false"
      />

      <a-table
        :columns="columns"
        :data-source="wifiList"
        :loading="loading"
        :row-key="(record: WifiItem) => record.id"
        :pagination="pagination"
      >
        <template #bodyCell="{ column, record }: { column: any; record: WifiItem }">
          <template v-if="column.key === 'hidden'">
            <a-tag :color="record.hidden ? 'blue' : 'default'">{{ record.hidden ? '是' : '否' }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-popconfirm title="确定删除该 Wi-Fi 吗？" @confirm="handleDelete(record)">
              <a style="color: red">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { getWifiList, deleteWifi, type WifiItem } from '@/api/device/wifi'

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: 'SSID', dataIndex: 'ssid', key: 'ssid', width: 160 },
  { title: '加密方式', dataIndex: 'encryption', key: 'encryption', width: 140 },
  { title: '是否隐藏', dataIndex: 'hidden', key: 'hidden', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' }
]

// 数据状态
const wifiList = ref<WifiItem[]>([])
const loading = ref(false)
const loadError = ref(false)
const pagination = reactive({
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 加载 Wi-Fi 列表
const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    const res: any = await getWifiList()
    // 兼容 { data: [...] } 与直接数组两种返回结构
    const list = res?.data ?? res
    wifiList.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('加载 Wi-Fi 列表失败', e)
    wifiList.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// 删除
const handleDelete = async (record: WifiItem) => {
  try {
    await deleteWifi(record.id)
    message.success('删除成功')
    loadData()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
