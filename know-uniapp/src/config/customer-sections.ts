/**
 * 客户(Customer) 表单/详情 区域树配置（uniapp 端配置驱动源）
 * 转录自 PC 端 know-vue/src/views/biz/customer/sections.ts（权威源）
 * 字段 key 支持点路径：customer 根字段 / company.* / profile.* / industryIds
 */

export interface UniFieldDef {
    /** 表单标签 */
    label: string
    /** 字段 key（点路径） */
    key: string
    /** 控件类型 */
    type?: 'text' | 'number' | 'textarea' | 'select' | 'selectMultiple' | 'industryPicker'
    /** 单选/多选静态选项 */
    options?: { label: string; value: string | number }[]
    /** 输入占位提示（需带括号说明） */
    placeholder?: string
}

export interface UniSectionDef {
    /** 区段标题 */
    title: string
    /** 默认展开 */
    defaultOpen?: boolean
    /** 叶子区段字段 */
    fields?: UniFieldDef[]
    /** 嵌套子区段（PC 端「基础认识/详细认识」两级，uni 保留三级） */
    subSections?: UniSectionDef[]
}

export const customerSections: UniSectionDef[] = [
    {
        title: '客户个人资料',
        defaultOpen: true,
        subSections: [
            {
                title: '基础认识',
                subSections: [
                    {
                        title: '基础信息',
                        fields: [
                            { label: '客户姓名', key: 'name', placeholder: '请输入客户姓名（必填）' },
                            { label: '性别', key: 'gender', type: 'select', options: [{ label: '男', value: 1 }, { label: '女', value: 2 }] },
                            { label: '年龄', key: 'age', type: 'number', placeholder: '请输入客户年龄（选填）' },
                            { label: '手机号', key: 'phone', placeholder: '请输入客户手机号（选填）' },
                            { label: '邮箱', key: 'email', placeholder: '请输入客户邮箱（选填）' },
                            { label: '联系地址', key: 'address', placeholder: '请输入联系地址（选填）' }
                        ]
                    },
                    {
                        title: '个人信息',
                        fields: [
                            { label: '外貌', key: 'appearance', type: 'textarea', placeholder: '请输入外貌描述（选填）' },
                            { label: '性格', key: 'personality', type: 'textarea', placeholder: '请输入性格描述（选填）' },
                            { label: '衣食住行', key: 'lifestyle', type: 'textarea', placeholder: '请输入衣食住行情况（选填）' },
                            { label: '兴趣爱好', key: 'hobby', type: 'textarea', placeholder: '请输入兴趣爱好（选填）' }
                        ]
                    },
                    {
                        title: '职业信息',
                        fields: [
                            { label: '职业', key: 'occupation', placeholder: '请输入职业（选填）' },
                            { label: '职务', key: 'position', placeholder: '请输入职务（选填）' },
                            {
                                label: '赚钱方式',
                                key: 'earningWay',
                                type: 'selectMultiple',
                                placeholder: '请选择赚钱方式（可多选）',
                                options: [
                                    { label: '体力层', value: '体力层' },
                                    { label: '技能层', value: '技能层' },
                                    { label: '资源层', value: '资源层' },
                                    { label: '资本层', value: '资本层' },
                                    { label: '创业层', value: '创业层' },
                                    { label: '投资层', value: '投资层' },
                                    { label: '高级管理层', value: '高级管理层' },
                                    { label: '专家顾问层', value: '专家顾问层' },
                                    { label: '科技创新层', value: '科技创新层' },
                                    { label: '社会影响层', value: '社会影响层' }
                                ]
                            }
                        ]
                    },
                    {
                        title: '圈子',
                        fields: [
                            {
                                label: '社会阶层',
                                key: 'socialClass',
                                type: 'selectMultiple',
                                placeholder: '请选择社会阶层（可多选）',
                                options: [
                                    { label: '思想层', value: '思想层' },
                                    { label: '投资层', value: '投资层' },
                                    { label: '创业层', value: '创业层' },
                                    { label: '生意层', value: '生意层' },
                                    { label: '打工人', value: '打工人' }
                                ]
                            },
                            { label: '社交圈', key: 'socialCircle', type: 'textarea', placeholder: '请输入社交圈描述（选填）' }
                        ]
                    }
                ]
            },
            {
                title: '详细认识',
                subSections: [
                    {
                        title: '家庭状态',
                        fields: [
                            { label: '婚姻状态', key: 'maritalStatus', placeholder: '请输入婚姻状态（选填）' },
                            { label: '家庭状况', key: 'familySituation', type: 'textarea', placeholder: '请输入家庭状况（选填）' },
                            { label: '家庭住址', key: 'familyAddress', placeholder: '请输入家庭住址（选填）' }
                        ]
                    },
                    {
                        title: '教育背景',
                        fields: [
                            { label: '教育背景', key: 'education', placeholder: '请输入教育背景（选填）' },
                            { label: '价值观', key: 'valuesText', type: 'textarea', placeholder: '请输入价值观描述（选填）' }
                        ]
                    },
                    {
                        title: '生活技能',
                        fields: [
                            { label: '基础生活技能', key: 'basicLifeSkill', type: 'textarea', placeholder: '请输入基础生活技能（选填）' },
                            { label: '职业技能', key: 'vocationalSkill', type: 'textarea', placeholder: '请输入职业技能（选填）' },
                            { label: '运动和户外技能', key: 'sportsSkill', type: 'textarea', placeholder: '请输入运动和户外技能（选填）' },
                            { label: '艺术和创意技能', key: 'artSkill', type: 'textarea', placeholder: '请输入艺术和创意技能（选填）' },
                            { label: '技术和数字技能', key: 'techSkill', type: 'textarea', placeholder: '请输入技术和数字技能（选填）' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: '基础情况',
        defaultOpen: true,
        subSections: [
            {
                title: '基础情况',
                fields: [
                    {
                        label: '客户类型',
                        key: 'customerType',
                        type: 'select',
                        options: [{ label: '普通客户', value: 1 }, { label: '重点客户', value: 2 }]
                    },
                    { label: '来源', key: 'source', placeholder: '请输入客户来源（选填）' },
                    {
                        label: '状态',
                        key: 'status',
                        type: 'select',
                        options: [{ label: '潜在', value: 1 }, { label: '有意向', value: 2 }, { label: '已成交', value: 3 }, { label: '流失', value: 4 }]
                    },
                    { label: '区域', key: 'regionCode', placeholder: '请输入区域编码（选填）' }
                ]
            }
        ]
    },
    {
        title: '业务情况',
        defaultOpen: true,
        subSections: [
            {
                title: '业务情况',
                fields: [
                    { label: '需求等级', key: 'demandLevel', type: 'select', options: [{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }] },
                    { label: '价值评分', key: 'valueScore', type: 'number', placeholder: '请输入价值评分（选填）' },
                    { label: '需求意愿', key: 'demandWillingness', type: 'select', options: [{ label: '弱', value: 1 }, { label: '中', value: 2 }, { label: '强', value: 3 }] },
                    { label: '预算', key: 'demandBudget', type: 'number', placeholder: '请输入预算金额（选填）' },
                    { label: '决策人', key: 'demandDecision', placeholder: '请输入决策人（选填）' },
                    { label: '优先级', key: 'demandPriority', type: 'select', options: [{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }] },
                    { label: '需求标签', key: 'demandTags', placeholder: '多个标签用逗号分隔（选填）' },
                    { label: '需求描述', key: 'demandDesc', type: 'textarea', placeholder: '请输入需求描述（选填）' }
                ]
            }
        ]
    },
    {
        title: '客户企业与行业情况',
        defaultOpen: true,
        subSections: [
            {
                title: '企业情况',
                fields: [
                    { label: '企业名称', key: 'company.name', placeholder: '请输入企业名称（选填）' },
                    { label: '行业分类', key: 'company.industry', placeholder: '请输入行业分类（选填）' },
                    { label: '企业规模', key: 'company.scale', placeholder: '请输入企业规模（选填）' },
                    { label: '成立时间', key: 'company.establishedDate', placeholder: '请输入成立时间（选填）' },
                    { label: '联系人', key: 'company.contactName', placeholder: '请输入联系人（选填）' },
                    { label: '联系电话', key: 'company.contactPhone', placeholder: '请输入联系电话（选填）' },
                    { label: '主要业务', key: 'company.business', type: 'textarea', placeholder: '请输入主要业务（选填）' },
                    { label: '主要产品', key: 'company.mainProducts', type: 'textarea', placeholder: '请输入主要产品（选填）' },
                    { label: '市场表现', key: 'company.marketPerformance', type: 'textarea', placeholder: '请输入市场表现（选填）' },
                    { label: '竞争优势', key: 'company.competitiveAdvantage', type: 'textarea', placeholder: '请输入竞争优势（选填）' }
                ]
            },
            {
                title: '行业情况',
                fields: [
                    {
                        label: '所属行业（多选）',
                        key: 'industryIds',
                        type: 'industryPicker',
                        placeholder: '请选择所属行业（可多选）'
                    }
                ]
            }
        ]
    },
    {
        title: '动态信息',
        defaultOpen: false,
        subSections: [
            {
                title: '动态信息',
                fields: [
                    { label: '动态信息（人性/心理学/读心术；制度对人的影响）', key: 'profile.dynamicInfo', type: 'textarea', placeholder: '请输入动态信息（选填）' }
                ]
            }
        ]
    },
    {
        title: '价值信息',
        defaultOpen: false,
        subSections: [
            {
                title: '价值信息（价值新增）',
                fields: [
                    {
                        label: '价值层级（马斯洛需求）',
                        key: 'profile.valueLevel',
                        type: 'select',
                        options: [
                            { label: '1-生理需求', value: 1 },
                            { label: '2-安全需求', value: 2 },
                            { label: '3-社交需求', value: 3 },
                            { label: '4-尊重需求', value: 4 },
                            { label: '5-自我实现', value: 5 }
                        ]
                    },
                    { label: '价值期望', key: 'profile.valueExpect', type: 'textarea', placeholder: '请输入价值期望（选填）' },
                    { label: '价值兴趣', key: 'profile.valueInterest', type: 'textarea', placeholder: '请输入价值兴趣（选填）' }
                ]
            }
        ]
    },
    {
        title: '如何把握',
        defaultOpen: false,
        subSections: [
            {
                title: '如何把握',
                fields: [
                    { label: '应对策略', key: 'profile.strategy', type: 'textarea', placeholder: '请输入应对策略（选填）' },
                    { label: '话术设计', key: 'profile.talkScript', type: 'textarea', placeholder: '请输入话术设计（选填）' },
                    { label: '分析', key: 'profile.analysis', type: 'textarea', placeholder: '请输入分析内容（选填）' }
                ]
            }
        ]
    }
]

/** 区段扁平化：返回所有叶子字段列表 */
export function collectFields(sections: UniSectionDef[]): UniFieldDef[] {
    const result: UniFieldDef[] = []
    const walk = (list: UniSectionDef[]) => {
        for (const section of list) {
            if (section.fields && section.fields.length) {
                result.push(...section.fields)
            }
            if (section.subSections && section.subSections.length) {
                walk(section.subSections)
            }
        }
    }
    walk(sections)
    return result
}