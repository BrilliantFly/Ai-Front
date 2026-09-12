import type { SectionDef } from '../../components/types'

/** 行业企业(IndustryEnterprise) 表单/详情 区域树配置
 *  依据: 市场与行业调研.xlsx / 行业（企业）
 */
export const enterpriseSections: SectionDef[] = [
  {
    title: '基础信息',
    defaultOpen: true,
    subSections: [
      {
        title: '企业与平台',
        fields: [
          { label: '所属行业', key: 'industryIds', type: 'selectMultiple', span: 12, placeholder: '请选择关联行业(可多选)' },
          { label: '相关产品', key: 'productIds', type: 'selectMultiple', span: 12, placeholder: '请选择关联产品(可多选)' },
          { label: '企业/平台类型', key: 'enterpriseType', placeholder: '如: 生产商/经销商/平台/SaaS服务商', span: 12 },
          { label: '企业/平台名称', key: 'enterpriseName', span: 12 }
        ]
      },
      {
        title: '工商信息',
        fields: [
          { label: '成立时间', key: 'establishedDate', placeholder: '如: 2000-01-01', span: 12 },
          { label: '注册资本', key: 'registeredCapital', span: 12 },
          { label: '实缴资本', key: 'paidCapital', span: 12 },
          { label: '企业规模', key: 'scale', placeholder: '如: 大型/中型/小型', span: 12 },
          { label: '参保人数', key: 'insuredCount', type: 'number', span: 12 },
          { label: '是否上市', key: 'isListed', type: 'select', options: [{ label: '是', value: 1 }, { label: '否', value: 0 }], span: 12 }
        ]
      },
      {
        title: '经营与技术',
        fields: [
          { label: '主要业务', key: 'mainBusiness', type: 'textarea', span: 12 },
          { label: '核心技术', key: 'coreTechnology', type: 'textarea', span: 12 },
          { label: '产品/服务', key: 'products', type: 'textarea', span: 12 },
          { label: '市场表现', key: 'marketPerformance', type: 'textarea', placeholder: '营收/市占率', span: 12 }
        ]
      },
      {
        title: '竞争',
        fields: [
          { label: '主要竞争对手', key: 'competitors', type: 'textarea', span: 12 },
          { label: '竞争优势', key: 'advantage', type: 'textarea', span: 12 },
          { label: '竞争不足', key: 'disadvantage', type: 'textarea', span: 24 }
        ]
      },
      {
        title: '上下游产业链',
        subSections: [
          {
            title: '上游（原材料）',
            fields: [{ label: '上游产业链', key: 'upstreamChain', type: 'textarea', span: 24 }]
          },
          {
            title: '中游（产品制造商）',
            fields: [{ label: '中游产业链', key: 'midstreamChain', type: 'textarea', span: 24 }]
          },
          {
            title: '下游（销售渠道、营销）',
            subSections: [
              {
                title: '渠道',
                fields: [{ label: '下游渠道', key: 'downstreamChannel', type: 'textarea', span: 24 }]
              },
              {
                title: '营销',
                fields: [{ label: '下游营销', key: 'downstreamMarketing', type: 'textarea', span: 24 }]
              }
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
          { label: '价值信息（企业价值/机会评估）', key: 'valueInfo', type: 'textarea', span: 24 }
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
          { label: '行业资源（关键资源/人脉/资质）', key: 'industryResources', type: 'textarea', span: 24 }
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
  }
]