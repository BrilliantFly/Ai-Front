<template>
  <div class="menu-config-container">
    <!-- 类型切换 -->
    <a-card :bordered="false" class="type-tabs">
      <a-tabs v-model:activeKey="activeType" @change="handleTypeChange">
        <a-tab-pane key="1" tab="底部导航 (tabBar)" />
        <a-tab-pane key="2" tab="首页菜单" />
        <a-tab-pane key="3" tab="侧边栏" />
      </a-tabs>
    </a-card>

    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="名称">
          <a-input v-model:value="queryParams.menuName" placeholder="请输入菜单名称" allow-clear @press-enter="loadData" />
        </a-form-item>
        <a-form-item label="编码">
          <a-input v-model:value="queryParams.menuCode" placeholder="请输入菜单编码" allow-clear @press-enter="loadData" />
        </a-form-item>
        <a-form-item label="显示">
          <a-select v-model:value="queryParams.isShow" placeholder="全部" allow-clear style="width: 120px">
            <a-select-option :value="1">显示</a-select-option>
            <a-select-option :value="0">隐藏</a-select-option>
          </a-select>
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

    <!-- 表格区域 -->
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
          <template v-if="column.key === 'menuType'">
            <a-tag :color="typeColor(record.menuType)">
              {{ typeText(record.menuType) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'isShow'">
            <a-tag :color="record.isShow === 1 ? 'green' : 'red'">
              {{ record.isShow === 1 ? '显示' : '隐藏' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'isBig'">
            <a-tag :color="record.isBig === 1 ? 'blue' : 'default'">
              {{ record.isBig === 1 ? '是' : '否' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'icon'">
            <span v-if="record.icon" class="icon-cell">{{ record.icon }}</span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="600px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :rules="formRules">
        <a-form-item label="菜单名称" name="menuName">
          <a-input v-model:value="formData.menuName" placeholder="请输入菜单名称" />
        </a-form-item>
        <a-form-item label="菜单编码" name="menuCode">
          <a-input v-model:value="formData.menuCode" placeholder="如 home、customer、habit" />
        </a-form-item>
        <a-form-item label="页面路径">
          <a-input v-model:value="formData.path" placeholder="如 /pages/index/index" />
        </a-form-item>
        <a-form-item label="外部URL">
          <a-input v-model:value="formData.url" placeholder="外部链接地址（可选）" />
        </a-form-item>
        <a-form-item label="图标">
          <a-input v-model:value="formData.icon" placeholder="图标路径，如 static/images/home/customer.svg" />
        </a-form-item>
        <a-form-item label="选中图标">
          <a-input v-model:value="formData.selectedIcon" placeholder="选中态图标路径（可选）" />
        </a-form-item>
        <a-form-item label="是否显示">
          <a-radio-group v-model:value="formData.isShow">
            <a-radio :value="1">显示</a-radio>
            <a-radio :value="0">隐藏</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="是否凸起">
          <a-radio-group v-model:value="formData.isBig">
            <a-radio :value="1">是</a-radio>
            <a-radio :value="0">否</a-radio>
          </a-radio-group>
        </a-form-item>
        <template v-if="formData.isBig === 1">
          <a-form-item label="凸起图标">
            <a-input v-model:value="formData.bigIcon" placeholder="请输入凸起图标" />
          </a-form-item>
          <a-form-item label="凸起类型">
            <a-select v-model:value="formData.bigType" placeholder="请选择类型">
              <a-select-option value="jump">跳转</a-select-option>
              <a-select-option value="popup">弹出</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="凸起菜单列表">
            <a-textarea v-model:value="formData.bigList" placeholder='[{"title":"菜单1","path":"/pages/xxx"}]' :rows="2" />
          </a-form-item>
        </template>
        <a-form-item label="渲染类型">
          <a-select v-model:value="formData.renderType" placeholder="请选择渲染类型">
            <a-select-option :value="1">动态列表</a-select-option>
            <a-select-option :value="2">固定表单</a-select-option>
            <a-select-option :value="3">指定界面</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="权限编码">
          <a-input v-model:value="formData.permissionCode" placeholder="如 menu:home（可选，按角色过滤）" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import {
  getMenuConfigPage,
  addMenuConfig,
  updateMenuConfig,
  deleteMenuConfig,
  MenuConfigType
} from '@/api/system/menuConfig'

const route = useRoute()

/** 根据路由路径确定默认菜单类型：/system/menu-config/home → 首页菜单(type=2)，其余 → 底部导航(type=1) */
const resolveDefaultType = (): string => {
  if (String(route.path).includes('/menu-config/home')) {
    return String(MenuConfigType.HOME)
  }
  return String(MenuConfigType.TABBAR)
}

const activeType = ref<string>(resolveDefaultType())

const queryParams = reactive({
  menuName: '',
  menuCode: '',
  isShow: undefined as number | undefined
})

const typeText = (type?: number) => {
  switch (type) {
    case MenuConfigType.TABBAR: return '底部导航'
    case MenuConfigType.HOME: return '首页菜单'
    case MenuConfigType.SIDEBAR: return '侧边栏'
    default: return '未知'
  }
}

const typeColor = (type?: number) => {
  switch (type) {
    case MenuConfigType.TABBAR: return 'blue'
    case MenuConfigType.HOME: return 'green'
    case MenuConfigType.SIDEBAR: return 'purple'
    default: return 'default'
  }
}

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '名称', dataIndex: 'menuName', key: 'menuName', width: 100 },
  { title: '编码', dataIndex: 'menuCode', key: 'menuCode', width: 100 },
  { title: '类型', dataIndex: 'menuType', key: 'menuType', width: 90 },
  { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
  { title: '图标', dataIndex: 'icon', key: 'icon', ellipsis: true },
  { title: '显示', dataIndex: 'isShow', key: 'isShow', width: 60 },
  { title: '凸起', dataIndex: 'isBig', key: 'isBig', width: 60 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
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
const emptyForm = () => ({
  id: undefined as number | undefined,
  menuName: '',
  menuCode: '',
  menuType: Number(activeType.value) as number,
  parentId: 0,
  icon: '',
  selectedIcon: '',
  path: '',
  url: '',
  sort: 0,
  isShow: 1,
  isBig: 0,
  bigIcon: '',
  bigType: 'jump',
  bigList: '',
  renderType: 1,
  renderConfig: '',
  permissionId: undefined as number | undefined,
  permissionCode: ''
})
const formData = reactive(emptyForm())
const formRules = {
  menuName: [{ required: true, message: '请输入菜单名称' }],
  menuCode: [{ required: true, message: '请输入菜单编码' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      menuType: Number(activeType.value),
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }
    if (!params.menuName) delete params.menuName
    if (!params.menuCode) delete params.menuCode
    if (params.isShow === undefined || params.isShow === null) delete params.isShow
    const res = await getMenuConfigPage(params)
    const responseData = res?.data
    if (Array.isArray(responseData)) {
      data.value = responseData
      pagination.total = responseData.length
    } else if (responseData?.records) {
      data.value = responseData.records
      pagination.total = Number(responseData.total ?? responseData.records.length)
    } else {
      data.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('加载失败:', error)
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleTypeChange = () => {
  pagination.current = 1
  loadData()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleReset = () => {
  queryParams.menuName = ''
  queryParams.menuCode = ''
  queryParams.isShow = undefined
  loadData()
}

const handleAdd = () => {
  modalType.value = 'add'
  modalTitle.value = '新增菜单'
  Object.assign(formData, emptyForm())
  formData.menuType = Number(activeType.value)
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  modalType.value = 'edit'
  modalTitle.value = '编辑菜单'
  Object.assign(formData, emptyForm(), {
    id: record.id,
    menuName: record.menuName || '',
    menuCode: record.menuCode || '',
    menuType: record.menuType ?? Number(activeType.value),
    parentId: record.parentId ?? 0,
    icon: record.icon || '',
    selectedIcon: record.selectedIcon || '',
    path: record.path || '',
    url: record.url || '',
    sort: record.sort ?? 0,
    isShow: record.isShow ?? 1,
    isBig: record.isBig ?? 0,
    bigIcon: record.bigIcon || '',
    bigType: record.bigType || 'jump',
    bigList: record.bigList || '',
    renderType: record.renderType ?? 1,
    renderConfig: record.renderConfig || '',
    permissionId: record.permissionId,
    permissionCode: record.permissionCode || ''
  })
  modalVisible.value = true
}

const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除菜单 "${record.menuName}" 吗？`,
    onOk: async () => {
      try {
        await deleteMenuConfig(record.id)
        message.success('删除成功')
        loadData()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

const handleModalOk = async () => {
  try {
    await formRef.value.validate()
    if (modalType.value === 'add') {
      await addMenuConfig({ ...formData })
      message.success('新增成功')
    } else {
      await updateMenuConfig({ ...formData })
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

onMounted(() => { loadData() })
</script>

<style scoped lang="less">
.menu-config-container {
  .type-tabs {
    margin-bottom: 16px;
  }
  .search-form {
    margin-bottom: 16px;
  }
  .table-wrapper {
    .table-toolbar {
      margin-bottom: 16px;
    }
  }
  .icon-cell {
    font-size: 12px;
    color: #999;
  }
}
</style>
