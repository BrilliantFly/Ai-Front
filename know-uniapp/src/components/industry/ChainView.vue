<template>
    <view class="chain-view">
        <template v-for="(lane, index) in lanes" :key="lane.key">
            <view class="chain-lane">
                <view class="lane-head" @tap="toggle(lane.key)">
                    <view class="lane-bar"></view>
                    <text class="lane-title">{{ lane.title }}</text>
                    <text class="lane-toggle">{{ collapsed[lane.key] ? '▾ 展开' : '▴ 收起' }}</text>
                </view>
                <view v-if="!collapsed[lane.key]" class="lane-body">
                    <view class="lane-group">
                        <text class="group-label">商家</text>
                        <view v-if="lane.names.length" class="chips-wrap">
                            <text
                                v-for="(name, i) in lane.names"
                                :key="`${lane.key}-name-${i}`"
                                class="chain-chip"
                                >{{ name }}</text
                            >
                        </view>
                        <text v-else class="group-empty">--</text>
                    </view>
                    <view class="lane-group">
                        <text class="group-label">渠道</text>
                        <text v-if="lane.channels.length" class="channel-text">{{
                            lane.channels.join('、')
                        }}</text>
                        <text v-else class="group-empty">--</text>
                    </view>
                    <view v-if="lane.marketing.length" class="lane-group">
                        <text class="group-label">营销</text>
                        <view class="chips-wrap">
                            <text
                                v-for="(name, i) in lane.marketing"
                                :key="`${lane.key}-marketing-${i}`"
                                class="chain-chip"
                                >{{ name }}</text
                            >
                        </view>
                    </view>
                </view>
            </view>
            <view v-if="index < lanes.length - 1" class="lane-arrow">↓</view>
        </template>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/** 产业链单段（商家名称 / 渠道 / 营销） */
interface ChainSegment {
    name?: string[]
    channel?: string[]
    marketing?: string[]
}

const props = defineProps<{
    /** 上游（原材料） */
    upstream?: ChainSegment
    /** 中游（产品制造商） */
    midstream?: ChainSegment
    /** 下游（销售渠道、营销） */
    downstream?: ChainSegment
}>()

const collapsed = ref<Record<string, boolean>>({
    upstream: false,
    midstream: false,
    downstream: false
})

const pick = (list?: string[]) => (Array.isArray(list) ? list.filter(Boolean) : [])

const lanes = computed(() => [
    {
        key: 'upstream',
        title: '上游（原材料）',
        names: pick(props.upstream?.name),
        channels: pick(props.upstream?.channel),
        marketing: [] as string[]
    },
    {
        key: 'midstream',
        title: '中游（产品制造商）',
        names: pick(props.midstream?.name),
        channels: pick(props.midstream?.channel),
        marketing: [] as string[]
    },
    {
        key: 'downstream',
        title: '下游（销售渠道、营销）',
        names: pick(props.downstream?.name),
        channels: pick(props.downstream?.channel),
        marketing: pick(props.downstream?.marketing)
    }
])

const toggle = (key: string) => {
    collapsed.value[key] = !collapsed.value[key]
}
</script>

<style scoped lang="scss">
.chain-view {
    display: flex;
    flex-direction: column;
    padding: 20rpx 0 4rpx;
}

.chain-lane {
    border-radius: 20rpx;
    background: var(--color-surface-soft);
    overflow: hidden;
}

.lane-head {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 18rpx 24rpx;
}

.lane-bar {
    width: 8rpx;
    height: 24rpx;
    border-radius: 4rpx;
    background: var(--gradient-primary);
    flex-shrink: 0;
}

.lane-title {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--color-text);
}

.lane-toggle {
    font-size: 24rpx;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
}

.lane-body {
    padding: 0 24rpx 20rpx;
}

.lane-group {
    margin-top: 14rpx;
}

.group-label {
    display: block;
    margin-bottom: 10rpx;
    font-size: 22rpx;
    color: var(--color-text-tertiary);
}

.chips-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.chain-chip {
    display: inline-flex;
    align-items: center;
    padding: 4rpx 18rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    white-space: nowrap;
}

.channel-text {
    display: block;
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--color-text);
    word-break: break-all;
}

.group-empty {
    font-size: 26rpx;
    color: var(--color-text-tertiary);
}

.lane-arrow {
    align-self: center;
    padding: 10rpx 0;
    font-size: 30rpx;
    line-height: 1;
    color: var(--color-text-tertiary);
}
</style>
