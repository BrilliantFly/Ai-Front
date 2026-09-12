import type { SectionDef } from '../components/types'

/** 行业(Industry) 表单/详情 区域树配置
 *  依据: 市场与行业调研.xlsx / 行业（产品与企业）
 */
export const industrySections: SectionDef[] = [
  {
    title: '基础信息',
    defaultOpen: true,
    subSections: [
      {
        title: '行业定义与技术',
        fields: [
          { label: '行业名称', key: 'industryName', span: 12 },
          { label: '行业代码', key: 'industryCode', span: 12 },
          { label: '标签', key: 'tags', placeholder: '多个标签用逗号分隔', span: 12 },
          { label: '可见性', key: 'visibility', type: 'select', options: [{ label: '可见', value: 1 }, { label: '隐藏', value: 0 }], span: 12 },
          { label: '排序', key: 'sort', type: 'number', span: 12 },
          { label: '行业定义', key: 'definition', type: 'textarea', span: 24 },
          { label: '技术', key: 'technology', type: 'textarea', span: 24 }
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
      },
      {
        title: '行业发展概况',
        fields: [
          { label: '发展概述', key: 'developmentOverview', type: 'textarea', span: 24 },
          { label: '市场规模', key: 'marketSize', type: 'textarea', span: 12 },
          { label: '增长潜力', key: 'growthPotential', type: 'textarea', span: 12 }
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
          { label: '价值信息（行业价值/机会评估）', key: 'valueInfo', type: 'textarea', span: 24 }
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