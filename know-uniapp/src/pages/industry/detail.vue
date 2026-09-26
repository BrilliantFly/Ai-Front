<template>
    <view class="industry-page">
        <!-- hero 渐变头部卡（视觉基准同客户详情页） -->
        <view class="hero-card">
            <view class="deco-ring"></view>
            <view class="deco-dot"></view>
            <view class="hero-top">
                <view class="hero-badge" :style="{ background: 'var(--gradient-primary)' }">
                    {{ badgeText() }}
                </view>
                <view class="hero-main">
                    <text class="hero-name">{{ detail.industryName || '--' }}</text>
                    <text v-if="detail.industryCode" class="hero-code">{{
                        detail.industryCode
                    }}</text>
                    <view v-if="heroTags().length" class="tag-wrap">
                        <text v-for="t in heroTags()" :key="t" class="hero-tag">{{ t }}</text>
                    </view>
                </view>
                <view class="hero-actions">
                    <view class="hero-btn" @tap="goEdit">
                        <text class="hero-btn-text">编辑</text>
                    </view>
                    <view class="hero-btn" @tap="onDelete">
                        <text class="hero-btn-text">删除</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 顶部切换：IndustryTabs 组件（src/components/industry/IndustryTabs.vue）就绪后替换此处内联版式 -->
        <view class="tabs-bar">
            <view
                v-for="tab in tabs"
                :key="tab.key"
                class="tab-item"
                :class="{ active: activeTab === tab.key }"
                @tap="switchTab(tab.key)"
            >
                <text class="tab-text">{{ tab.label }}</text>
                <text v-if="tabCount(tab.key)" class="tab-count">{{ tabCount(tab.key) }}</text>
            </view>
        </view>

        <!-- Tab1 全部：8 个可折叠区段（配置驱动） -->
        <view v-if="activeTab === 'overview'" class="tab-panel">
            <SectionCard
                v-for="section in sections"
                :key="section.title"
                :title="section.title"
                collapsible
                :default-collapsed="section.title !== FIRST_SECTION"
            >
                <!-- 上下游产业链：ChainView 组件就绪后替换此处内联版式（数据同 props 结构） -->
                <view v-if="section.kind === 'chain'" class="chain-view">
                    <view v-for="lane in chainLanes" :key="lane.key" class="chain-lane">
                        <view class="chain-lane-head">
                            <view class="chain-lane-bar"></view>
                            <text class="chain-lane-label">{{ lane.label }}</text>
                        </view>
                        <view class="chain-lane-body">
                            <view
                                v-for="group in lane.groups"
                                :key="group.label"
                                class="chain-group"
                            >
                                <text class="chain-group-label">{{ group.label }}</text>
                                <view v-if="group.items.length" class="tag-wrap">
                                    <text
                                        v-for="name in group.items"
                                        :key="name"
                                        class="tag-chip"
                                        >{{ name }}</text
                                    >
                                </view>
                                <text v-else class="field-empty">--</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 财务指标：FinancePanel 组件就绪后替换此处内联 2x2 卡 -->
                <view v-else-if="section.kind === 'finance'" class="finance-panel">
                    <view v-for="item in financeItems" :key="item.key" class="finance-cell">
                        <text class="finance-value">{{ item.value }}</text>
                        <text class="finance-label">{{ item.label }}</text>
                    </view>
                </view>

                <template v-else-if="showSubSection(section)">
                    <SubSection v-for="sub in section.subs" :key="sub.title" :title="sub.title">
                        <FieldItem
                            v-for="field in sub.fields"
                            :key="field.key"
                            :label="field.label"
                            :value="fieldValue(field)"
                        >
                            <template v-if="field.key === 'tags'">
                                <view class="tag-wrap">
                                    <text v-for="t in detailTags()" :key="t" class="tag-chip">{{
                                        t
                                    }}</text>
                                    <text v-if="!detailTags().length" class="field-empty">--</text>
                                </view>
                            </template>
                        </FieldItem>
                    </SubSection>
                </template>

                <template v-else>
                    <FieldItem
                        v-for="field in flatFields(section)"
                        :key="field.key"
                        :label="field.label"
                        :value="fieldValue(field)"
                    >
                        <template v-if="field.key === 'tags'">
                            <view class="tag-wrap">
                                <text v-for="t in detailTags()" :key="t" class="tag-chip">{{
                                    t
                                }}</text>
                                <text v-if="!detailTags().length" class="field-empty">--</text>
                            </view>
                        </template>
                    </FieldItem>
                </template>
            </SectionCard>
        </view>

        <!-- Tab2 产品列表（数据取自行业详情响应，不二次请求） -->
        <view v-else-if="activeTab === 'product'" class="tab-panel">
            <view v-for="item in products" :key="String(item.id)" class="entity-card">
                <view class="entity-head">
                    <text class="entity-name">{{ item.productName || '--' }}</text>
                    <text v-if="item.lifeCycle" class="tag-chip strong">{{ item.lifeCycle }}</text>
                </view>
                <view v-if="namesOf(item).length" class="tag-wrap">
                    <text v-for="n in namesOf(item)" :key="n" class="tag-chip">{{ n }}</text>
                </view>
                <view class="entity-meta">
                    <text v-if="item.category" class="meta-item">{{ item.category }}</text>
                </view>
                <text v-if="item.productConcept" class="entity-desc">{{
                    item.productConcept
                }}</text>
                <view class="entity-actions">
                    <view class="action-btn" @tap="goEditProduct(item.id)">
                        <text class="action-text">编辑</text>
                    </view>
                    <view class="action-btn" @tap="onDeleteProduct(item)">
                        <text class="action-text danger">删除</text>
                    </view>
                </view>
            </view>
            <view v-if="!products.length" class="empty-box">
                <view class="empty-icon">产</view>
                <text class="empty-title">暂无产品数据</text>
                <text class="empty-desc">可在产品管理中新建并关联到该行业</text>
            </view>
        </view>

        <!-- Tab3 企业列表（数据取自行业详情响应，不二次请求） -->
        <view v-else-if="activeTab === 'enterprise'" class="tab-panel">
            <view v-for="item in enterprises" :key="String(item.id)" class="entity-card">
                <view class="entity-head">
                    <text class="entity-name">{{ item.enterpriseName || '--' }}</text>
                    <text class="tag-chip" :class="{ strong: item.isListed === 1 }">{{
                        listedText(item.isListed)
                    }}</text>
                </view>
                <view v-if="namesOf(item).length" class="tag-wrap">
                    <text v-for="n in namesOf(item)" :key="n" class="tag-chip">{{ n }}</text>
                </view>
                <view class="entity-meta">
                    <text v-if="item.enterpriseType" class="meta-item">{{
                        item.enterpriseType
                    }}</text>
                    <text v-if="item.scale" class="meta-item">{{ item.scale }}</text>
                </view>
                <text v-if="item.mainBusiness" class="entity-desc">{{ item.mainBusiness }}</text>
                <view class="entity-actions">
                    <view class="action-btn" @tap="goEditEnterprise(item.id)">
                        <text class="action-text">编辑</text>
                    </view>
                    <view class="action-btn" @tap="onDeleteEnterprise(item)">
                        <text class="action-text danger">删除</text>
                    </view>
                </view>
            </view>
            <view v-if="!enterprises.length" class="empty-box">
                <view class="empty-icon">企</view>
                <text class="empty-title">暂无企业数据</text>
                <text class="empty-desc">可在企业管理中新建并关联到该行业</text>
            </view>
        </view>

        <!-- Tab4 市场 + 商业模式 -->
        <view v-else class="tab-panel">
            <view v-if="market" class="entity-card">
                <view class="entity-head">
                    <text class="entity-name">市场需求与商机</text>
                    <view class="action-inline" @tap="goEditMarket">
                        <text class="action-text">编辑</text>
                    </view>
                </view>
                <view v-if="namesOf(market).length" class="tag-wrap">
                    <text v-for="n in namesOf(market)" :key="n" class="tag-chip">{{ n }}</text>
                </view>
                <text v-if="market.demand" class="entity-desc">{{ market.demand }}</text>
                <text v-if="market.opportunity" class="entity-desc">{{ market.opportunity }}</text>

                <!-- 商业模式九要素：BusinessModelGrid 组件就绪后替换此处内联宫格 -->
                <view v-if="hasBusinessModel" class="bm">
                    <text class="bm-title">商业模式</text>
                    <view class="bm-cells">
                        <view v-for="cell in businessModelCells" :key="cell.key" class="bm-cell">
                            <text class="bm-cell-label">{{ cell.label }}</text>
                            <text class="bm-cell-value">{{ cell.value || '--' }}</text>
                        </view>
                    </view>
                    <view class="bm-cell bm-cost">
                        <text class="bm-cell-label">成本结构</text>
                        <text class="bm-cell-value">{{ market.costStructure || '--' }}</text>
                    </view>
                </view>
            </view>
            <view v-else class="empty-box">
                <view class="empty-icon">市</view>
                <text class="empty-title">暂无市场数据</text>
                <text class="empty-desc">补充该行业的市场需求与商机信息</text>
                <view class="empty-btn" @tap="goCreateMarket">新建市场</view>
            </view>
        </view>

        <!-- 客户分布：CustomerDistPanel 组件（src/components/industry/CustomerDistPanel.vue）就绪后替换此处内联面板 -->
        <view class="dist-card">
            <view class="dist-head">
                <text class="dist-title">客户分布</text>
                <text class="dist-count">{{ customerCount }} 位</text>
            </view>
            <view v-if="customers.length" class="dist-list">
                <view
                    v-for="c in customers"
                    :key="String(c.id)"
                    class="dist-item"
                    hover-class="dist-item-hover"
                    @tap="goCustomerDetail(c)"
                >
                    <text class="dist-name">{{ c.name || '--' }}</text>
                    <text v-if="c.phone" class="dist-phone">{{ maskPhone(c.phone) }}</text>
                </view>
            </view>
            <text v-else class="field-empty dist-empty">暂无关联客户</text>
        </view>

        <view class="page-bottom-space"></view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uniapp-router-next'
import SectionCard from '@/components/customer/SectionCard.vue'
import SubSection from '@/components/customer/SubSection.vue'
import FieldItem from '@/components/customer/FieldItem.vue'
import {
    getIndustryDetail,
    deleteIndustry,
    getIndustryCustomers,
    type BizIndustryDetail,
    type BizIndustryProductLite,
    type BizIndustryEnterpriseLite
} from '@/api/biz/industry'
import { deleteProduct } from '@/api/biz/industry/product'
import { deleteEnterprise } from '@/api/biz/industry/enterprise'
import { industrySections, type UniFieldDef, type UniSectionDef } from '@/config/industry-sections'
import { maskPhone } from '@/utils/format'

/** 首个区段默认展开 */
const FIRST_SECTION = '行业定义与技术'

/** 详情页区段展示顺序（字段仍取自 industry-sections 配置） */
const SECTION_ORDER = [
    '行业定义与技术',
    '上下游产业链',
    '行业发展概况',
    '财务指标',
    '动态信息',
    '价值信息',
    '行业资源',
    '如何把握'
]

/** 详情页区段（拍平配置的三级结构，特殊区段由专用视图渲染） */
interface DetailField {
    label: string
    key: string
    type?: UniFieldDef['type']
    options?: UniFieldDef['options']
}

interface DetailSub {
    title: string
    fields: DetailField[]
}

interface DetailSection {
    title: string
    kind: 'fields' | 'chain' | 'finance'
    subs: DetailSub[]
}

/** 市场（行业详情聚合返回，字段与 BizIndustryMarket 对齐） */
interface MarketView {
    id?: number | string
    industryNames?: string[]
    demand?: string
    opportunity?: string
    valueProposition?: string
    customerSegment?: string
    channel?: string
    customerRelation?: string
    revenueSource?: string
    keyResource?: string
    keyPartner?: string
    keyActivity?: string
    costStructure?: string
}

/** 行业详情内嵌列表项：列表接口会带 industryNames，聚合类型未声明 */
type ProductItem = BizIndustryProductLite & { industryNames?: string[] }
type EnterpriseItem = BizIndustryEnterpriseLite & { industryNames?: string[] }

/** 行业关联客户（客户表字段子集） */
interface CustomerItem {
    id: number | string
    name?: string
    phone?: string
}

const router = useRouter()
const industryId = ref<string>('')
const detail = ref<BizIndustryDetail>({} as BizIndustryDetail)
const market = ref<MarketView | null>(null)
const customers = ref<CustomerItem[]>([])
const customerCount = ref(0)
const activeTab = ref('overview')

const tabs = [
    { key: 'overview', label: '全部' },
    { key: 'product', label: '产品' },
    { key: 'enterprise', label: '企业' },
    { key: 'market', label: '市场' }
]

/* ---------- 区段结构（配置驱动） ---------- */

const toFields = (fields?: UniFieldDef[]): DetailField[] =>
    (fields || []).map((f) => ({ label: f.label, key: f.key, type: f.type, options: f.options }))

/** 配置树 → 详情页区段列表：基础信息的子区段独立成卡，「其他」下的财务指标提升为独立卡 */
const buildSections = (): DetailSection[] => {
    const list: DetailSection[] = []
    industrySections.forEach((top: UniSectionDef) => {
        const children = top.subSections?.length ? top.subSections : [top]
        children.forEach((child) => {
            const isFinance = child.title === '财务指标'
            const title = top.title === '基础信息' || isFinance ? child.title : top.title
            const kind: DetailSection['kind'] =
                child.title === '上下游产业链' ? 'chain' : isFinance ? 'finance' : 'fields'
            const subs: DetailSub[] = child.fields?.length
                ? [{ title: child.title, fields: toFields(child.fields) }]
                : (child.subSections || []).map((s) => ({
                      title: s.title,
                      fields: toFields(s.fields)
                  }))
            list.push({ title, kind, subs })
        })
    })
    return list.sort((a, b) => SECTION_ORDER.indexOf(a.title) - SECTION_ORDER.indexOf(b.title))
}

const sections = buildSections()

/** 单组且标题与区段一致时不重复套一层 SubSection */
const showSubSection = (section: DetailSection) =>
    section.subs.length > 1 || (!!section.subs[0] && section.subs[0].title !== section.title)

const flatFields = (section: DetailSection): DetailField[] =>
    section.subs.reduce<DetailField[]>((acc, sub) => acc.concat(sub.fields), [])

/* ---------- 展示辅助 ---------- */

/** 选项型字段（可见性）翻译为文案 */
const fieldValue = (field: DetailField): string | number | undefined => {
    const raw = (detail.value as Record<string, any>)[field.key]
    if (raw === null || raw === undefined || raw === '') return undefined
    if (field.options?.length) {
        const hit = field.options.find((o) => String(o.value) === String(raw))
        return hit?.label
    }
    return raw as string | number
}

const splitTags = (str?: string | null) => {
    if (!str) return []
    return str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

const detailTags = () => splitTags(detail.value.tags)

const heroTags = () => detailTags()

const badgeText = () => {
    const name = detail.value.industryName || ''
    return (name.trim().charAt(0) || '行').toUpperCase()
}

const products = computed<ProductItem[]>(() => detail.value.products || [])

const enterprises = computed<EnterpriseItem[]>(() => detail.value.enterprises || [])

/** 产业链整字段按换行/分号/逗号拆成名称数组 */
const splitChain = (raw?: string) => {
    if (!raw) return []
    return raw
        .split(/[\n\r;；,，]+/)
        .map((s) => s.trim())
        .filter(Boolean)
}

/** 与 ChainView props 同构的数据 */
const chainData = computed(() => ({
    upstream: splitChain(detail.value.upstreamChain),
    midstream: splitChain(detail.value.midstreamChain),
    downstream: {
        channel: splitChain(detail.value.downstreamChannel),
        marketing: splitChain(detail.value.downstreamMarketing)
    }
}))

const chainLanes = computed(() => {
    const data = chainData.value
    return [
        {
            key: 'upstream',
            label: '上游（原材料）',
            groups: [{ label: '上游产业链', items: data.upstream }]
        },
        {
            key: 'midstream',
            label: '中游（产品制造商）',
            groups: [{ label: '中游产业链', items: data.midstream }]
        },
        {
            key: 'downstream',
            label: '下游（渠道、营销）',
            groups: [
                { label: '渠道', items: data.downstream.channel },
                { label: '营销', items: data.downstream.marketing }
            ]
        }
    ]
})

/** 财务指标 2x2 卡（值为空展示 --） */
const numText = (v?: number | string | null) => {
    if (v === null || v === undefined || v === '') return '--'
    return String(v)
}

const financeItems = computed(() => [
    { key: 'grossProfit', label: '毛利额（万元）', value: numText(detail.value.grossProfit) },
    { key: 'grossMargin', label: '毛利率（%）', value: numText(detail.value.grossMargin) },
    { key: 'netProfit', label: '净利额（万元）', value: numText(detail.value.netProfit) },
    { key: 'netMargin', label: '净利率（%）', value: numText(detail.value.netMargin) }
])

/** 商业模式九要素（前 8 项宫格 + 底部成本结构） */
const businessModelCells = computed(() => {
    const m = market.value || ({} as MarketView)
    return [
        { key: 'valueProposition', label: '价值主张', value: m.valueProposition },
        { key: 'customerSegment', label: '客户细分', value: m.customerSegment },
        { key: 'channel', label: '渠道通路', value: m.channel },
        { key: 'customerRelation', label: '客户关系', value: m.customerRelation },
        { key: 'revenueSource', label: '收入来源', value: m.revenueSource },
        { key: 'keyResource', label: '核心资源', value: m.keyResource },
        { key: 'keyPartner', label: '重要伙伴', value: m.keyPartner },
        { key: 'keyActivity', label: '关键业务', value: m.keyActivity }
    ]
})

const hasBusinessModel = computed(() => businessModelCells.value.some((c) => !!c.value))

const namesOf = (item: { industryNames?: string[] }) => item?.industryNames || []

const listedText = (v?: number) => (v === 1 ? '上市' : '未上市')

const tabCount = (key: string) => {
    if (key === 'product') return products.value.length
    if (key === 'enterprise') return enterprises.value.length
    if (key === 'market') return market.value ? 1 : 0
    return 0
}

const switchTab = (key: string) => {
    activeTab.value = key
}

/* ---------- 数据加载 ---------- */

const loadDetail = async () => {
    try {
        const res = await getIndustryDetail(industryId.value)
        detail.value = res || ({} as BizIndustryDetail)
        market.value = (res?.market || null) as MarketView | null
    } catch (error) {
        console.error('加载行业详情失败', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
    }
}

/** 客户分布（CustomerDistPanel 内联占位实现） */
const loadCustomers = async () => {
    try {
        const res = await getIndustryCustomers(industryId.value, { pageNum: 1, pageSize: 20 })
        customers.value = res?.records || []
        customerCount.value = res?.total ?? customers.value.length
    } catch (error) {
        console.error('加载行业客户失败', error)
        customers.value = []
        customerCount.value = 0
    }
}

const reload = () => {
    if (!industryId.value) return
    loadDetail()
    loadCustomers()
}

/* ---------- 交互 ---------- */

const goEdit = () => {
    if (industryId.value) {
        router.navigateTo(`/pages/industry/industry-form?id=${industryId.value}`)
    }
}

const onDelete = () => {
    if (!industryId.value) return
    uni.showModal({
        title: '删除行业',
        content: '确定删除该行业？删除后关联数据将丢失',
        success: async (res) => {
            if (!res.confirm) return
            try {
                await deleteIndustry(industryId.value)
                uni.showToast({ title: '删除成功', icon: 'none' })
                router.navigateBack()
            } catch (error) {
                console.error('删除行业失败', error)
                uni.showToast({ title: '删除失败', icon: 'none' })
            }
        }
    })
}

const goEditProduct = (id: number | string) => {
    router.navigateTo(`/pages/industry/product-form?id=${id}`)
}

const onDeleteProduct = (item: ProductItem) => {
    uni.showModal({
        title: '删除产品',
        content: '确定删除该产品？',
        success: async (res) => {
            if (!res.confirm) return
            try {
                await deleteProduct(item.id)
                uni.showToast({ title: '删除成功', icon: 'none' })
                reload()
            } catch (error) {
                console.error('删除产品失败', error)
                uni.showToast({ title: '删除失败', icon: 'none' })
            }
        }
    })
}

const goEditEnterprise = (id: number | string) => {
    router.navigateTo(`/pages/industry/enterprise-form?id=${id}`)
}

const onDeleteEnterprise = (item: EnterpriseItem) => {
    uni.showModal({
        title: '删除企业',
        content: '确定删除该企业？',
        success: async (res) => {
            if (!res.confirm) return
            try {
                await deleteEnterprise(item.id)
                uni.showToast({ title: '删除成功', icon: 'none' })
                reload()
            } catch (error) {
                console.error('删除企业失败', error)
                uni.showToast({ title: '删除失败', icon: 'none' })
            }
        }
    })
}

const goEditMarket = () => {
    const m = market.value
    if (!m) return
    router.navigateTo(`/pages/industry/market-form?id=${m.id || ''}&industryId=${industryId.value}`)
}

const goCreateMarket = () => {
    router.navigateTo(`/pages/industry/market-form?industryId=${industryId.value}`)
}

const goCustomerDetail = (item: CustomerItem) => {
    if (item?.id) {
        router.navigateTo(`/pages/customer/detail?id=${item.id}`)
    }
}

onLoad((options) => {
    // 雪花 ID 超出 JS 安全整数范围，必须保留字符串，禁止 Number() 转换
    industryId.value = String(options?.id || '')
    if (!industryId.value) {
        uni.showToast({ title: '缺少行业ID', icon: 'none' })
    }
    if (options?.tab) {
        activeTab.value = String(options.tab)
    }
})

onShow(() => {
    // 首次进入与从编辑页/表单页返回时刷新
    reload()
})
</script>

<style scoped lang="scss">
.industry-page {
    min-height: 100vh;
    background: var(--color-bg-app);
    padding-bottom: 90rpx;
}

/* ===== hero 头部卡 ===== */
.hero-card {
    position: relative;
    overflow: hidden;
    padding: 40rpx 40rpx 52rpx;
    background: var(--gradient-primary);

    /* #ifdef APP-PLUS */
    padding-top: calc(40rpx + var(--status-bar-height));
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
    align-items: flex-start;
    gap: 20rpx;
}

.hero-badge {
    width: 92rpx;
    height: 92rpx;
    border-radius: 46rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--color-btn-text);
    flex-shrink: 0;
    box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.16);
}

.hero-main {
    flex: 1;
    min-width: 0;
}

.hero-name {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    line-height: 1.25;
    color: var(--color-btn-text);
}

.hero-code {
    display: inline-flex;
    margin-top: 8rpx;
    padding: 2rpx 16rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    background: rgba(255, 255, 255, 0.18);
    color: var(--color-btn-text);
}

.hero-actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    flex-shrink: 0;
}

.hero-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 104rpx;
    height: 56rpx;
    padding: 0 22rpx;
    border-radius: 28rpx;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(10rpx);
}

.hero-btn-text {
    font-size: 24rpx;
    font-weight: 600;
    color: var(--color-btn-text);
}

/* ===== 顶部切换 ===== */
.tabs-bar {
    display: flex;
    gap: 12rpx;
    margin: 20rpx 40rpx 0;
    padding: 8rpx;
    border-radius: 20rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 64rpx;
    border-radius: 16rpx;
    font-size: 26rpx;
    color: var(--color-text-secondary);
}

.tab-item.active {
    background: var(--color-primary);
    box-shadow: var(--shadow-glow);
}

.tab-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.tab-item.active .tab-text {
    color: var(--color-btn-text);
}

.tab-count {
    min-width: 30rpx;
    padding: 0 8rpx;
    border-radius: 16rpx;
    font-size: 20rpx;
    line-height: 28rpx;
    text-align: center;
    background: var(--color-surface-soft);
    color: var(--color-text-tertiary);
}

.tab-item.active .tab-count {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-btn-text);
}

.tab-panel {
    padding-bottom: 8rpx;
}

/* ===== 标签 chips ===== */
.tag-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.hero-tag {
    display: inline-flex;
    align-items: center;
    padding: 4rpx 18rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: var(--color-btn-text);
    background: rgba(255, 255, 255, 0.18);
    white-space: nowrap;
}

.tag-chip {
    display: inline-flex;
    align-items: center;
    padding: 4rpx 18rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    white-space: nowrap;
}

.tag-chip.strong {
    color: var(--color-btn-text);
    background: var(--color-primary);
}

.field-empty {
    display: inline-block;
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--color-text-tertiary);
}

/* ===== 上下游产业链（ChainView 内联版式） ===== */
.chain-view {
    display: flex;
    flex-direction: column;
    gap: 18rpx;
    padding: 20rpx 0 4rpx;
}

.chain-lane {
    border-radius: 20rpx;
    background: var(--color-surface-soft);
    overflow: hidden;
}

.chain-lane-head {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 18rpx 24rpx 6rpx;
}

.chain-lane-bar {
    width: 8rpx;
    height: 24rpx;
    border-radius: 4rpx;
    background: var(--gradient-primary);
}

.chain-lane-label {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}

.chain-lane-body {
    padding: 0 24rpx 20rpx;
}

.chain-group {
    margin-top: 14rpx;
}

.chain-group-label {
    display: block;
    margin-bottom: 10rpx;
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

/* ===== 财务指标（FinancePanel 内联 2x2） ===== */
.finance-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 18rpx;
    padding: 20rpx 0 4rpx;
}

.finance-cell {
    width: calc(50% - 9rpx);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26rpx 12rpx 22rpx;
    border-radius: 20rpx;
    background: var(--color-surface-soft);
}

.finance-value {
    font-size: 34rpx;
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-primary);
}

.finance-label {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
}

/* ===== 产品 / 企业 / 市场 卡片 ===== */
.entity-card {
    margin: 20rpx 40rpx 0;
    padding: 26rpx 28rpx 24rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.entity-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.entity-name {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text);
}

.entity-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-top: 12rpx;
}

.meta-item {
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.entity-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 12rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--color-text-secondary);
}

.entity-actions {
    display: flex;
    gap: 18rpx;
    margin-top: 22rpx;
    padding-top: 18rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.action-inline {
    display: flex;
    align-items: center;
    padding: 6rpx 20rpx;
    border-radius: 24rpx;
    background: var(--color-primary-soft);
    flex-shrink: 0;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120rpx;
    height: 60rpx;
    padding: 0 24rpx;
    border-radius: 30rpx;
    background: var(--color-surface-soft);
}

.action-text {
    font-size: 24rpx;
    font-weight: 600;
    color: var(--color-primary);
}

.action-text.danger {
    color: var(--color-danger-rgb);
}

/* ===== 商业模式宫格（BusinessModelGrid 内联版式） ===== */
.bm {
    margin-top: 24rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.bm-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}

.bm-cells {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 16rpx;
}

.bm-cell {
    width: calc(50% - 8rpx);
    box-sizing: border-box;
    padding: 18rpx 20rpx;
    border-radius: 18rpx;
    background: var(--color-surface-soft);
}

.bm-cost {
    width: 100%;
    margin-top: 16rpx;
}

.bm-cell-label {
    display: block;
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

.bm-cell-value {
    display: block;
    margin-top: 8rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: var(--color-text);
    word-break: break-all;
}

/* ===== 空态 ===== */
.empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20rpx 40rpx 0;
    padding: 72rpx 40rpx 64rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.empty-icon {
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44rpx;
    font-weight: 700;
    color: var(--color-primary);
    background: var(--color-primary-soft);
}

.empty-title {
    margin-top: 20rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-text);
}

.empty-desc {
    margin-top: 10rpx;
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}

.empty-btn {
    margin-top: 30rpx;
    padding: 18rpx 56rpx;
    border-radius: 38rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: var(--color-btn-text);
    background: var(--color-primary);
    box-shadow: var(--shadow-glow);
}

/* ===== 客户分布（CustomerDistPanel 内联面板） ===== */
.dist-card {
    margin: 20rpx 40rpx 0;
    padding: 26rpx 28rpx 20rpx;
    border-radius: 24rpx;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
}

.dist-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid var(--color-border-light);
}

.dist-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-text);
}

.dist-count {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
}

.dist-list {
    padding-top: 4rpx;
}

.dist-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);
}

.dist-item:last-child {
    border-bottom: none;
}

.dist-item-hover {
    background: var(--color-surface-hover);
}

.dist-name {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: var(--color-text);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.dist-phone {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
}

.dist-empty {
    display: block;
    padding: 28rpx 0 12rpx;
}

.page-bottom-space {
    height: 40rpx;
}
</style>
