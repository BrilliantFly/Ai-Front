<template>
  <div class="cascade-dict-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="类型名称">
          <a-input v-model:value="queryParams.typeName" placeholder="请输入类型名称" allow-clear />
        </a-form-item>
        <a-form-item label="类型编码">
          <a-input v-model:value="queryParams.typeCode" placeholder="请输入类型编码" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="loadData">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 类型表格区域 -->
    <a-card :bordered="false" class="table-wrapper">
      <a-space class="table-toolbar">
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新增
        </a-button>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleCascadeData(record)">级联数据</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 类型 - 新增/编辑弹窗 -->
    <BizFullscreenModal v-model:open="modalVisible" :title="modalTitle" width="500px" @ok="handleModalOk" @cancel="handleModalCancel">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" :rules="formRules">
        <a-form-item label="类型名称" name="typeName">
          <a-input v-model:value="formData.typeName" placeholder="请输入类型名称" />
        </a-form-item>
        <a-form-item label="类型编码" name="typeCode">
          <a-input v-model:value="formData.typeCode" placeholder="请输入类型编码（全局唯一）" :disabled="modalType === 'edit'" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio :value="1">正常</a-radio>
            <a-radio :value="0">停用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" :rows="2" placeholder="请输入备注" />
        </a-form-item>
      </a-form>
    </BizFullscreenModal>

    <!-- 级联数据 - 弹窗 -->
    <BizFullscreenModal v-model:open="dataVisible" :title="'级联数据 - ' + currentTypeName" width="900px" :footer="null">
      <div class="cascade-data-toolbar">
        <a-button type="primary" size="small" @click="handleAddTop">
          <template #icon><PlusOutlined /></template>
          新增顶级
        </a-button>
      </div>
      <a-table
        :columns="dataColumns"
        :data-source="dataTree"
        :loading="dataLoading"
        :pagination="false"
        row-key="id"
        size="small"
        v-model:expandedRowKeys="dataExpandedKeys"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <span>{{ record.icon }}</span>
          </template>
          <template v-else-if="column.key === 'color'">
            <span v-if="record.color" class="color-cell">
              <span class="color-dot" :style="{ backgroundColor: record.color }"></span>
              {{ record.color }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleAddChild(record)">新增下级</a-button>
              <a-button type="link" size="small" @click="handleEditData(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="handleDeleteData(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </BizFullscreenModal>

    <!-- 级联数据 - 新增/编辑弹窗 -->
    <BizFullscreenModal v-model:open="dataModalVisible" :title="dataModalTitle" width="500px" @ok="handleDataModalOk" @cancel="handleDataModalCancel">
      <a-form ref="dataFormRef" :model="dataForm" :label-col="{ span: 5 }" :rules="dataFormRules">
        <a-form-item label="父级" name="parentId">
          <a-tree-select
            v-model:value="dataForm.parentId"
            :tree-data="parentTreeData"
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="不选则为顶级"
            allow-clear
            tree-default-expand-all
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="名称" name="name">
          <a-input v-model:value="dataForm.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="编码" name="value">
          <a-input v-model:value="dataForm.value" placeholder="请输入编码（同类型内唯一）" />
        </a-form-item>
        <a-form-item label="图标" name="icon">
          <a-input v-model:value="dataForm.icon" placeholder="如 🏃" />
        </a-form-item>
        <a-form-item label="颜色" name="color">
          <a-input v-model:value="dataForm.color" placeholder="如 #67C23A" />
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="dataForm.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="dataForm.status">
            <a-radio :value="1">正常</a-radio>
            <a-radio :value="0">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </BizFullscreenModal>
  </div>
</template>

<script setup lang="ts">
import BizFullscreenModal from '@/components/BizFullscreenModal.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import {
  getCascadeDictTypeList,
  addCascadeDictType,
  updateCascadeDictType,
  deleteCascadeDictType,
  getCascadeDictTree,
  addCascadeDictData,
  updateCascadeDictData,
  deleteCascadeDictData,
  type CascadeDictNode
} from '@/api/system/cascadeDict'

const queryParams = reactive({ typeName: '', typeCode: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '类型名称', dataIndex: 'typeName', key: 'typeName' },
  { title: '类型编码', dataIndex: 'typeCode', key: 'typeCode' },
  { title: '状态', key: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 250, fixed: 'right' }
]

const data = ref<any[]>([])
const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const modalVisible = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const modalTitle = ref('')
const formRef = ref()
const formData = reactive({ id: undefined as number | undefined, typeName: '', typeCode: '', status: 1, remark: '' })
const formRules = {
  typeName: [{ required: true, message: '请输入类型名称' }],
  typeCode: [{ required: true, message: '请输入类型编码' }]
}

// ==================== 级联数据相关 ====================
const dataVisible = ref(false)
const dataLoading = ref(false)
const currentTypeId = ref<number>()
const currentTypeName = ref('')
const dataTree = ref<CascadeDictNode[]>([])

// 树展开 keys（新增下级后自动展开父级，避免新节点不显示）
const dataExpandedKeys = ref<(string | number)[]>([])
const collectDataExpandKeys = (nodes: CascadeDictNode[]): (string | number)[] => {
  const keys: (string | number)[] = []
  const walk = (list: CascadeDictNode[]) => {
    for (const n of list || []) {
      if (n.children && n.children.length) {
        if (n.id != null) keys.push(n.id)
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return keys
}
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'value', key: 'value' },
  { title: '图标', key: 'icon', width: 80 },
  { title: '颜色', key: 'color', width: 140 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' }
]

const dataModalVisible = ref(false)
const dataModalType = ref<'add' | 'edit'>('add')
const dataModalTitle = ref('')
const dataFormRef = ref()
const dataForm = reactive({
  id: undefined as number | undefined,
  dictTypeId: 0,
  parentId: undefined as number | undefined,
  name: '',
  value: '',
  icon: '',
  color: '',
  sort: 0,
  status: 1
})
const dataFormRules = {
  name: [{ required: true, message: '请输入名称' }],
  value: [{ required: true, message: '请输入编码' }]
}

// 父级树选项：排除正在编辑的节点及其下级
const parentTreeData = computed<CascadeDictNode[]>(() => {
  const excludeId = dataModalType.value === 'edit' ? dataForm.id : undefined
  return buildParentTree(dataTree.value, excludeId)
})

const buildParentTree = (nodes: CascadeDictNode[], excludeId?: number): CascadeDictNode[] => {
  const result: CascadeDictNode[] = []
  for (const node of nodes || []) {
    if (excludeId != null && node.id === excludeId) continue
    const copy: CascadeDictNode = { ...node }
    if (node.children && node.children.length) {
      copy.children = buildParentTree(node.children, excludeId)
    } else {
      delete copy.children
    }
    result.push(copy)
  }
  return result
}

// ==================== 类型操作 ====================
const loadData = async () => {
  loading.value = true
  try {
    const res = await getCascadeDictTypeList({ typeName: queryParams.typeName, typeCode: queryParams.typeCode })
    const responseData = res?.data
    if (Array.isArray(responseData)) {
      data.value = responseData
    } else if (responseData?.records) {
      data.value = responseData.records
    } else {
      data.value = []
    }
    pagination.total = data.value.length
  } catch (error) {
    console.error('加载失败:', error)
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const handleReset = () => {
  queryParams.typeName = ''
  queryParams.typeCode = ''
  loadData()
}

const handleAdd = () => {
  modalType.value = 'add'
  modalTitle.value = '新增级联字典'
  formData.id = undefined
  formData.typeName = ''
  formData.typeCode = ''
  formData.status = 1
  formData.remark = ''
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  modalType.value = 'edit'
  modalTitle.value = '编辑级联字典'
  formData.id = record.id
  formData.typeName = record.typeName
  formData.typeCode = record.typeCode
  formData.status = record.status
  formData.remark = record.remark || ''
  modalVisible.value = true
}

const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除级联字典 "${record.typeName}" 吗？（存在级联数据时将无法删除）`,
    onOk: async () => {
      try {
        await deleteCascadeDictType(record.id)
        message.success('删除成功')
        loadData()
      } catch (error) {
        // 错误提示由 axios 拦截器统一处理
      }
    }
  })
}

const handleModalOk = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  try {
    if (modalType.value === 'add') {
      await addCascadeDictType(formData)
      message.success('新增成功')
    } else {
      await updateCascadeDictType(formData)
      message.success('编辑成功')
    }
    modalVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

// ==================== 级联数据操作 ====================
const handleCascadeData = async (record: any) => {
  currentTypeId.value = record.id
  currentTypeName.value = `${record.typeName} (${record.typeCode})`
  dataVisible.value = true
  await loadDataTree()
}

const loadDataTree = async () => {
  if (!currentTypeId.value) return
  dataLoading.value = true
  try {
    const res = await getCascadeDictTree({ typeId: currentTypeId.value })
    const responseData = res?.data
    dataTree.value = Array.isArray(responseData) ? responseData : []
    dataExpandedKeys.value = collectDataExpandKeys(dataTree.value)
  } catch (error) {
    console.error('加载级联数据失败:', error)
    message.error('加载级联数据失败')
  } finally {
    dataLoading.value = false
  }
}

const handleAddTop = () => {
  openDataModal('add', 0)
}

const handleAddChild = (record: CascadeDictNode) => {
  openDataModal('add', record.id)
}

const handleEditData = (record: CascadeDictNode) => {
  openDataModal('edit', undefined, record)
}

const openDataModal = (type: 'add' | 'edit', parentId?: number, record?: CascadeDictNode) => {
  dataModalType.value = type
  dataModalTitle.value = type === 'add' ? '新增级联数据' : '编辑级联数据'
  dataForm.id = record?.id
  dataForm.dictTypeId = currentTypeId.value!
  dataForm.parentId = type === 'add' ? (parentId === 0 ? undefined : parentId) : (record?.parentId === 0 ? undefined : record?.parentId)
  dataForm.name = record?.name || ''
  dataForm.value = record?.value || ''
  dataForm.icon = record?.icon || ''
  dataForm.color = record?.color || ''
  dataForm.sort = record?.sort ?? 0
  dataForm.status = record?.status ?? 1
  dataModalVisible.value = true
}

const handleDeleteData = (record: CascadeDictNode) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除节点 "${record.name}" 吗？（存在下级时将无法删除）`,
    onOk: async () => {
      try {
        await deleteCascadeDictData(record.id!)
        message.success('删除成功')
        loadDataTree()
      } catch (error) {
        // 错误提示由 axios 拦截器统一处理
      }
    }
  })
}

const handleDataModalOk = async () => {
  try {
    await dataFormRef.value.validate()
  } catch {
    return
  }
  const payload = {
    ...dataForm,
    parentId: dataForm.parentId ?? 0
  }
  try {
    if (dataModalType.value === 'add') {
      await addCascadeDictData(payload)
      message.success('新增成功')
    } else {
      await updateCascadeDictData(payload)
      message.success('编辑成功')
    }
    dataModalVisible.value = false
    await loadDataTree()
    if (dataModalType.value === 'add') {
      const pid = dataForm.parentId
      if (pid != null) {
        if (!dataExpandedKeys.value.includes(pid)) {
          dataExpandedKeys.value = [...dataExpandedKeys.value, pid]
        }
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const handleDataModalCancel = () => {
  dataModalVisible.value = false
  dataFormRef.value?.resetFields()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="less">
.cascade-dict-container {
  .search-form { margin-bottom: 16px; }
  .table-wrapper { .table-toolbar { margin-bottom: 16px; } }
  .cascade-data-toolbar { margin-bottom: 12px; }
  .color-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .color-dot {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>
