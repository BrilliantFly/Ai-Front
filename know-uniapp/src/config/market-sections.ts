/**
 * 行业调研模块 - 行业市场(IndustryMarket) 表单/详情 区域树配置（uniapp 端配置驱动源）
 * 转录自 PC 端 know-vue/src/views/biz/industry/market/sections.ts（后端字段权威源）
 * 界面结构/交互对齐设计稿 04-表单页设计.md；市场为行业 1:1（industryIds[0] 为主行业）
 */
import type { UniFieldDef, UniSectionDef } from './industry-sections'

export const marketSections: UniSectionDef[] = [
    {
        title: '基础信息',
        defaultOpen: true,
        subSections: [
            {
                title: '需求与商机',
                fields: [
                    { label: '所属行业', key: 'industryIds', type: 'industryPicker', placeholder: '请选择关联行业（可多选，首项为主行业）', required: true },
                    { label: '市场需求', key: 'demand', type: 'textarea', placeholder: '请输入市场需求（必填：客群规模/痛点）', required: true },
                    { label: '商机', key: 'opportunity', type: 'textarea', placeholder: '请输入商机（选填：可切入的机会点）' }
                ]
            },
            {
                title: '商业（商业模式）',
                subSections: [
                    {
                        title: '价值创造',
                        fields: [
                            { label: '价值主张', key: 'valueProposition', type: 'textarea', placeholder: '请输入价值主张（选填）' },
                            { label: '客户细分', key: 'customerSegment', type: 'textarea', placeholder: '请输入客户细分（选填）' },
                            { label: '渠道通路', key: 'channel', type: 'textarea', placeholder: '请输入渠道通路（选填）' },
                            { label: '客户关系', key: 'customerRelation', type: 'textarea', placeholder: '请输入客户关系（选填）' },
                            { label: '收入来源', key: 'revenueSource', type: 'textarea', placeholder: '请输入收入来源（选填）' },
                            { label: '关键资源', key: 'keyResource', type: 'textarea', placeholder: '请输入关键资源（选填）' },
                            { label: '关键伙伴', key: 'keyPartner', type: 'textarea', placeholder: '请输入关键伙伴（选填）' },
                            { label: '关键活动', key: 'keyActivity', type: 'textarea', placeholder: '请输入关键活动（选填）' },
                            { label: '成本结构', key: 'costStructure', type: 'textarea', placeholder: '请输入成本结构（选填）' }
                        ]
                    },
                    {
                        title: '价值评价与分配',
                        fields: [
                            { label: '价值评价', key: 'valueEvaluation', type: 'textarea', placeholder: '请输入价值评价（选填）' },
                            { label: '价值分配', key: 'valueDistribution', type: 'textarea', placeholder: '请输入价值分配（选填：产业链利润分配）' }
                        ]
                    },
                    {
                        title: '竞争手段',
                        fields: [
                            { label: '竞争手段', key: 'competitionMethod', type: 'textarea', placeholder: '请输入竞争手段（选填：行业/产品/企业三层）' }
                        ]
                    }
                ]
            },
            {
                title: '营销（推广引流）',
                fields: [
                    { label: '推广引流', key: 'promoChannel', type: 'textarea', placeholder: '请输入推广引流（选填：企业/产品两个维度）' }
                ]
            }
        ]
    },
    {
        title: '动态信息',
        subSections: [
            {
                title: '动态信息',
                fields: [
                    { label: '动态信息', key: 'dynamicInfo', type: 'textarea', placeholder: '请输入市场动态信息（选填：社会/文化/行业/市场变化；制度影响）' }
                ]
            }
        ]
    },
    {
        title: '价值信息',
        subSections: [
            {
                title: '价值信息（价值新增）',
                fields: [
                    { label: '价值信息', key: 'valueInfo', type: 'textarea', placeholder: '请输入市场价值信息（选填：市场价值/机会评估）' }
                ]
            }
        ]
    },
    {
        title: '如何把握',
        subSections: [
            {
                title: '如何把握',
                fields: [
                    { label: '如何把握', key: 'strategy', type: 'textarea', placeholder: '请输入如何把握（选填：切入策略/竞争打法）' }
                ]
            }
        ]
    },
    {
        title: '其他',
        subSections: [
            {
                title: '财务指标',
                fields: [
                    { label: '毛利额', key: 'grossProfit', type: 'number', placeholder: '请输入毛利额（选填，万元）' },
                    { label: '毛利率(%)', key: 'grossMargin', type: 'number', placeholder: '请输入毛利率（选填，%）' },
                    { label: '净利额', key: 'netProfit', type: 'number', placeholder: '请输入净利额（选填，万元）' },
                    { label: '净利率(%)', key: 'netMargin', type: 'number', placeholder: '请输入净利率（选填，%）' }
                ]
            }
        ]
    }
]