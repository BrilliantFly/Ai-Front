<template>
  <a-modal
    v-bind="modalAttrs"
    :open="open"
    :wrap-class-name="wrapClass"
    @update:open="onOpenChange"
  >
    <template #title>
      <div class="biz-fullscreen-modal-title">
        <span class="biz-fullscreen-modal-title-text">{{ titleText }}</span>
        <span
          class="biz-fullscreen-toggle"
          :title="fullscreen ? '退出全屏' : '全屏'"
          @click.stop="toggleFullscreen"
        >
          <FullscreenOutlined v-if="!fullscreen" />
          <FullscreenExitOutlined v-else />
        </span>
      </div>
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons-vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const attrs = useAttrs()

/** 剥离 title: 由本组件统一渲染(含全屏按钮), 其余属性透传到 a-modal */
const modalAttrs = computed(() => {
  const { title, wrapClassName, 'wrap-class-name': wrap, ...rest } = attrs as Record<string, any>
  return rest
})

const titleText = computed(() => (attrs as Record<string, any>).title ?? '')

const onOpenChange = (v: boolean) => {
  // 关闭弹窗时重置全屏状态, 避免下次打开残留
  if (!v) fullscreen.value = false
  emit('update:open', v)
}

const fullscreen = ref(false)

const wrapClass = computed(() => {
  const base = (attrs as Record<string, any>)['wrap-class-name'] || (attrs as Record<string, any>).wrapClassName || ''
  return fullscreen.value ? `${base ? base + ' ' : ''}biz-modal-fullscreen` : base || undefined
})

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
}
</script>

<style>
/* 全屏弹窗: 撑满视口, body 区域滚动 */
.biz-modal-fullscreen .ant-modal {
  max-width: none !important;
  width: 100vw !important;
  height: 100vh;
  top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 auto;
}

.biz-modal-fullscreen .ant-modal-wrap {
  overflow: hidden;
}

.biz-modal-fullscreen .ant-modal-content {
  height: 100vh !important;
  border-radius: 0 !important;
  display: flex;
  flex-direction: column;
  padding: 0 24px 24px !important;
}

.biz-modal-fullscreen .ant-modal-header {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.biz-modal-fullscreen .ant-modal-body {
  flex: 1;
  overflow: auto;
}

.biz-modal-fullscreen .ant-modal-footer {
  flex-shrink: 0;
  margin-top: 16px;
}

/* 标题栏: 文字 + 全屏切换按钮 */
.biz-fullscreen-modal-title {
  display: flex;
  align-items: center;
  flex: 1;
  padding-right: 44px;
}

.biz-fullscreen-modal-title-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.biz-fullscreen-toggle {
  flex-shrink: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.biz-fullscreen-toggle:hover {
  color: #1677ff;
  background-color: rgba(22, 119, 255, 0.08);
}
</style>