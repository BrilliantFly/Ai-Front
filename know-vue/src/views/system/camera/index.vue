<template>
  <div>
    <a-card title="摄像头管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增设备
        </a-button>
      </template>

      <!-- 搜索栏 -->
      <a-form layout="inline" :model="queryParams" class="mb-4">
        <a-form-item label="设备名称">
          <a-input v-model:value="queryParams.deviceName" placeholder="请输入设备名称" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">在线</a-select-option>
            <a-select-option :value="0">离线</a-select-option>
          </a-select>
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

      <!-- 设备列表 -->
      <a-table
        :data-source="deviceList"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: CameraDevice) => record.id!"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }: { column: any; record: CameraDevice }">
          <template v-if="column.key === 'status'">
            <a-badge :status="record.status === 1 ? 'success' : 'default'" />
            {{ record.status === 1 ? '在线' : '离线' }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该设备吗？" @confirm="handleDelete(record)">
                <a style="color: red">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :confirm-loading="confirmLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="640px"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="设备名称" name="deviceName">
              <a-input v-model:value="formData.deviceName" placeholder="请输入设备名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="设备编号" name="deviceCode">
              <a-input v-model:value="formData.deviceCode" placeholder="请输入设备编号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="设备型号">
              <a-input v-model:value="formData.deviceModel" placeholder="请输入设备型号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="厂商">
              <a-input v-model:value="formData.manufacturer" placeholder="请输入厂商" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="IP地址">
              <a-input v-model:value="formData.ipAddress" placeholder="请输入IP地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="端口">
              <a-input-number v-model:value="formData.port" placeholder="端口号" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="登录用户名">
              <a-input v-model:value="formData.username" placeholder="设备登录用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="登录密码">
              <a-input-password v-model:value="formData.password" placeholder="设备登录密码" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="安装位置">
              <a-input v-model:value="formData.position" placeholder="设备安装位置" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="formData.status" placeholder="请选择状态">
                <a-select-option :value="1">在线</a-select-option>
                <a-select-option :value="0">离线</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注">
          <a-textarea v-model:value="formData.remark" placeholder="备注信息" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, RedoOutlined } from '@ant-design/icons-vue'
import { getCameraPage, addCamera, updateCamera, deleteCamera, type CameraDevice } from '@/api/camera'

// 表格列定义
const columns = [
  { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 160 },
  { title: '设备编号', dataIndex: 'deviceCode', key: 'deviceCode', width: 140 },
  { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
  { title: '厂商', dataIndex: 'manufacturer', key: 'manufacturer', width: 120 },
  { title: '型号', dataIndex: 'deviceModel', key: 'deviceModel', width: 120 },
  { title: '位置', dataIndex: 'position', key: 'position', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

// 查询参数
const queryParams = reactive({
  deviceName: undefined as string | undefined,
  status: undefined as number | undefined
})

// 数据状态
const deviceList = ref<CameraDevice[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增设备')
const confirmLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | undefined>(undefined)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Partial<CameraDevice>>({
  deviceName: '',
  deviceCode: '',
  deviceModel: '',
  manufacturer: '',
  ipAddress: '',
  port: 80,
  username: '',
  password: '',
  position: '',
  status: 1,
  remark: ''
})

// 表单校验规则
const rules: Record<string, any> = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }]
}

// 加载设备列表
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getCameraPage({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...queryParams
    })
    // 响应格式: { records: [], total: 0, current: 1, size: 10 }
    // axios 拦截器已解包 data
    if (res) {
      deviceList.value = res.records || []
      pagination.total = res.total || 0
      pagination.current = res.current || 1
    } else {
      deviceList.value = []
      pagination.total = 0
    }
  } catch (e) {
    console.error('加载设备列表失败', e)
    deviceList.value = []
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
  queryParams.deviceName = undefined
  queryParams.status = undefined
  pagination.current = 1
  loadData()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  editId.value = undefined
  modalTitle.value = '新增设备'
  formData.deviceName = ''
  formData.deviceCode = ''
  formData.deviceModel = ''
  formData.manufacturer = ''
  formData.ipAddress = ''
  formData.port = 80
  formData.username = ''
  formData.password = ''
  formData.position = ''
  formData.status = 1
  formData.remark = ''
  modalVisible.value = true
}

// 编辑
const handleEdit = (record: CameraDevice) => {
  isEdit.value = true
  editId.value = record.id
  modalTitle.value = '编辑设备'
  Object.assign(formData, {
    deviceName: record.deviceName,
    deviceCode: record.deviceCode,
    deviceModel: record.deviceModel || '',
    manufacturer: record.manufacturer || '',
    ipAddress: record.ipAddress || '',
    port: record.port || 80,
    username: record.username || '',
    password: record.password || '',
    position: record.position || '',
    status: record.status ?? 1,
    remark: record.remark || ''
  })
  modalVisible.value = true
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  confirmLoading.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateCamera({ ...formData, id: editId.value } as CameraDevice)
      message.success('修改成功')
    } else {
      await addCamera(formData as CameraDevice)
      message.success('新增成功')
    }
    modalVisible.value = false
    loadData()
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    confirmLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 删除
const handleDelete = async (record: CameraDevice) => {
  try {
    await deleteCamera(record.id!)
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

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
