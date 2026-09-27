<template>
    <view class="industry-page">
        <!-- 顶部状态栏（小记风格 sticky） -->
        <view class="header">
            <view class="header-left">
                <view class="back-btn" @tap="goBack">
                    <text class="back-icon">‹</text>
                </view>
                <text class="header-title">行业企业</text>
            </view>
        </view>

        <!-- 搜索 -->
        <view class="search-section">
            <view class="search-box">
                <text class="search-icon">🔍</text>
                <input
                    v-model="keyword"
                    class="search-input"
                    placeholder="搜索企业或平台名称"
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

        <!-- 是否上市筛选 chips -->
        <scroll-view class="chips-row" scroll-x :show-scrollbar="false">
            <view
                v-for="chip in listedChips"
                :key="String(chip.value)"
                class="filter-chip"
                :class="{ active: String(activeListed) === String(chip.value) }"
                @tap="switchListed(chip.value)"
            >
                {{ chip.label }}
            </view>
        </scroll-view>

        <!-- 企业列表（z-paging 分页流） -->
        <view class="list-wrap">
            <z-paging
                ref="paging"
                v-model="enterpriseList"
                @query="queryList"
                :fixed="false"
                height="100%"
                :use-inner-scroll="true"
            >
                <view
                    v-for="item in enterpriseList"
                    :key="String(item.id)"
                    class="ent-card"
                    hover-class="ent-card-hover"
                >
                    <view class="card-head">
                        <text class="card-title">{{ item.enterpriseName || '--' }}</text>
                        <text
                            class="listed-tag"
                            :class="item.isListed === 1 ? 'tag-yes' : 'tag-no'"
                        >
                            {{ listedText(item) }}
                        </text>
                    </view>
                    <view v-if="(item.industryNames || []).length" class="tag-wrap card-tags">
                        <text v-for="name in item.industryNames" :key="name" class="tag-chip">{{
                            name
                        }}</text>
                    </view>
                    <view class="card-meta">
                        <text v-if="item.enterpriseType" class="meta-item">{{
                            item.enterpriseType
                        }}</text>
                        <text v-if="item.scale" class="meta-item">规模 {{ item.scale }}</text>
                    </view>
                    <text class="card-desc">{{ item.mainBusiness || '暂无主营业务描述' }}</text>
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
                            <text class="empty-title">企业数据加载失败</text>
                            <text class="empty-desc">请检查网络后重试</text>
                            <view class="empty-btn" @tap="reload">重试</view>
                        </template>
                        <template v-else>
                            <view class="empty-icon">企</view>
                            <text class="empty-title">暂无企业数据</text>
                            <text class="empty-desc">点击下方按钮创建你的第一个企业</text>
                            <view class="empty-btn" @tap="goCreate">新建企业</view>
                        </template>
                    </view>
                </template>
            </z-paging>
        </view>

        <!-- 悬浮新建 -->
        <view class="fab" hover-class="fab-hover" @tap="goCreate">+</view>

        <!-- 企业详情（底部弹层，只读渲染 enterpriseSections；非全屏固定高度，可全屏） -->
        <uni-popup ref="detailPopup" type="bottom">
            <view class="sheet-panel" :class="{ expanded: detailExpanded }">
                <view class="sheet-handle"></view>

                <!-- 标题行（小记风格：居中标题 + 右上角全屏/收起 + 关闭） -->
                <view class="sheet-title-row">
                    <text class="sheet-title">{{ detail.enterpriseName || '企业详情' }}</text>
                    <view class="sheet-title-actions">
                        <view class="sheet-expand" @tap="toggleDetailExpand">
                            <text class="sheet-expand-text">{{
                                detailExpanded ? '收起' : '全屏'
                            }}</text>
                        </view>
                        <view class="sheet-close" @tap="closeDetail">×</view>
                    </view>
                </view>

                <view v-if="(detail.industryNames || []).length" class="hero-tags">
                    <text v-for="name in detail.industryNames" :key="name" class="hero-tag">{{
                        name
                    }}</text>
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

        <!-- 新建/编辑企业（底部弹层表单，替代整页表单路由） -->
        <EnterpriseFormSheet
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
    getEnterprisePage,
    getEnterpriseDetail,
    deleteEnterprise,
    type BizIndustryEnterprise
} from '@/api/biz/industry/enterprise'
import { enterpriseSections, type UniFieldDef } from '@/config/enterprise-sections'
import EnterpriseFormSheet from '@/components/industry/EnterpriseFormSheet.vue'

import { switchTabCompat } from '@/utils/util'

/* 顶部状态栏返回（小记同款） */
const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack()
    } else {
        switchTabCompat('/pages/index/index')
    }
}

const paging = shallowRef()
const keyword = ref('')
const enterpriseList = ref<BizIndustryEnterprise[]>([])
const loadFailed = ref(false)

/* 筛选：所属行业（雪花 ID 不做 Number 转换，避免精度丢失） */
const industryOptions = ref<{ label: string; value: number | string }[]>([])
const activeIndustryId = ref<number | string>('')

const listedChips = [
    { label: '全部上市状态', value: '' },
    { label: '上市', value: 1 },
    { label: '未上市', value: 0 }
]
const activeListed = ref<number | string>('')

let keywordTimer: ReturnType<typeof setTimeout> | undefined

/* ---------- 列表分页 ---------- */
const queryList = async (pageNo: number, pageSize: number) => {
    try {
        const params: any = { pageNum: pageNo, pageSize }
        const kw = keyword.value.trim()
        if (kw) params.enterpriseName = kw
        if (activeIndustryId.value !== '') params.industryId = activeIndustryId.value
        if (activeListed.value !== '') params.isListed = activeListed.value
        const res = await getEnterprisePage(params)
        loadFailed.value = false
        paging.value?.complete(res.records || [], res.total)
    } catch (error) {
        console.error('加载企业列表失败', error)
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

const switchListed = (value: number | string) => {
    activeListed.value = value
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

/** 提交字段 → 展示字段（行业/产品提交 id，列表返回 name） */
const NAME_FIELD_MAP: Record<string, string> = {
    industryIds: 'industryNames',
    productIds: 'productNames'
}

const readSections = computed<ReadSection[]>(() =>
    enterpriseSections.map((section) => ({
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
const detail = ref<BizIndustryEnterprise>({} as BizIndustryEnterprise)
const detailId = ref('')

/** 详情弹层全屏/收起（非全屏时固定 56vh，全屏撑满） */
const detailExpanded = ref(false)
const toggleDetailExpand = () => {
    detailExpanded.value = !detailExpanded.value
}

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

const openDetail = async (item: BizIndustryEnterprise) => {
    if (!item.id) return
    detailId.value = String(item.id)
    detail.value = {} as BizIndustryEnterprise
    detailPopup.value?.open()
    try {
        detail.value = (await getEnterpriseDetail(detailId.value)) || ({} as BizIndustryEnterprise)
    } catch (error) {
        console.error('加载企业详情失败', error)
        uni.showToast({ title: '加载企业详情失败', icon: 'none' })
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
const listedText = (item: BizIndustryEnterprise) => (item.isListed === 1 ? '是' : '否')

/** 新建/编辑企业（底部弹层表单） */
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formRecordId = ref<number | string>('')

const goCreate = () => {
    formMode.value = 'create'
    formRecordId.value = ''
    formVisible.value = true
}

const goEdit = (item: BizIndustryEnterprise) => {
    if (!item.id) return
    formMode.value = 'edit'
    formRecordId.value = item.id
    formVisible.value = true
}

const onFormSaved = () => {
    paging.value?.reload()
}

const removeEnterprise = async (id: number | string) => {
    try {
        await deleteEnterprise(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        paging.value?.reload()
    } catch (error) {
        console.error('删除企业失败', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
    }
}

const confirmDelete = (item: BizIndustryEnterprise) => {
    if (!item.id) return
    uni.showModal({
        title: '确认删除',
        content: '确定删除该记录？',
        success: async (res) => {
            if (!res.confirm) return
            await removeEnterprise(item.id as number | string)
        }
    })
}

const confirmDeleteFromSheet = () => {
    if (!detailId.value) return
    const id = detailId.value
    uni.showModal({
        title: '确认删除',
        content: '确定删除该记录？',
        success: async (res) => {
            if (!res.confirm) return
            closeDetail()
            await removeEnterprise(id)
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

.ent-card {
    margin: 0 40rpx 16rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.ent-card-hover {
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

.listed-tag {
    font-size: 20rpx;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    white-space: nowrap;
}

.tag-yes {
    background: var(--color-success-soft);
    color: var(--color-text);
}

.tag-no {
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
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
    background: var(--color-primary-soft);
    color: var(--color-primary);
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
    background: var(--color-surface);
    border-radius: 32rpx 32rpx 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sheet-handle {
    flex-shrink: 0;
    width: 64rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--color-border);
    margin: 24rpx auto 8rpx;
}

/* ===== 标题行（小记风格：居中标题 + 右上角全屏/收起 + 关闭） ===== */
.sheet-title-row {
    position: relative;
    flex-shrink: 0;
    padding: 8rpx 0 24rpx;
}

.sheet-title {
    display: block;
    text-align: center;
    font-size: 34rpx;
    font-weight: 700;
    color: var(--color-text);
}

.sheet-title-actions {
    position: absolute;
    right: 8rpx;
    top: 0;
    display: flex;
    align-items: center;
    gap: 18rpx;
}

.sheet-expand {
    padding: 8rpx 20rpx;
    border-radius: 16rpx;
    background: var(--color-surface-soft);

    &:active {
        opacity: 0.8;
    }
}

.sheet-expand-text {
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.sheet-close {
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-soft);
    color: var(--color-text-tertiary);
    font-size: 40rpx;
    line-height: 1;

    &:active {
        opacity: 0.8;
    }
}

.hero-tags {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    padding: 0 32rpx 12rpx;
    flex-shrink: 0;
}

.hero-tag {
    font-size: 24rpx;
    padding: 6rpx 16rpx;
    border-radius: 12rpx;
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    white-space: nowrap;
}

.sheet-scroll {
    max-height: 68vh;
    min-height: 200rpx;

    .sheet-panel.expanded & {
        max-height: calc(100vh - 300rpx - env(safe-area-inset-bottom));
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
    padding: 20rpx 0 calc(24rpx + env(safe-area-inset-bottom));
    background: transparent;
}

.sheet-btn {
    height: 88rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;

    &:active {
        opacity: 0.85;
    }
}

.sheet-btn.danger {
    flex: 1;
    background: var(--color-surface-soft);
    color: var(--color-danger-rgb);
}

.sheet-btn.primary {
    flex: 1.2;
    background: var(--gradient-primary);
    color: var(--color-btn-text);
    box-shadow: 0 8rpx 24rpx rgba(37, 184, 100, 0.3);
}
/* ===== 顶部状态栏（小记风格 sticky） ===== */
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 96rpx;
    padding: 0 32rpx;
    background: var(--color-surface, rgba(255, 255, 255, 0.92));
    backdrop-filter: blur(24rpx);
    border-bottom: 1rpx solid var(--color-border-light, rgba(0, 0, 0, 0.06));

    /* #ifdef APP-PLUS */
    height: calc(96rpx + var(--status-bar-height));
    padding: var(--status-bar-height) 32rpx 0;
    /* #endif */

    .header-left {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    .back-btn {
        width: 72rpx;
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        margin-left: -16rpx;

        &:active {
            background: var(--color-surface-soft, rgba(0, 0, 0, 0.04));
        }

        .back-icon {
            font-size: 44rpx;
            line-height: 1;
            color: var(--color-text, #1f2329);
        }
    }

    .header-title {
        font-size: 36rpx;
        font-weight: 600;
        color: var(--color-text, #1f2329);
    }
}
</style>
