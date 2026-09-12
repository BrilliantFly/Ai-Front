import type { SectionDef } from '../../components/types'

/** 行业产品(IndustryProduct) 表单/详情 区域树配置
 *  依据: 市场与行业调研.xlsx / 行业（产品）
 */
export const productSections: SectionDef[] = [
  {
    title: '基础信息',
    defaultOpen: true,
    subSections: [
      {
        title: '归属与分类',
        fields: [
          { label: '所属行业', key: 'industryIds', type: 'selectMultiple', span: 12, placeholder: '请选择关联行业(可多选)' },
          { label: '分类', key: 'category', span: 12 }
        ]
      },
      {
        title: '产品本体',
        fields: [
          { label: '产品名称', key: 'productName', span: 12 },
          { label: '产品概念', key: 'productConcept', type: 'textarea', span: 12, rows: 4 }
        ]
      },
      {
        title: '消费者洞察',
        fields: [
          { label: '消费者洞察（市场关联点）', key: 'consumerInsight', type: 'textarea', span: 12 },
          { label: '利益承诺', key: 'benefitPromise', type: 'textarea', span: 12 },
          { label: '支撑点', key: 'supportPoint', type: 'textarea', span: 24 }
        ]
      },
      {
        title: '产品细分',
        subSections: [
          {
            title: '核心产品（核心价值层）',
            fields: [{ label: '核心产品', key: 'coreProduct', type: 'textarea', span: 24 }]
          },
          {
            title: '基础产品（基本效用层）',
            fields: [{ label: '基础产品', key: 'basicProduct', type: 'textarea', span: 24 }]
          },
          {
            title: '附加产品（服务/售后/增值层）',
            fields: [{ label: '附加产品', key: 'additionalProduct', type: 'textarea', span: 24 }]
          },
          {
            title: '潜在产品（未来延伸层）',
            fields: [{ label: '潜在产品', key: 'potentialProduct', type: 'textarea', span: 24 }]
          }
        ]
      },
      {
        title: '产品生命周期',
        fields: [
          { label: '产品生命周期', key: 'lifeCycle', placeholder: '如: 导入期/成长期/成熟期/衰退期', span: 24 }
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
          { label: '价值信息（产品价值/机会评估）', key: 'valueInfo', type: 'textarea', span: 24 }
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