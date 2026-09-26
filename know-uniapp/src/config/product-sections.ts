/**
 * 行业调研模块 - 行业产品(IndustryProduct) 表单/详情 区域树配置（uniapp 端配置驱动源）
 * 转录自 PC 端 know-vue/src/views/biz/industry/product/sections.ts（后端字段权威源）
 * 按用户要求表单去掉"渠道、营销"（下游渠道/下游营销），保留上游/中游产业链
 * 界面结构/交互对齐设计稿 04-表单页设计.md
 */
import type { UniFieldDef, UniSectionDef } from './industry-sections'

export const productSections: UniSectionDef[] = [
    {
        title: '基础信息',
        defaultOpen: true,
        subSections: [
            {
                title: '归属与分类',
                fields: [
                    { label: '所属行业', key: 'industryIds', type: 'industryPicker', placeholder: '请选择关联行业（可多选）', required: true },
                    { label: '分类', key: 'category', placeholder: '请输入分类（选填）' }
                ]
            },
            {
                title: '产品本体',
                fields: [
                    { label: '产品名称', key: 'productName', placeholder: '请输入产品名称（必填）', required: true },
                    { label: '产品概念', key: 'productConcept', type: 'textarea', placeholder: '请输入产品概念（选填：核心功能说明）' }
                ]
            },
            {
                title: '消费者洞察',
                fields: [
                    { label: '消费者洞察', key: 'consumerInsight', type: 'textarea', placeholder: '请输入消费者洞察（选填：市场关联点）' },
                    { label: '利益承诺', key: 'benefitPromise', type: 'textarea', placeholder: '请输入利益承诺（选填）' },
                    { label: '支撑点', key: 'supportPoint', type: 'textarea', placeholder: '请输入支撑点（选填）' }
                ]
            },
            {
                title: '产品细分',
                subSections: [
                    {
                        title: '核心产品（核心价值层）',
                        fields: [{ label: '核心产品', key: 'coreProduct', type: 'textarea', placeholder: '请输入核心产品（选填：核心价值层）' }]
                    },
                    {
                        title: '基础产品（基本效用层）',
                        fields: [{ label: '基础产品', key: 'basicProduct', type: 'textarea', placeholder: '请输入基础产品（选填：基本效用层）' }]
                    },
                    {
                        title: '附加产品（服务/售后/增值层）',
                        fields: [{ label: '附加产品', key: 'additionalProduct', type: 'textarea', placeholder: '请输入附加产品（选填：服务/售后/增值层）' }]
                    },
                    {
                        title: '潜在产品（未来延伸层）',
                        fields: [{ label: '潜在产品', key: 'potentialProduct', type: 'textarea', placeholder: '请输入潜在产品（选填：未来延伸层）' }]
                    }
                ]
            },
            {
                title: '产品生命周期',
                fields: [
                    {
                        label: '产品生命周期',
                        key: 'lifeCycle',
                        type: 'select',
                        placeholder: '请选择产品生命周期（必填）',
                        options: [
                            { label: '产品研发', value: '产品研发' },
                            { label: '引入期', value: '引入期' },
                            { label: '成长期', value: '成长期' },
                            { label: '饱和期', value: '饱和期' },
                            { label: '衰退期', value: '衰退期' }
                        ]
                    }
                ]
            },
            {
                // 用户要求：产品表单去掉"渠道、营销"（下游块），保留上游/中游
                title: '上下游产业链',
                subSections: [
                    {
                        title: '上游（原材料）',
                        fields: [{ label: '上游产业链', key: 'upstreamChain', type: 'textarea', placeholder: '请输入上游产业链（选填）' }]
                    },
                    {
                        title: '中游（产品制造商）',
                        fields: [{ label: '中游产业链', key: 'midstreamChain', type: 'textarea', placeholder: '请输入中游产业链（选填）' }]
                    }
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
                    { label: '动态信息', key: 'dynamicInfo', type: 'textarea', placeholder: '请输入产品动态信息（选填：社会/文化/行业/市场变化；制度影响）' }
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
                    { label: '价值信息', key: 'valueInfo', type: 'textarea', placeholder: '请输入产品价值信息（选填：产品价值/机会评估）' }
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
    }
]