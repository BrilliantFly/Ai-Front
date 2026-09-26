<template>
    <view class="dist-card">
        <view class="dist-head">
            <view class="dist-title-wrap">
                <text class="dist-title">客户分布</text>
                <text class="dist-badge">{{ displayCount }} 位</text>
            </view>
            <view class="dist-action" hover-class="dist-action-hover" @tap="openLink">
                <text class="dist-action-text">关联客户</text>
            </view>
        </view>

        <view v-if="loading" class="dist-state">加载中…</view>
        <view v-else-if="customers.length" class="dist-list">
            <view
                v-for="c in customers"
                :key="String(c.id)"
                class="dist-item"
                hover-class="dist-item-hover"
                @tap="goCustomerDetail(c)"
            >
                <text class="dist-name">{{ c.name || '--' }}</text>
                <text v-if="c.phone" class="dist-phone">{{ maskPhone(c.phone) }}</text>
                <text class="dist-tag" :class="{ main: isMain(c) }">{{
                    isMain(c) ? '主营' : '兼营'
                }}</text>
            </view>
            <view v-if="hasMore" class="dist-more" hover-class="dist-more-hover" @tap="loadMore">
                <text class="dist-more-text">{{ loadingMore ? '加载中…' : '加载更多' }}</text>
            </view>
        </view>
        <view v-else class="dist-empty">
            <text class="dist-empty-text">暂无关联客户</text>
            <view class="dist-empty-btn" hover-class="dist-action-hover" @tap="openLink">
                <text class="dist-empty-btn-text">关联客户</text>
            </view>
        </view>

        <!-- 关联客户弹层 -->
        <uni-popup ref="popupRef" type="bottom">
            <view class="link-panel">
                <view class="link-head">
                    <text class="link-title">关联客户</text>
                    <text class="link-close" @tap="closeLink">×</text>
                </view>

                <view class="link-search">
                    <input
                        v-model="linkKeyword"
                        class="link-search-input"
                        placeholder="搜索客户名称或手机号"
                        placeholder-class="link-search-placeholder"
                        confirm-type="search"
                        @input="onLinkKeyword"
                    />
                    <text v-if="linkKeyword" class="link-search-clear" @tap="clearLinkKeyword"
                        >×</text
                    >
                </view>

                <scroll-view class="link-body" scroll-y :show-scrollbar="false">
                    <view v-if="linkLoading" class="link-state">加载中…</view>
                    <view v-else-if="linkList.length">
                        <view
                            v-for="c in linkList"
                            :key="String(c.id)"
                            class="link-item"
                            hover-class="link-item-hover"
                            @tap="togglePick(c)"
                        >
                            <view class="link-check" :class="{ checked: isPicked(c) }">
                                <text v-if="isPicked(c)" class="link-check-mark">✓</text>
                            </view>
                            <text class="link-name">{{ c.name || '--' }}</text>
                            <text class="link-phone">{{ maskPhone(c.phone) }}</text>
                        </view>
                        <view
                            v-if="linkHasMore"
                            class="link-more"
                            hover-class="dist-more-hover"
                            @tap="loadLinkMore"
                        >
                            <text class="link-more-text">{{
                                linkMoreLoading ? '加载中…' : '加载更多'
                            }}</text>
                        </view>
                    </view>
                    <text v-else class="link-state">暂无客户数据</text>
                </scroll-view>

                <view class="link-footer">
                    <view class="link-btn link-btn-cancel" @tap="closeLink">取消</view>
                    <view
                        class="link-btn link-btn-confirm"
                        :class="{ disabled: isLock }"
                        @tap="submitLink"
                    >
                        {{ isLock ? '提交中…' : '确定' }}
                    </view>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'uniapp-router-next'
import { getIndustryCustomers, linkIndustryCustomers } from '@/api/biz/industry'
import { getCustomerPage } from '@/api/customer'
import { useLockFn } from '@/hooks/useLockFn'
import { maskPhone } from '@/utils/format'

/** 行业关联客户记录（getIndustryCustomers 返回项） */
interface DistCustomer {
    id: number | string
    name?: string
    phone?: string
    /** 1 主营 / 0 兼营 */
    isMain?: number
}

const props = defineProps<{
    /** 行业 ID（雪花 ID 需保持字符串，禁止 Number 转换） */
    industryId: number | string
    /** 关联客户数（面板内已加载时以接口返回为准） */
    count?: number
}>()

const emit = defineEmits<{
    (e: 'countChange', n: number): void
}>()

const router = useRouter()

/** 行业客户列表分页大小 */
const PAGE_SIZE = 10
/** 弹层候选列表分页大小 */
const LINK_PAGE_SIZE = 20
/** 预勾选：一次取全量已关联客户（关联接口为全量覆盖） */
const LINKED_PAGE_SIZE = 200

const popupRef = shallowRef()

/* ---------- 行业客户列表 ---------- */
const customers = ref<DistCustomer[]>([])
const total = ref<number | null>(null)
const pageNum = ref(1)
const loading = ref(false)
const loadingMore = ref(false)

const hasMore = computed(() => total.value !== null && customers.value.length < total.value)

const displayCount = computed(() => total.value ?? props.count ?? 0)

const isMain = (item: DistCustomer) => Number(item.isMain) === 1

const loadList = async (reset: boolean) => {
    if (reset) {
        pageNum.value = 1
        loading.value = true
    } else {
        if (loadingMore.value || !hasMore.value) return
        loadingMore.value = true
    }
    try {
        const res = await getIndustryCustomers(props.industryId, {
            pageNum: pageNum.value,
            pageSize: PAGE_SIZE
        })
        const records = (res?.records || []) as DistCustomer[]
        total.value = res?.total ?? records.length
        customers.value = reset ? records : [...customers.value, ...records]
        if (records.length) pageNum.value += 1
    } catch (error) {
        console.error('加载行业客户失败', error)
        if (reset) {
            customers.value = []
            total.value = 0
        }
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

const loadMore = () => {
    loadList(false)
}

const reloadList = () => loadList(true)

/* ---------- 关联客户弹层 ---------- */
const linkList = ref<DistCustomer[]>([])
const linkTotal = ref(0)
const linkPageNum = ref(1)
const linkLoading = ref(false)
const linkMoreLoading = ref(false)
const linkKeyword = ref('')
/** 勾选中的客户 ID（统一字符串，规避雪花 ID 精度） */
const pickedIds = ref<string[]>([])
/** 已关联客户的 isMain 快照，提交时保留主/兼营 */
const linkedMainMap = ref<Record<string, number>>({})

const linkHasMore = computed(() => linkList.value.length < linkTotal.value)

const idKey = (id: number | string) => String(id)

const isPicked = (item: DistCustomer) => pickedIds.value.includes(idKey(item.id))

const loadLinkList = async (reset: boolean) => {
    if (reset) {
        linkPageNum.value = 1
        linkLoading.value = true
    } else {
        if (linkMoreLoading.value || !linkHasMore.value) return
        linkMoreLoading.value = true
    }
    try {
        const keyword = linkKeyword.value.trim()
        const res = await getCustomerPage({
            pageNum: linkPageNum.value,
            pageSize: LINK_PAGE_SIZE,
            name: keyword || undefined
        })
        const records = (res?.records || []) as DistCustomer[]
        linkTotal.value = res?.total ?? records.length
        linkList.value = reset ? records : [...linkList.value, ...records]
        if (records.length) linkPageNum.value += 1
    } catch (error) {
        console.error('加载客户列表失败', error)
        if (reset) {
            linkList.value = []
            linkTotal.value = 0
        }
    } finally {
        linkLoading.value = false
        linkMoreLoading.value = false
    }
}

const loadLinkMore = () => {
    loadLinkList(false)
}

/** 打开弹层：取全量已关联客户做预勾选 */
const loadLinked = async () => {
    try {
        const res = await getIndustryCustomers(props.industryId, {
            pageNum: 1,
            pageSize: LINKED_PAGE_SIZE
        })
        const records = (res?.records || []) as DistCustomer[]
        const mainMap: Record<string, number> = {}
        records.forEach((item) => {
            mainMap[idKey(item.id)] = Number(item.isMain) === 1 ? 1 : 0
        })
        linkedMainMap.value = mainMap
        pickedIds.value = records.map((item) => idKey(item.id))
    } catch (error) {
        console.error('加载已关联客户失败', error)
        linkedMainMap.value = {}
        pickedIds.value = []
    }
}

const openLink = async () => {
    await loadLinked()
    linkKeyword.value = ''
    loadLinkList(true)
    popupRef.value?.open()
}

const closeLink = () => {
    popupRef.value?.close()
}

const togglePick = (item: DistCustomer) => {
    const key = idKey(item.id)
    const index = pickedIds.value.indexOf(key)
    if (index >= 0) {
        const next = [...pickedIds.value]
        next.splice(index, 1)
        pickedIds.value = next
        return
    }
    pickedIds.value = [...pickedIds.value, key]
}

/** 搜索防抖 300ms */
let keywordTimer: ReturnType<typeof setTimeout> | undefined

const onLinkKeyword = () => {
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
        loadLinkList(true)
    }, 300)
}

const clearLinkKeyword = () => {
    linkKeyword.value = ''
    loadLinkList(true)
}

/* ---------- 提交关联（防重） ---------- */
const doSubmit = async () => {
    const relations = pickedIds.value.map((id) => ({
        customerId: id,
        isMain: linkedMainMap.value[id] === 1 ? 1 : 0
    }))
    try {
        await linkIndustryCustomers(props.industryId, relations)
        uni.showToast({ title: '关联成功', icon: 'success' })
        closeLink()
        await reloadList()
        emit('countChange', total.value ?? pickedIds.value.length)
    } catch (error) {
        console.error('关联客户失败', error)
    }
}

const { isLock, lockFn } = useLockFn(doSubmit)

const submitLink = () => {
    if (isLock.value) return
    lockFn()
}

/* ---------- 交互 ---------- */
const goCustomerDetail = (item: DistCustomer) => {
    if (item?.id) {
        router.navigateTo(`/pages/customer/detail?id=${item.id}`)
    }
}

watch(
    () => props.industryId,
    () => {
        reloadList()
    }
)

onMounted(() => {
    reloadList()
})
</script>

<style scoped lang="scss">
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
    gap: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid var(--color-border-light);
}

.dist-title-wrap {
    display: flex;
    align-items: center;
    gap: 14rpx;
    min-width: 0;
}

.dist-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--color-text);
}

.dist-badge {
    padding: 2rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: var(--color-primary);
    background: var(--color-primary-soft);
}

.dist-action {
    flex-shrink: 0;
    padding: 8rpx 24rpx;
    border-radius: 28rpx;
    background: var(--color-primary-soft);
}

.dist-action-hover {
    opacity: 0.7;
}

.dist-action-text {
    font-size: 24rpx;
    font-weight: 600;
    color: var(--color-primary);
}

.dist-state {
    display: block;
    padding: 32rpx 0 16rpx;
    text-align: center;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.dist-list {
    padding-top: 4rpx;
}

.dist-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);
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

.dist-tag {
    flex-shrink: 0;
    padding: 2rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: var(--color-text-secondary);
    background: var(--color-surface-soft);
}

.dist-tag.main {
    color: var(--color-primary);
    background: var(--color-primary-soft);
}

.dist-more,
.link-more {
    padding: 24rpx 0 8rpx;
    text-align: center;
}

.dist-more-hover {
    opacity: 0.7;
}

.dist-more-text,
.link-more-text {
    font-size: 24rpx;
    color: var(--color-text-secondary);
}

.dist-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0 20rpx;
}

.dist-empty-text {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.dist-empty-btn {
    margin-top: 24rpx;
    padding: 14rpx 48rpx;
    border-radius: 34rpx;
    background: var(--color-primary);
    box-shadow: var(--shadow-glow);
}

.dist-empty-btn-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-btn-text);
}

/* ===== 关联客户弹层 ===== */
.link-panel {
    height: 70vh;
    display: flex;
    flex-direction: column;
    padding: 32rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    border-radius: 24rpx 24rpx 0 0;
    background: var(--color-surface);
}

.link-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20rpx;
}

.link-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--color-text);
}

.link-close {
    font-size: 44rpx;
    line-height: 1;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
}

.link-search {
    display: flex;
    align-items: center;
    gap: 12rpx;
    height: 76rpx;
    padding: 0 24rpx;
    border-radius: 38rpx;
    background: var(--color-surface-soft);
    border: 1rpx solid var(--color-border-light);
}

.link-search-input {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    color: var(--color-text);
}

.link-search-placeholder {
    color: var(--color-text-tertiary);
}

.link-search-clear {
    font-size: 34rpx;
    line-height: 1;
    color: var(--color-text-tertiary);
    padding: 0 8rpx;
}

.link-body {
    flex: 1;
    min-height: 0;
    margin-top: 16rpx;
}

.link-state {
    display: block;
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.link-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--color-border-light);
}

.link-item-hover {
    background: var(--color-surface-hover);
}

.link-check {
    width: 36rpx;
    height: 36rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2rpx solid var(--color-border);
    box-sizing: border-box;
}

.link-check.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.link-check-mark {
    font-size: 24rpx;
    line-height: 1;
    color: var(--color-btn-text);
}

.link-name {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    color: var(--color-text);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.link-phone {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
}

.link-footer {
    display: flex;
    gap: 20rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid var(--color-border-light);
}

.link-btn {
    flex: 1;
    height: 84rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 42rpx;
    font-size: 30rpx;
    font-weight: 600;
}

.link-btn-cancel {
    background: var(--color-surface-soft);
    color: var(--color-text-secondary);
    border: 1rpx solid var(--color-border);
}

.link-btn-confirm {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.link-btn-confirm.disabled {
    opacity: 0.6;
}
</style>
