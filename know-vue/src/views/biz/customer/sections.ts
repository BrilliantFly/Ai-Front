import type { SectionDef } from '../components/types'

/** 客户(Customer) 表单/详情 区域树配置
 *  依据: 客户信息调研.xlsx / 客户信息
 *  说明: 客户模块不改表,仅前端展示层级化;动态/价值/如何把控 映射到 biz_customer_profile 已有字段
 */
export const customerSections: SectionDef[] = [
  {
    title: '基础信息',
    defaultOpen: true,
    subSections: [
      {
        title: '客户个人资料',
        fields: [
          { label: '客户姓名', key: 'name', span: 12 },
          { label: '性别', key: 'gender', type: 'select', options: [{ label: '男', value: 1 }, { label: '女', value: 2 }], span: 12 },
          { label: '年龄', key: 'age', type: 'number', span: 12 },
          { label: '手机号', key: 'phone', span: 12 },
          { label: '邮箱', key: 'email', span: 12 },
          { label: '联系地址', key: 'address', span: 12 },
          { label: '区域', key: 'regionCode', span: 12 },
          { label: '教育背景', key: 'education', span: 12 },
          { label: '教育背景（原始）', key: 'educationRaw', span: 12 },
          { label: '职业', key: 'occupation', span: 12 },
          { label: '职务', key: 'position', span: 12 },
          { label: '性格', key: 'personality', type: 'textarea', span: 12 },
          { label: '兴趣爱好', key: 'hobby', type: 'textarea', span: 12 },
          { label: '价值观', key: 'valuesText', type: 'textarea', span: 12 },
          { label: '衣食住行', key: 'lifestyle', type: 'textarea', span: 12 }
        ]
      },
      {
        title: '家庭情况',
        fields: [
          { label: '婚姻状况', key: 'maritalStatus', span: 12 },
          { label: '家庭情况', key: 'familySituation', type: 'textarea', span: 12 }
        ]
      },
      {
        title: '基础情况',
        fields: [
          { label: '客户类型', key: 'customerType', type: 'select', options: [{ label: '普通客户', value: 1 }, { label: '重点客户', value: 2 }], span: 12 },
          { label: '来源', key: 'source', span: 12 },
          { label: '状态', key: 'status', type: 'select', options: [{ label: '潜在', value: 1 }, { label: '有意向', value: 2 }, { label: '已成交', value: 3 }, { label: '流失', value: 4 }], span: 12 }
        ]
      },
      {
        title: '业务情况',
        fields: [
          { label: '需求等级', key: 'demandLevel', type: 'select', options: [{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }], span: 12 },
          { label: '价值评分', key: 'valueScore', type: 'number', span: 12 },
          { label: '需求意愿', key: 'demandWillingness', type: 'select', options: [{ label: '弱', value: 1 }, { label: '中', value: 2 }, { label: '强', value: 3 }], span: 12 },
          { label: '预算', key: 'demandBudget', type: 'number', span: 12 },
          { label: '决策人', key: 'demandDecision', span: 12 },
          { label: '优先级', key: 'demandPriority', type: 'select', options: [{ label: '低', value: 1 }, { label: '中', value: 2 }, { label: '高', value: 3 }], span: 12 },
          { label: '需求标签', key: 'demandTags', placeholder: '多个标签用逗号分隔', span: 12 },
          { label: '需求描述', key: 'demandDesc', type: 'textarea', span: 24 }
        ]
      }
    ]
  },
  {
    title: '客户企业与行业情况',
    subSections: [
      {
        title: '企业情况',
        fields: [
          { label: '企业名称', key: 'company.name', span: 12 },
          { label: '行业分类', key: 'company.industry', span: 12 },
          { label: '企业规模', key: 'company.scale', span: 12 },
          { label: '成立时间', key: 'company.establishedDate', span: 12 },
          { label: '联系人', key: 'company.contactName', span: 12 },
          { label: '联系电话', key: 'company.contactPhone', span: 12 },
          { label: '主要业务', key: 'company.business', type: 'textarea', span: 12 },
          { label: '主要产品', key: 'company.mainProducts', type: 'textarea', span: 12 },
          { label: '市场表现', key: 'company.marketPerformance', type: 'textarea', span: 12 },
          { label: '竞争优势', key: 'company.competitiveAdvantage', type: 'textarea', span: 12 }
        ]
      },
      {
        title: '行业情况',
        fields: [
          { label: '所属行业(多选)', key: 'industryIds', type: 'selectMultiple', span: 24 }
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
          { label: '动态信息（人性/心理学/读心术；制度对人的影响）', key: 'profile.dynamicInfo', type: 'textarea', span: 24 }
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
          { label: '价值层级（马斯洛需求）', key: 'profile.valueLevel', type: 'select', options: [{ label: '1-生理需求', value: 1 }, { label: '2-安全需求', value: 2 }, { label: '3-社交需求', value: 3 }, { label: '4-尊重需求', value: 4 }, { label: '5-自我实现', value: 5 }], span: 12 },
          { label: '价值期望', key: 'profile.valueExpect', type: 'textarea', span: 12 },
          { label: '价值兴趣', key: 'profile.valueInterest', type: 'textarea', span: 24 }
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
          { label: '应对策略', key: 'profile.strategy', type: 'textarea', span: 12 },
          { label: '话术设计', key: 'profile.talkScript', type: 'textarea', span: 12 },
          { label: '分析', key: 'profile.analysis', type: 'textarea', span: 24 }
        ]
      }
    ]
  }
]