/**
 * 行业调研模块 - 行业(Industry) 表单/详情 区域树配置（uniapp 端配置驱动源）
 * 转录自 PC 端 know-vue/src/views/biz/industry/sections.ts（后端字段权威源）
 * 界面结构/交互对齐设计稿 04-表单页设计.md；placeholder 一律带括号说明（选填/必填）
 */

export interface UniFieldDef {
    /** 表单标签 */
    label: string
    /** 字段 key（点路径） */
    key: string
    /** 控件类型：input=单行文本 / number=数字(digit) / textarea=多行 / select=单选弹层 / selectMultiple=多选 chips / industryPicker=行业多选 / date=日期选择 */
    type?: 'text' | 'number' | 'textarea' | 'select' | 'selectMultiple' | 'industryPicker' | 'date'
    /** 单选/多选静态选项 */
    options?: { label: string; value: string | number }[]
    /** 输入占位提示（需带括号说明） */
    placeholder?: string
    /** 必填（提交校验：primary 优先级合并入规则） */
    required?: boolean
}

export interface UniSectionDef {
    /** 区段标题 */
    title: string
    /** 默认展开 */
    defaultOpen?: boolean
    /** 叶子区段字段 */
    fields?: UniFieldDef[]
    /** 嵌套子区段（保留 PC 端三级结构：区段 > 子区段 > 子子区段 > 字段） */
    subSections?: UniSectionDef[]
}

export const industrySections: UniSectionDef[] = [
    {
        title: '基础信息',
        defaultOpen: true,
        subSections: [
            {
                title: '行业定义与技术',
                fields: [
                    { label: '行业名称', key: 'industryName', placeholder: '请输入行业名称（必填）', required: true },
                    { label: '行业代码', key: 'industryCode', placeholder: '请输入行业代码（选填，如 AI-01）' },
                    { label: '标签', key: 'tags', placeholder: '多个标签用逗号分隔（选填）' },
                    {
                        label: '可见性',
                        key: 'visibility',
                        type: 'select',
                        options: [{ label: '可见', value: 1 }, { label: '隐藏', value: 0 }]
                    },
                    { label: '排序', key: 'sort', type: 'number', placeholder: '请输入排序（选填）' },
                    { label: '行业定义', key: 'definition', type: 'textarea', placeholder: '请输入行业定义（必填，描述行业边界与范围）' },
                    { label: '技术', key: 'technology', type: 'textarea', placeholder: '请输入行业技术（选填：商业模式/技术形态）' }
                ]
            },
            {
                title: '上下游产业链',
                subSections: [
                    {
                        title: '上游（原材料）',
                        fields: [{ label: '上游产业链', key: 'upstreamChain', type: 'textarea', placeholder: '请输入上游产业链（选填，如芯片、元器件）' }]
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
            },
            {
                title: '行业发展概况',
                fields: [
                    { label: '发展概述', key: 'developmentOverview', type: 'textarea', placeholder: '请输入行业发展概述（必填）' },
                    { label: '市场规模', key: 'marketSize', type: 'textarea', placeholder: '请输入市场规模（选填）' },
                    { label: '增长潜力', key: 'growthPotential', type: 'textarea', placeholder: '请输入增长潜力（选填，低/中/高）' }
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
                    { label: '动态信息', key: 'dynamicInfo', type: 'textarea', placeholder: '请输入行业动态信息（选填：社会/文化/行业/市场变化；制度影响）' }
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
                    { label: '价值信息', key: 'valueInfo', type: 'textarea', placeholder: '请输入行业价值信息（选填：行业价值/机会评估）' }
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