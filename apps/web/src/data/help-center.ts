export interface HelpSection {
  title: string;
  body: string;
  steps?: string[];
}

export interface HelpModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  quickActions: string[];
  sections: HelpSection[];
}

export interface HelpFaq {
  question: string;
  answer: string;
  keywords: string[];
}

export const helpModules: HelpModule[] = [
  {
    id: 'quick-start',
    title: '快速开始',
    description: '从首次登录到完成一条招聘交付的最短路径。',
    icon: 'rocket',
    keywords: ['新手', '入门', '登录', '流程', '交付'],
    quickActions: ['登录系统', '创建客户', '创建职位', '上传简历'],
    sections: [
      {
        title: '推荐使用顺序',
        body: '新用户建议先完成客户和职位基础数据，再导入候选人，最后进入匹配和交付看板。',
        steps: ['进入客户管理，创建或导入企业客户。', '进入职位管理，创建招聘需求。', '进入人才库，上传简历或从飞书导入。', '在职位详情查看匹配结果，并推进交付状态。'],
      },
      {
        title: '日常工作入口',
        body: '工作台适合看全局概览；人才库处理候选人；职位管理维护需求；流程看板追踪推荐、面试、Offer 和入职。',
      },
    ],
  },
  {
    id: 'dashboard',
    title: '仪表盘',
    description: '查看人才库、岗位、推荐和入职等核心指标。',
    icon: 'dashboard',
    keywords: ['工作台', '仪表盘', '数据', '概览'],
    quickActions: ['刷新数据', '查看漏斗', '进入职位', '进入客户'],
    sections: [
      {
        title: '核心指标',
        body: '仪表盘展示人才库总量、活跃岗位、累计推荐、成功入职和交付漏斗，适合每日快速判断业务健康度。',
      },
      {
        title: '数据为空时',
        body: '优先确认是否已有候选人、职位和推荐记录。新部署环境或演示环境可能只有少量样例数据。',
      },
    ],
  },
  {
    id: 'candidates',
    title: '人才库与简历上传',
    description: '上传、解析、筛选、分享和导出候选人简历。',
    icon: 'users',
    keywords: ['候选人', '人才库', '简历', '上传', '解析', '导出'],
    quickActions: ['上传简历', '筛选候选人', '批量分享', '导出简历'],
    sections: [
      {
        title: '上传简历',
        body: '支持从人才库页面上传简历，系统会进行解析并生成候选人档案。',
        steps: ['点击上传简历。', '选择本地简历文件。', '等待解析完成。', '检查候选人基本信息和工作经历。'],
      },
      {
        title: '筛选与批量操作',
        body: '可按状态、学历、工作经验等条件筛选候选人，并对结果执行批量分享或导出。',
      },
    ],
  },
  {
    id: 'feishu-import',
    title: '飞书导入',
    description: '从飞书表格或客户数据源批量导入候选人和企业。',
    icon: 'import',
    keywords: ['飞书', '导入', '表格', '批量', '客户'],
    quickActions: ['导入候选人', '导入企业', '查看导入结果', '处理失败记录'],
    sections: [
      {
        title: '导入前检查',
        body: '确认飞书数据字段完整，尤其是候选人姓名、联系方式、企业名称和职位相关字段。',
      },
      {
        title: '导入失败处理',
        body: '如果导入失败，优先检查飞书权限、字段格式、必填项和网络连通性。',
      },
    ],
  },
  {
    id: 'enterprises',
    title: '客户管理',
    description: '维护企业档案、联系人、合作状态和客户职位。',
    icon: 'building',
    keywords: ['客户', '企业', '联系人', '合作状态'],
    quickActions: ['新增客户', '飞书导入', '查看详情', '维护联系人'],
    sections: [
      {
        title: '企业档案',
        body: '客户管理用于沉淀企业基础信息、行业、合作状态和相关岗位，是后续职位和交付流程的基础。',
      },
      {
        title: '客户详情',
        body: '进入企业详情后，可查看客户相关职位、推荐进展和历史合作记录。',
      },
    ],
  },
  {
    id: 'jobs',
    title: '职位管理',
    description: '创建招聘需求，维护薪资、技能、地点和招聘进度。',
    icon: 'briefcase',
    keywords: ['职位', '岗位', '招聘需求', '薪资', '技能'],
    quickActions: ['创建职位', '查看详情', '编辑需求', '查看匹配'],
    sections: [
      {
        title: '创建职位',
        body: '职位信息越完整，后续 AI 匹配质量越高。建议补齐岗位职责、技能要求、薪资范围、地点和招聘人数。',
      },
      {
        title: '职位详情',
        body: '职位详情页用于查看职位进展、候选人匹配和推荐结果。',
      },
    ],
  },
  {
    id: 'matching',
    title: 'AI 匹配与推荐',
    description: '根据职位要求和候选人画像生成匹配建议。',
    icon: 'sparkles',
    keywords: ['AI', '匹配', '推荐', '候选人', '岗位'],
    quickActions: ['查看匹配', '筛选推荐', '推进交付', '复核理由'],
    sections: [
      {
        title: '匹配结果',
        body: '匹配结果应作为辅助判断。推荐前建议人工复核候选人经验、技能、稳定性和客户偏好。',
      },
      {
        title: '提升匹配质量',
        body: '保持职位要求和候选人简历结构完整，能明显提高匹配解释和排序效果。',
      },
    ],
  },
  {
    id: 'delivery',
    title: '交付看板',
    description: '跟进候选人从初筛、推荐、面试、Offer 到入职的完整链路。',
    icon: 'kanban',
    keywords: ['交付', '看板', '推荐', '面试', 'Offer', '入职'],
    quickActions: ['查看状态', '拖动阶段', '导出报告', 'AI 催办'],
    sections: [
      {
        title: '状态流转',
        body: '交付看板按招聘流程分列展示候选人，可用于跟踪每位候选人的当前阶段。',
      },
      {
        title: '异常跟进',
        body: '如果候选人长时间停留在某一阶段，建议补充跟进记录或联系客户确认下一步。',
      },
    ],
  },
  {
    id: 'email',
    title: '邮箱归集',
    description: '配置 IMAP 邮箱，同步邮件并关联候选人沟通记录。',
    icon: 'mail',
    keywords: ['邮箱', 'IMAP', '邮件', '同步', '归集'],
    quickActions: ['添加邮箱', '刷新同步', '查看邮件', '关联候选人'],
    sections: [
      {
        title: '添加邮箱',
        body: '邮箱归集需要配置 IMAP 账户。配置前请确认邮箱服务已开启 IMAP，并使用授权码或专用密码。',
      },
      {
        title: '同步失败',
        body: '同步失败时检查 IMAP 主机、端口、加密方式、授权码和服务器网络访问。',
      },
    ],
  },
  {
    id: 'contracts',
    title: '合同管理',
    description: '管理客户协议、合同金额、有效期和到期提醒。',
    icon: 'file',
    keywords: ['合同', '协议', '法务', '到期', '金额'],
    quickActions: ['上传合同', '查看状态', '筛选合同', '管理模板'],
    sections: [
      {
        title: '合同资产',
        body: '合同管理用于跟踪客户协议、金额、有效期和状态，帮助团队提前处理续约或到期风险。',
      },
      {
        title: '合同数据为空',
        body: '如果列表为空，确认是否已经上传合同，或当前筛选条件是否过窄。',
      },
    ],
  },
  {
    id: 'analysis',
    title: '数据报表',
    description: '分析招聘漏斗、候选人分布、职位状态和交付效率。',
    icon: 'chart',
    keywords: ['报表', '分析', '漏斗', '数据', '效率'],
    quickActions: ['刷新数据', '查看漏斗', '查看分布', '查看职位概览'],
    sections: [
      {
        title: '看什么',
        body: '优先看交付漏斗和职位招聘概览，它们能反映推荐量、面试转化和岗位推进效率。',
      },
      {
        title: '数据口径',
        body: '报表来自业务记录聚合。若数据异常，先核对候选人、职位和推荐状态是否完整。',
      },
    ],
  },
  {
    id: 'interviews',
    title: '面试管理',
    description: '按周或月查看面试安排，并跟进面试结果。',
    icon: 'calendar',
    keywords: ['面试', '日程', '安排', '候选人'],
    quickActions: ['查看本周', '筛选职位', '筛选状态', '更新结果'],
    sections: [
      {
        title: '查看面试',
        body: '面试管理按时间展示面试安排，可按职位和状态筛选。',
      },
      {
        title: '没有面试数据',
        body: '确认交付看板中是否已有候选人进入面试阶段，以及筛选时间范围是否正确。',
      },
    ],
  },
  {
    id: 'settings',
    title: '系统设置',
    description: '维护个人档案、安全设置、AI 配置、通知和用户权限。',
    icon: 'settings',
    keywords: ['设置', '用户', '权限', 'AI', '通知', '安全'],
    quickActions: ['个人档案', '安全设置', 'AI 配置', '通知设置'],
    sections: [
      {
        title: '权限说明',
        body: '部分设置项仅管理员可见。如果看不到用户管理或系统配置，请确认当前账号角色。',
      },
      {
        title: 'AI 配置',
        body: 'AI 能力依赖模型地址和密钥配置。修改后建议立即做一次简历解析或匹配测试。',
      },
    ],
  },
  {
    id: 'client-portal',
    title: '客户门户',
    description: '客户通过魔法链接登录，查看职位和候选人推荐。',
    icon: 'portal',
    keywords: ['客户门户', '甲方', '登录', '魔法链接'],
    quickActions: ['发送登录链接', '查看推荐', '反馈状态', '退出登录'],
    sections: [
      {
        title: '客户登录',
        body: '客户门户使用邮箱魔法链接登录。客户收到链接后可免密进入门户查看推荐和职位。',
      },
      {
        title: '门户权限',
        body: '客户只能看到与自己企业相关的职位和候选人推荐。',
      },
    ],
  },
  {
    id: 'faq',
    title: '常见问题',
    description: '快速定位登录、数据加载、权限、AI 匹配和空数据等常见排错方向。',
    icon: 'help',
    keywords: ['FAQ', '常见问题', '排错', '登录', '权限', '加载失败'],
    quickActions: ['检查权限', '刷新页面', '查看筛选', '联系管理员'],
    sections: [
      {
        title: '优先排查路径',
        body: '遇到问题时，先确认账号权限和当前筛选条件，再检查网络、服务状态和页面错误提示。',
        steps: ['刷新页面并确认是否仍能复现。', '检查当前账号角色是否具备对应模块权限。', '清空筛选条件或切换时间范围。', '记录页面路径、操作步骤和错误提示。'],
      },
      {
        title: '什么时候联系管理员',
        body: '登录失败、接口持续报错、导入任务卡住、邮箱同步失败或权限不符合预期时，建议把复现信息交给管理员排查。',
      },
    ],
  },
];

export const helpFaqs: HelpFaq[] = [
  {
    question: '无法登录怎么办？',
    answer: '先确认账号、密码或魔法链接是否正确；如果仍失败，联系管理员检查账号状态和后端服务。',
    keywords: ['登录', '账号', '密码', '魔法链接'],
  },
  {
    question: '页面显示数据加载失败怎么办？',
    answer: '刷新页面后仍失败时，检查当前账号权限、网络连接和 API 服务状态。',
    keywords: ['加载失败', '接口', 'API', '网络'],
  },
  {
    question: '为什么报表或看板没有数据？',
    answer: '报表依赖候选人、职位和推荐记录。新环境或筛选条件过窄时可能展示为空。',
    keywords: ['报表', '看板', '为空', '筛选'],
  },
  {
    question: 'AI 匹配结果可以直接发给客户吗？',
    answer: '建议人工复核后再推荐。AI 匹配用于辅助排序和解释，最终推荐仍应结合客户偏好和顾问判断。',
    keywords: ['AI', '匹配', '推荐', '客户'],
  },
];
