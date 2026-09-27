<template>
    <view class="industry-page">
        <!-- hero 渐变页头（欢迎语视觉基准） -->
        <view class="hero-bar">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-title">
                    <text class="hero-name">行业产品</text>
                    <text class="hero-sub">集中维护行业产品档案与行业归属</text>
                </view>
            </view>
        </view>

        <!-- 搜索 -->
        <view class="search-section">
            <view class="search-box">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索产品名称"
                    placeholder-class="search-placeholder"
                    confirm-type="search"
                    @input="onKeywordInput"
                />
                <text v-if="keyword" class="search-clear" @tap="clearKeyword">×</text>
            </view>
        </view>

        <!-- 所属行业筛选 chips（单选常驻） -->
        <scroll-view class="chips-row" scroll-x :show-scrollbar="false">
            <view
                class="filter-chip"
                :class="{ active: activeIndustryId === '' }"
                @tap="switchIndustry('')"
            >
                全部行业
            </view>
            <view
                v-for="opt in industryOptions"
                :key="String(opt.value)"
                class="filter-chip"
                :class="{ active: isIndustryActive(opt.value) }"
                @tap="switchIndustry(opt.value)"
            >
                {{ opt.label }}
            </view>
        </scroll-view>

        <!-- 产品列表（z-paging 分页流） -->
        <view class="list-wrap">
            <z-paging
                ref="paging"
                v-model="productList"
                @query="queryList"
                :fixed="false"
                height="100%"
                :use-inner-scroll="true"
            >
                <view
                    v-for="item in productList"
                    :key="String(item.id)"
                    class="prod-card"
                    hover-class="prod-card-hover"
                >
                    <view class="card-head">
                        <text class="card-title">{{ item.productName || '--' }}</text>
                        <text v-if="item.lifeCycle" class="code-tag">{{ item.lifeCycle }}</text>
                    </view>
                    <view v-if="(item.industryNames || []).length" class="tag-wrap card-tags">
                        <text v-for="name in item.industryNames" :key="name" class="tag-chip">{{
                            name
                        }}</text>
                    </view>
                    <view class="card-meta">
                        <text v-if="item.category" class="meta-item">分类 {{ item.category }}</text>
                    </view>
                    <text class="card-desc">{{ item.productConcept || '暂无产品概念描述' }}</text>
                    <view class="card-actions">
                        <view class="action-btn" @tap.stop="openDetail(item)">详情</view>
                        <view class="action-btn" @tap.stop="goEdit(item)">编辑</view>
                        <view class="action-btn danger" @tap.stop="confirmDelete(item)">删除</view>
                    </view>
                </view>

                <!-- 空态 / 错误态 -->
                <template #empty>
                    <view class="empty-state">
                        <template v-if="loadFailed">
                            <view class="empty-icon">!</view>
                            <text class="empty-title">产品数据加载失败</text>
                            <text class="empty-desc">请检查网络后重试</text>
                            <view class="empty-btn" @tap="reload">重试</view>
                        </template>
                        <template v-else>
                            <view class="empty-icon">产</view>
                            <text class="empty-title">暂无产品数据</text>
                            <text class="empty-desc">点击下方按钮创建你的第一个产品</text>
                            <view class="empty-btn" @tap="goCreate">新建产品</view>
                        </template>
                    </view>
                </template>
            </z-paging>
        </view>

        <!-- 悬浮新建 -->
        <view class="fab" hover-class="fab-hover" @tap="goCreate">+</view>

        <!-- 产品详情（底部弹层，只读渲染 productSections；非全屏固定高度，可全屏） -->
        <uni-popup ref="detailPopup" type="bottom">
            <view class="sheet-panel" :class="{ expanded: detailExpanded }">
                <view class="sheet-handle"></view>

                <view class="sheet-hero">
                    <view class="deco-ring"></view>
                    <view class="deco-dot"></view>
                    <view class="sheet-hero-top">
                        <view class="sheet-hero-avatar">{{ heroInitial }}</view>
                        <view class="sheet-hero-main">
                            <text class="sheet-hero-title">{{
                                detail.productName || '产品详情'
                            }}</text>
                            <text class="sheet-hero-sub">{{ heroSub }}</text>
                        </view>
                        <view class="hero-expand" @tap="toggleDetailExpand">
                            <text class="hero-expand-text">{{
                                detailExpanded ? '收起' : '全屏'
                            }}</text>
                        </view>
                        <view class="sheet-hero-close" @tap="closeDetail">
                            <text class="sheet-hero-close-text">×</text>
                        </view>
                    </view>
                    <view v-if="(detail.industryNames || []).length" class="hero-tags">
                        <text v-for="name in detail.industryNames" :key="name" class="hero-tag">{{
                            name
                        }}</text>
                    </view>
                </view>

                <scroll-view scroll-y class="sheet-scroll">
                    <view v-for="section in readSections" :key="section.title" class="read-section">
                        <SectionCard
                            :title="section.title"
                            :collapsible="true"
                            :default-collapsed="true"
                        >
                            <view
                                v-for="block in section.blocks"
                                :key="block.key"
                                class="read-block"
                            >
                                <text class="read-block-title">{{ block.title }}</text>
                                <template v-for="field in block.fields">
                                    <FieldItem
                                        v-if="isTagField(field.key)"
                                        :key="field.key"
                                        :label="field.label"
                                    >
                                        <view class="tag-wrap">
                                            <text
                                                v-for="tag in tagValues(field)"
                                                :key="tag"
                                                class="tag-chip"
                                                >{{ tag }}</text
                                            >
                                            <text
                                                v-if="!tagValues(field).length"
                                                class="field-empty"
                                                >--</text
                                            >
                                        </view>
                                    </FieldItem>
                                    <FieldItem
                                        v-else
                                        :key="field.key"
                                        :label="field.label"
                                        :value="displayValue(field)"
                                    />
                                </template>
                            </view>
                        </SectionCard>
                    </view>
                    <view class="sheet-bottom-space"></view>
                </scroll-view>

                <view class="sheet-bottom-bar">
                    <view class="sheet-btn danger" @tap="confirmDeleteFromSheet">删除</view>
                    <view class="sheet-btn primary" @tap="goEditFromSheet">编辑</view>
                </view>
            </view>
        </uni-popup>

        <!-- 新建/编辑产品（底部弹层表单，替代整页表单路由） -->
        <ProductFormSheet
            :show="formVisible"
            :mode="formMode"
            :record-id="formRecordId"
            @close="formVisible = false"
            @saved="onFormSaved"
        />
    </view>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import SectionCard from '@/components/customer/SectionCard.vue'
import FieldItem from '@/components/customer/FieldItem.vue'
import { getIndustryList, type BizIndustry } from '@/api/biz/industry'
import {
    getProductPage,
    getProductDetail,
    deleteProduct,
    type BizIndustryProduct
} from '@/api/biz/industry/product'
import { productSections } from '@/config/product-sections'
import type { UniFieldDef, UniSectionDef } from '@/config/industry-sections'
import ProductFormSheet from '@/components/industry/ProductFormSheet.vue'

const paging = shallowRef()
const keyword = ref('')
const productList = ref<BizIndustryProduct[]>([])
const loadFailed = ref(false)

/* 筛选：所属行业（雪花 ID 不做 Number 转换，避免精度丢失） */
const industryOptions = ref<{ label: string; value: number | string }[]>([])
const activeIndustryId = ref<number | string>('')

let keywordTimer: ReturnType<typeof setTimeout> | undefined

/* ---------- 列表分页 ---------- */
const queryList = async (pageNo: number, pageSize: number) => {
    try {
        const params: any = { pageNum: pageNo, pageSize }
        const kw = keyword.value.trim()
        if (kw) params.productName = kw
        if (activeIndustryId.value !== '') params.industryId = activeIndustryId.value
        const res = await getProductPage(params)
        loadFailed.value = false
        paging.value?.complete(res.records || [], res.total)
    } catch (error) {
        console.error('加载产品列表失败', error)
        loadFailed.value = true
        paging.value?.complete(false)
    }
}

/** 搜索防抖 300ms */
const onKeywordInput = () => {
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
        paging.value?.reload()
    }, 300)
}

const clearKeyword = () => {
    keyword.value = ''
    paging.value?.reload()
}

const reload = () => {
    loadFailed.value = false
    paging.value?.reload()
}

const isIndustryActive = (value: number | string) =>
    activeIndustryId.value !== '' && String(activeIndustryId.value) === String(value)

const switchIndustry = (value: number | string) => {
    activeIndustryId.value = value
    paging.value?.reload()
}

const loadIndustryOptions = async () => {
    try {
        const list = (await getIndustryList()) || []
        industryOptions.value = list
            .filter((item: BizIndustry) => item.id !== undefined && item.id !== null)
            .map((item: BizIndustry) => ({
                label: item.industryName || String(item.id),
                value: item.id
            }))
    } catch (error) {
        console.error('加载行业选项失败', error)
        industryOptions.value = []
    }
}

/* ---------- 详情弹层（只读） ---------- */
interface ReadBlock {
    key: string
    title: string
    fields: UniFieldDef[]
}

interface ReadSection {
    title: string
    blocks: ReadBlock[]
}

/** 提交字段 → 展示字段（行业提交 id，详情返回 name） */
const NAME_FIELD_MAP: Record<string, string> = {
    industryIds: 'industryNames'
}

const readSections = computed<ReadSection[]>(() =>
    productSections.map((section: UniSectionDef) => ({
        title: section.title,
        blocks: (section.subSections || []).flatMap((sub) => {
            const blocks: ReadBlock[] = []
            if (sub.fields && sub.fields.length) {
                blocks.push({
                    key: `${section.title}-${sub.title}`,
                    title: sub.title,
                    fields: sub.fields
                })
            }
            for (const leaf of sub.subSections || []) {
                blocks.push({
                    key: `${section.title}-${sub.title}-${leaf.title}`,
                    title: leaf.title,
                    fields: leaf.fields || []
                })
            }
            return blocks
        })
    }))
)

const detailPopup = shallowRef()
const detail = ref<BizIndustryProduct>({} as BizIndustryProduct)
const detailId = ref('')

/** 详情弹层全屏/收起（非全屏时固定高度，全屏撑满） */
const detailExpanded = ref(false)
const toggleDetailExpand = () => {
    detailExpanded.value = !detailExpanded.value
}

const heroInitial = computed(() => {
    const name = (detail.value.productName || '').trim()
    return name ? name.charAt(0) : '产'
})

const heroSub = computed(() => {
    const lifeCycle = detail.value.lifeCycle
    const category = detail.value.category
    const parts = [lifeCycle, category ? `分类 ${category}` : ''].filter(Boolean)
    return parts.length ? parts.join(' · ') : '产品档案'
})

const isTagField = (key: string) => !!NAME_FIELD_MAP[key]

const tagValues = (field: UniFieldDef): string[] => {
    const raw = (detail.value as any)[NAME_FIELD_MAP[field.key] || field.key]
    if (Array.isArray(raw)) return raw.map((item) => String(item)).filter(Boolean)
    if (raw === undefined || raw === null || raw === '') return []
    return String(raw)
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
}

const displayValue = (field: UniFieldDef) => {
    const raw = (detail.value as any)[field.key]
    if (raw === undefined || raw === null) return ''
    if (field.type === 'select' && field.options) {
        const opt = field.options.find((item) => String(item.value) === String(raw))
        if (opt) return opt.label
    }
    if (Array.isArray(raw))
        return raw
            .map((item) => String(item))
            .filter(Boolean)
            .join('、')
    return String(raw)
}

const openDetail = async (item: BizIndustryProduct) => {
    if (!item.id) return
    detailId.value = String(item.id)
    detail.value = {} as BizIndustryProduct
    detailPopup.value?.open()
    try {
        detail.value = (await getProductDetail(detailId.value)) || ({} as BizIndustryProduct)
    } catch (error) {
        console.error('加载产品详情失败', error)
        uni.showToast({ title: '加载产品详情失败', icon: 'none' })
    }
}

const closeDetail = () => {
    detailPopup.value?.close()
}

const goEditFromSheet = () => {
    if (!detailId.value) return
    closeDetail()
    formMode.value = 'edit'
    formRecordId.value = detailId.value
    formVisible.value = true
}

/* ---------- 卡片操作 ---------- */
/** 新建/编辑产品（底部弹层表单） */
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formRecordId = ref<number | string>('')

const goCreate = () => {
    formMode.value = 'create'
    formRecordId.value = ''
    formVisible.value = true
}

const goEdit = (item: BizIndustryProduct) => {
    if (!item.id) return
    formMode.value = 'edit'
    formRecordId.value = item.id
    formVisible.value = true
}

const onFormSaved = () => {
    paging.value?.reload()
}

const removeProduct = async (id: number | string) => {
    try {
        await deleteProduct(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        paging.value?.reload()
    } catch (error) {
        console.error('删除产品失败', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
    }
}

const confirmDelete = (item: BizIndustryProduct) => {
    if (!item.id) return
    uni.showModal({
        title: '提示',
        content: '确定删除该产品？',
        success: async (res) => {
            if (!res.confirm) return
            await removeProduct(item.id as number | string)
        }
    })
}

const confirmDeleteFromSheet = () => {
    if (!detailId.value) return
    const id = detailId.value
    uni.showModal({
        title: '提示',
        content: '确定删除该产品？',
        success: async (res) => {
            if (!res.confirm) return
            closeDetail()
            await removeProduct(id)
        }
    })
}

let inited = false
onLoad(() => {
    loadIndustryOptions()
})

onShow(() => {
    if (inited) {
        paging.value?.reload()
    }
    inited = true
})
</script>

<style scoped lang="scss">
.industry-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 90rpx;
}

/* ===== hero 渐变页头（欢迎语视觉基准） ===== */
.hero-bar {
    position: relative;
    overflow: hidden;
    padding: 36rpx 40rpx 52rpx;
    background: var(--gradient-primary);

    /* #ifdef APP-PLUS */
    padding-top: calc(36rpx + var(--status-bar-height));
    /* #endif */

    &::before {
        content: '';
        position: absolute;
        right: -60rpx;
        top: -60rpx;
        width: 260rpx;
        height: 260rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100rpx;
        bottom: -90rpx;
        width: 220rpx;
        height: 220rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
    }
}

.deco-ring {
    position: absolute;
    top: -56rpx;
    right: 34rpx;
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    border: 3rpx solid rgba(255, 255, 255, 0.16);
    pointer-events: none;
}

.deco-dot {
    position: absolute;
    right: 70rpx;
    bottom: 32rpx;
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 28rpx -18rpx 0 rgba(255, 255, 255, 0.12), -18rpx 24rpx 0 rgba(255, 255, 255, 0.12);
    pointer-events: none;
}

.hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
}

.hero-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.hero-name {
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.hero-sub {
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

/* ===== 搜索 ===== */
.search-section {
    padding: 24rpx 40rpx 0;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 38rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    border: 1rpx solid var(--color-border-light);
}

.search-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 28rpx;
    color: var(--color-text);
}

.search-placeholder {
    color: var(--color-text-tertiary);
}

.search-clear {
    font-size: 36rpx;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
    flex-shrink: 0;
}

/* ===== 筛选 chips ===== */
.chips-row {
    white-space: nowrap;
    padding: 22rpx 40rpx 0;
    box-sizing: border-box;
}

.filter-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 60rpx;
    padding: 0 30rpx;
    margin-right: 16rpx;
    border-radius: 30rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 26rpx;
    font-weight: 500;
    white-space: nowrap;
}

.filter-chip.active {
    background: var(--color-primary);
    color: var(--color-btn-text);
    box-shadow: var(--shadow-glow);
}

/* ===== 列表 ===== */
.list-wrap {
    margin-top: 20rpx;
    height: calc(100vh - 480rpx);
    min-height: 320rpx;
}

.prod-card {
    margin: 0 40rpx 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.prod-card-hover {
    background: var(--color-surface-hover);
}

.card-head {
    display: flex;
    align-items: center;
    gap: 14rpx;
    flex-wrap: wrap;
}

.card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.code-tag {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    white-space: nowrap;
}

.tag-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.tag-chip {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    white-space: nowrap;
}

.card-tags {
    margin-top: 14rpx;
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 14rpx;
    flex-wrap: wrap;
}

.meta-item {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}

.card-desc {
    display: -webkit-box;
    margin-top: 10rpx;
    font-size: 25rpx;
    line-height: 1.6;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 20rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.action-btn {
    padding: 10rpx 28rpx;
    border-radius: 28rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
}

.action-btn.danger {
    background: var(--color-danger-soft);
    color: var(--color-danger-rgb);
}

/* ===== 空态 ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 110rpx 40rpx 0;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 64rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-title {
    margin-top: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.empty-desc {
    margin-top: 12rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

.empty-btn {
    margin-top: 36rpx;
    padding: 20rpx 64rpx;
    border-radius: 40rpx;
    background: var(--color-primary);
    color: var(--color-btn-text);
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: var(--shadow-glow);
}

/* ===== FAB ===== */
.fab {
    position: fixed;
    right: 40rpx;
    bottom: calc(40rpx + env(safe-area-inset-bottom));
    z-index: 50;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    line-height: 1;
    box-shadow: var(--shadow-glow);
}

.fab-hover {
    transform: scale(0.96);
}

/* ===== 详情弹层 ===== */
.sheet-panel {
    width: 100%;
    background: var(--color-bg-app);
    border-radius: 24rpx 24rpx 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sheet-handle {
    width: 72rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--color-border);
    margin: 16rpx auto 0;
    flex-shrink: 0;
}

.sheet-hero {
    position: relative;
    overflow: hidden;
    padding: 24rpx 40rpx 36rpx;
    background: var(--gradient-primary);
    flex-shrink: 0;

    &::before {
        content: '';
        position: absolute;
        right: -60rpx;
        top: -60rpx;
        width: 260rpx;
        height: 260rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
    }

    &::after {
        content: '';
        position: absolute;
        left: -100rpx;
        bottom: -90rpx;
        width: 220rpx;
        height: 220rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
    }
}

.sheet-hero-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.sheet-hero-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.14);
    color: var(--color-btn-text);
    font-size: 36rpx;
    font-weight: 700;
    flex-shrink: 0;
}

.sheet-hero-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.sheet-hero-title {
    font-size: 36rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-btn-text);
}

.sheet-hero-sub {
    margin-top: 8rpx;
    font-size: 22rpx;
    line-height: 1.5;
    color: var(--color-btn-text);
    opacity: 0.78;
}

.sheet-hero-close {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.16);
    flex-shrink: 0;
}

.sheet-hero-close-text {
    font-size: 44rpx;
    line-height: 1;
    color: var(--color-btn-text);
}

.hero-expand {
    padding: 10rpx 20rpx;
    border-radius: 28rpx;
    background: rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
}

.hero-expand-text {
    font-size: 22rpx;
    color: var(--color-btn-text);
}

.hero-tags {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 18rpx;
}

.hero-tag {
    font-size: 20rpx;
    padding: 6rpx 18rpx;
    border-radius: 22rpx;
    background: rgba(255, 255, 255, 0.18);
    color: var(--color-btn-text);
    white-space: nowrap;
}

.sheet-scroll {
    max-height: calc(70vh - 120rpx);
    min-height: 200rpx;

    .sheet-panel.expanded & {
        max-height: calc(100vh - 280rpx - env(safe-area-inset-bottom));
    }
}

.read-section {
    display: block;
}

.read-block {
    padding: 4rpx 0 8rpx;

    &:first-child {
        padding-top: 20rpx;
    }
}

.read-block-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text);
    padding-bottom: 6rpx;
}

.field-empty {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.sheet-bottom-space {
    height: 24rpx;
}

.sheet-bottom-bar {
    flex-shrink: 0;
    display: flex;
    gap: 20rpx;
    padding: 16rpx 40rpx calc(16rpx + env(safe-area-inset-bottom));
    background: var(--color-surface);
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.sheet-btn {
    flex: 1;
    height: 84rpx;
    border-radius: 42rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
}

.sheet-btn.danger {
    background: var(--color-danger-soft);
    color: var(--color-danger-rgb);
    border: 1rpx solid var(--color-danger-soft);
}

.sheet-btn.primary {
    background: var(--color-primary);
    color: var(--color-btn-text);
    box-shadow: var(--shadow-glow);
}
</style>
