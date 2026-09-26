/**
 * 行业调研模块 - 行业企业(IndustryEnterprise) 表单/详情 区域树配置（uniapp 端配置驱动源）
 * 转录自 PC 端 know-vue/src/views/biz/industry/enterprise/sections.ts（后端字段权威源）
 * 界面结构/交互对齐设计稿 04-表单页设计.md；placeholder 一律带括号说明
 */
import type { UniFieldDef, UniSectionDef } from './industry-sections'

export const enterpriseSections: UniSectionDef[] = [
    {
        title: '基础信息',
        defaultOpen: true,
        subSections: [
            {
                title: '企业与平台',
                fields: [
                    { label: '所属行业', key: 'industryIds', type: 'industryPicker', placeholder: '请选择关联行业（可多选）', required: true },
                    { label: '相关产品', key: 'productIds', type: 'selectMultiple', placeholder: '请选择关联产品（可多选）' },
                    {
                        label: '企业/平台类型',
                        key: 'enterpriseType',
                        type: 'selectMultiple',
                        options: [
                            { label: '生产商', value: '生产商' },
                            { label: '经销商', value: '经销商' },
                            { label: '平台', value: '平台' },
                            { label: 'SaaS服务商', value: 'SaaS服务商' }
                        ],
                        placeholder: '请选择企业/平台类型（可多选）'
                    },
                    { label: '企业/平台名称', key: 'enterpriseName', placeholder: '请输入企业/平台名称（必填）', required: true }
                ]
            },
            {
                title: '工商信息',
                fields: [
                    { label: '成立时间', key: 'establishedDate', type: 'date', placeholder: '请选择成立日期（选填）' },
                    { label: '注册资本', key: 'registeredCapital', type: 'number', placeholder: '请输入注册资本（选填，万元）' },
                    { label: '实缴资本', key: 'paidCapital', type: 'number', placeholder: '请输入实缴资本（选填，万元）' },
                    {
                        label: '企业规模',
                        key: 'scale',
                        type: 'select',
                        options: [
                            { label: '大型', value: '大型' },
                            { label: '中型', value: '中型' },
                            { label: '小型', value: '小型' }
                        ]
                    },
                    { label: '参保人数', key: 'insuredCount', type: 'number', placeholder: '请输入参保人数（选填，人）' },
                    {
                        label: '是否上市',
                        key: 'isListed',
                        type: 'select',
                        options: [{ label: '是', value: 1 }, { label: '否', value: 0 }]
                    }
                ]
            },
            {
                title: '经营与技术',
                fields: [
                    { label: '主要业务', key: 'mainBusiness', type: 'textarea', placeholder: '请输入主要业务（必填）' },
                    { label: '核心技术', key: 'coreTechnology', type: 'textarea', placeholder: '请输入核心技术（选填）' },
                    { label: '产品/服务', key: 'products', type: 'textarea', placeholder: '请输入产品/服务（选填）' },
                    { label: '市场表现', key: 'marketPerformance', type: 'textarea', placeholder: '请输入市场表现（选填：营收/市占率）' }
                ]
            },
            {
                title: '竞争',
                fields: [
                    { label: '主要竞争对手', key: 'competitors', type: 'textarea', placeholder: '请输入主要竞争对手（选填，逗号分隔）' },
                    { label: '竞争优势', key: 'advantage', type: 'textarea', placeholder: '请输入竞争优势（选填）' },
                    { label: '竞争不足', key: 'disadvantage', type: 'textarea', placeholder: '请输入竞争不足（选填）' }
                ]
            },
            {
                title: '上下游产业链',
                subSections: [
                    {
                        title: '上游（原材料）',
                        fields: [{ label: '上游产业链', key: 'upstreamChain', type: 'textarea', placeholder: '请输入上游产业链（选填）' }]
                    },
                    {
                        title: '中游（产品制造商）',
                        fields: [{ label: '中游产业链', key: 'midstreamChain', type: 'textarea', placeholder: '请输入中游产业链（选填）' }]
                    },
                    {
                        title: '下游（销售渠道、营销）',
                        fields: [
                            { label: '下游渠道', key: 'downstreamChannel', type: 'textarea', placeholder: '请输入下游渠道（选填）' },
                            { label: '下游营销', key: 'downstreamMarketing', type: 'textarea', placeholder: '请输入下游营销（选填）' }
                        ]
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
                    { label: '动态信息', key: 'dynamicInfo', type: 'textarea', placeholder: '请输入企业动态信息（选填：社会/文化/行业/市场变化；制度影响）' }
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
                    { label: '价值信息', key: 'valueInfo', type: 'textarea', placeholder: '请输入企业价值信息（选填：企业价值/机会评估）' }
                ]
            }
        ]
    },
    {
        title: '行业资源',
        subSections: [
            {
                title: '行业资源',
                fields: [
                    { label: '行业资源', key: 'industryResources', type: 'textarea', placeholder: '请输入行业资源（选填：关键资源/人脉/资质）' }
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