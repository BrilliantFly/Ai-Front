import type { SectionDef } from '../../components/types'

/** 行业与市场(IndustryMarket) 表单/详情 区域树配置
 *  依据: 市场与行业调研.xlsx / 行业与市场
 */
export const marketSections: SectionDef[] = [
  {
    title: '基础信息',
    defaultOpen: true,
    subSections: [
      {
        title: '需求与商机',
        fields: [
          { label: '所属行业', key: 'industryIds', type: 'selectMultiple', span: 24, placeholder: '请选择关联行业(可多选)' },
          { label: '市场需求', key: 'demand', type: 'textarea', span: 12, placeholder: '客群规模/痛点' },
          { label: '商机', key: 'opportunity', type: 'textarea', span: 12, placeholder: '可切入的机会点' }
        ]
      },
      {
        title: '商业（商业模式）',
        subSections: [
          {
            title: '价值创造',
            fields: [
              { label: '价值主张', key: 'valueProposition', type: 'textarea', span: 12 },
              { label: '客户细分', key: 'customerSegment', type: 'textarea', span: 12 },
              { label: '渠道通路', key: 'channel', type: 'textarea', span: 12 },
              { label: '客户关系', key: 'customerRelation', type: 'textarea', span: 12 },
              { label: '收入来源', key: 'revenueSource', type: 'textarea', span: 12 },
              { label: '关键资源', key: 'keyResource', type: 'textarea', span: 12 },
              { label: '关键伙伴', key: 'keyPartner', type: 'textarea', span: 12 },
              { label: '关键活动', key: 'keyActivity', type: 'textarea', span: 12 },
              { label: '成本结构', key: 'costStructure', type: 'textarea', span: 24 }
            ]
          },
          {
            title: '价值评价与分配',
            fields: [
              { label: '价值评价', key: 'valueEvaluation', type: 'textarea', span: 12 },
              { label: '价值分配', key: 'valueDistribution', type: 'textarea', span: 12, placeholder: '产业链利润分配' }
            ]
          },
          {
            title: '竞争手段',
            fields: [
              { label: '竞争手段（行业/产品/企业三层）', key: 'competitionMethod', type: 'textarea', span: 24 }
            ]
          }
        ]
      },
      {
        title: '营销（推广引流）',
        fields: [
          { label: '推广引流（企业/产品两个维度）', key: 'promoChannel', type: 'textarea', span: 24 }
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
          { label: '动态信息（社会/文化/行业/市场变化；制度影响）', key: 'dynamicInfo', type: 'textarea', span: 24 }
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
          { label: '价值信息（市场价值/机会评估）', key: 'valueInfo', type: 'textarea', span: 24 }
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
          { label: '如何把握（切入策略/竞争打法）', key: 'strategy', type: 'textarea', span: 24 }
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
          { label: '毛利额', key: 'grossProfit', type: 'number', span: 12 },
          { label: '毛利率(%)', key: 'grossMargin', type: 'number', span: 12 },
          { label: '净利额', key: 'netProfit', type: 'number', span: 12 },
          { label: '净利率(%)', key: 'netMargin', type: 'number', span: 12 }
        ]
      }
    ]
  }
]