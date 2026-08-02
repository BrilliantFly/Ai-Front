<template>
  <div class="menu-container">
    <!-- 搜索区域 -->
    <a-card :bordered="false" class="search-form">
      <a-form :model="queryParams" layout="inline">
        <a-form-item label="菜单名称">
          <a-input v-model:value="queryParams.menuName" placeholder="请输入菜单名称" allow-clear />
        </a-form-item>
        <a-form-item label="菜单类型">
          <a-select v-model:value="queryParams.menuType" placeholder="请选择类型" allow-clear style="width: 100px">
            <a-select-option :value="1">目录</a-select-option>
            <a-select-option :value="2">菜单</a-select-option>
            <a-select-option :value="3">按钮</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParams.status" placeholder="请选择状态" allow-clear style="width: 100px">
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
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 表格区域 -->
    <a-card :bordered="false" class="table-wrapper">
      <a-space class="table-toolbar">
        <a-button type="primary" @click="handleAdd(null)">
          <template #icon><PlusOutlined /></template>
          新增
        </a-button>
        <a-button type="link" @click="expandAll">{{ expand ? '折叠' : '展开' }}</a-button>
      </a-space>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :expand-row-keys="expandedRowKeys"
        @expand="handleExpand"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <SvgIcon v-if="record.icon" :name="record.icon" :size="18" />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'menuType'">
            <a-tag :color="record.menuType === 1 ? 'blue' : record.menuType === 2 ? 'green' : 'orange'">
              {{ record.menuType === 1 ? '目录' : record.menuType === 2 ? '菜单' : '按钮' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '显示' : '隐藏' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleAdd(record)">新增子菜单</a-button>
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
      width="700px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" :rules="formRules">
        <a-form-item label="上级菜单" name="parentId">
          <a-tree-select
            v-model:value="formData.parentId"
            :tree-data="menuTreeData"
            :field-names="{ label: 'menuName', value: 'id', children: 'children' }"
            placeholder="请选择上级菜单"
            allow-clear
            tree-default-expand-all
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="菜单类型" name="menuType">
          <a-radio-group v-model:value="formData.menuType" @change="handleTypeChange">
            <a-radio :value="1">目录</a-radio>
            <a-radio :value="2">菜单</a-radio>
            <a-radio :value="3">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="菜单名称" name="menuName">
          <a-input v-model:value="formData.menuName" placeholder="请输入菜单名称" />
        </a-form-item>
        <a-form-item label="路由地址" name="path">
          <a-input v-model:value="formData.path" placeholder="请输入路由地址" />
        </a-form-item>
        <a-form-item v-if="formData.menuType === 2" label="组件路径" name="component">
          <a-input v-model:value="formData.component" placeholder="请输入组件路径" />
        </a-form-item>
        <a-form-item label="权限标识" name="perms">
          <a-input v-model:value="formData.perms" placeholder="请输入权限标识" />
        </a-form-item>
        <a-form-item label="菜单图标" name="icon">
          <a-input-group compact style="display: flex">
            <a-input v-model:value="formData.icon" placeholder="点击右侧按钮选择图标" style="flex: 1" />
            <a-button @click="iconPickerVisible = true">
              <template #icon><AppstoreOutlined /></template>
            </a-button>
          </a-input-group>
          <div class="icon-preview" v-if="formData.icon" @click="iconPickerVisible = true">
            <SvgIcon :name="formData.icon" :size="22" />
            <span class="icon-preview-name">{{ formData.icon }}</span>
          </div>
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formData.status">
            <a-radio :value="1">显示</a-radio>
            <a-radio :value="0">隐藏</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图标选择弹窗 -->
    <a-modal v-model:open="iconPickerVisible" title="选择图标" width="640px" :footer="null">
      <div class="icon-picker-grid">
        <div
          v-for="icon in menuIcons"
          :key="icon"
          class="icon-picker-item"
          :class="{ active: formData.icon === icon }"
          @click="selectIcon(icon)"
        >
          <div class="icon-picker-icon">
            <SvgIcon :name="icon" :size="28" />
          </div>
          <span class="icon-picker-name">{{ icon }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import { SearchOutlined, PlusOutlined, AppstoreOutlined } from '@ant-design/icons-vue'
  import SvgIcon from '@/components/SvgIcon'
  import { getMenuList, addMenu, updateMenu, deleteMenu } from '@/api/system/menu'

  // 查询参数
  const queryParams = reactive({
    menuName: '',
    menuType: undefined as number | undefined,
    status: undefined as number | undefined
  })

  // 表格列定义
  const columns = [
    { title: '菜单名称', dataIndex: 'menuName', key: 'menuName', width: 200 },
    { title: '图标', key: 'icon', width: 80 },
    { title: '类型', key: 'menuType', width: 80 },
    { title: '路由地址', dataIndex: 'path', key: 'path' },
    { title: '权限标识', dataIndex: 'perms', key: 'perms' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '状态', key: 'status', width: 80 },
    { title: '操作', key: 'action', width: 200 }
  ]

  // 数据源
  const tableData = ref<any[]>([])
  const menuTreeData = ref<any[]>([])
  const loading = ref(false)

  // 展开状态
  const expand = ref(true)
  const expandedRowKeys = ref<number[]>([])

  // 弹窗
  const modalVisible = ref(false)
  const modalType = ref<'add' | 'edit'>('add')
  const modalTitle = ref('')
  const formRef = ref()
  const formData = reactive({
    id: undefined as number | undefined,
    parentId: 0,
    menuType: 1,
    menuName: '',
    path: '',
    component: '',
    perms: '',
    icon: '',
    sort: 0,
    status: 1
  })

  const formRules = {
    menuName: [{ required: true, message: '请输入菜单名称' }],
    menuType: [{ required: true, message: '请选择菜单类型' }],
    status: [{ required: true, message: '请选择状态' }]
  }

  // 构建树形
  const buildTree = (list: any[], parentId: number = 0): any[] => {
    return list
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(list, item.id)
      }))
  }

  // 展开/折叠
  const handleExpand = (expanded: boolean, record: any) => {
    expandedRowKeys.value = expanded
      ? [...expandedRowKeys.value, record.id]
      : expandedRowKeys.value.filter(id => id !== record.id)
  }

  const expandAll = () => {
    expand.value = !expand.value
    expandedRowKeys.value = expand.value ? tableData.value.map((item: any) => item.id) : []
  }

  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      const res = await getMenuList({})
      console.log('菜单数据:', res)
      const list = res?.data || res?.data?.records || []
      tableData.value = buildTree(Array.isArray(list) ? list : [])
      menuTreeData.value = buildTree(Array.isArray(list) ? list : [])
      expandedRowKeys.value = expand.value ? tableData.value.map((item: any) => item.id) : []
    } catch (error) {
      console.error('加载失败:', error)
      message.error('加载失败')
    } finally {
      loading.value = false
    }
  }

  // 新增
  const handleAdd = (record: any) => {
    modalType.value = 'add'
    modalTitle.value = '新增菜单'
    formData.id = undefined
    formData.parentId = record?.id || 0
    formData.menuType = record ? 2 : 1
    formData.menuName = ''
    formData.path = ''
    formData.component = ''
    formData.perms = ''
    formData.icon = ''
    formData.sort = 0
    formData.status = 1
    modalVisible.value = true
  }

  // 编辑
  const handleEdit = (record: any) => {
    modalType.value = 'edit'
    modalTitle.value = '编辑菜单'
    formData.id = record.id
    formData.parentId = record.parentId
    formData.menuType = record.menuType
    formData.menuName = record.menuName
    formData.path = record.path || ''
    formData.component = record.component || ''
    formData.perms = record.perms || ''
    formData.icon = record.icon || ''
    formData.sort = record.sort || 0
    formData.status = record.status
    modalVisible.value = true
  }

  // 类型变更
  const handleTypeChange = () => {
    formData.path = ''
    formData.component = ''
    formData.perms = ''
  }

  // 删除
  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除菜单 "${record.menuName}" 吗？`,
      onOk: async () => {
        try {
          await deleteMenu(record.id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 提交
  const handleModalOk = async () => {
    try {
      await formRef.value.validate()
      if (modalType.value === 'add') {
        await addMenu(formData)
        message.success('新增成功')
      } else {
        await updateMenu(formData)
        message.success('编辑成功')
      }
      modalVisible.value = false
      loadData()
    } catch (error) {}
  }

  // 取消
  const handleModalCancel = () => {
    modalVisible.value = false
    formRef.value?.resetFields()
  }

  /** SVG 图标清单（与 src/assets/icons 目录一致） */
  const menuIcons = [
    'bug',
    'collapsed',
    'color-bg',
    'color-font',
    'compo',
    'computer',
    'document',
    'editor',
    'excel',
    'flow',
    'font-align',
    'font-bold',
    'font-italic',
    'font-shadow',
    'form',
    'github',
    'heart',
    'hints',
    'home',
    'image',
    'like',
    'linking',
    'locale',
    'location',
    'message',
    'moon',
    'person',
    'pushpin-fill',
    'pushpin-line',
    'screen-full',
    'screen-normal',
    'search',
    'sun',
    'system',
    'table',
    'tree',
    'unfold',
    'video'
  ]

  const iconPickerVisible = ref(false)

  /** 选择图标 */
  const selectIcon = (icon: string) => {
    formData.icon = icon
    iconPickerVisible.value = false
  }

  onMounted(() => {
    loadData()
  })
</script>

<style scoped lang="less">
  .menu-container {
    .search-form {
      margin-bottom: 16px;
    }
    .table-wrapper {
      .table-toolbar {
        margin-bottom: 16px;
      }
    }
  }
  /* 弹窗内容 teleport 到 body，样式必须在顶层（不能嵌套在 .menu-container 内） */
  .icon-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 12px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
    &:hover {
      border-color: #1890ff;
    }
    .icon-preview-name {
      font-size: 12px;
      color: #666;
    }
  }
  .icon-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 72px);
    justify-content: center;
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
    .icon-picker-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-sizing: border-box;
      width: 72px;
      height: 78px;
      padding: 10px 6px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        border-color: #1890ff;
        background: #e6f7ff;
      }
      &.active {
        border-color: #1890ff;
        background: #e6f7ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
      .icon-picker-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .icon-picker-name {
        font-size: 12px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 64px;
      }
    }
  }
</style>
