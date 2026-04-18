const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

const candidates = [
  {
    name: '陈静远',
    gender: 'male',
    age: 34,
    location: '北京',
    phone: '13812345678',
    email: 'chen.jy@techcorp.cn',
    currentCompany: '蚂蚁集团',
    currentTitle: '高级架构师',
    totalYears: 11,
    degree: '硕士',
    school: '清华大学',
    major: '计算机科学与技术',
    status: 'active',
    sourcePlatform: 'manual',
    workExperiences: [
      {
        company: '蚂蚁集团',
        position: '高级架构师 (P8)',
        duration: '2019.04 - 至今',
        description: '1. 负责支付宝核心结算系统的云原生架构升级，支持双十一峰值百万 QPS；\n2. 深度参与微服务治理框架设计，解决由于链路过长导致的性能损耗问题。'
      },
      {
        company: '百度',
        position: '资深开发工程师',
        duration: '2015.07 - 2019.03',
        description: '负责搜索推荐引擎的特征工程平台搭建，从零开始构建了分布式实时计算流水线。'
      }
    ],
    projectExperiences: [
      {
        name: 'OceanBase 数据平滑迁移计划',
        role: '核心技术专家',
        duration: '2021.01 - 2022.06',
        technology: ['OceanBase', 'Go', 'K8s', 'Kafka'],
        description: '领导团队完成从传统 Oracle 库向国产分布式数据库的无损迁移。'
      }
    ],
    careerExpectations: {
      city: '北京/杭州',
      salary: '80k-120k',
      role: '技术负责人/CTO',
      industry: '金融科技'
    }
  },
  {
    name: '林悦欣',
    gender: 'female',
    age: 29,
    location: '上海',
    phone: '18600009988',
    email: 'lin.yx@marketing.com',
    currentCompany: '欧莱雅中国',
    currentTitle: '资深市场经理',
    totalYears: 7,
    degree: '本科',
    school: '复旦大学',
    major: '工商管理',
    status: 'active',
    sourcePlatform: 'manual',
    workExperiences: [
      {
        company: '欧莱雅中国',
        position: '资深市场经理',
        duration: '2021.02 - 至今',
        description: '1. 操盘双十一全域营销项目，实现 GMV 同比增长 40%；\n2. 统筹 5000 万年度预算，优化投放转化率 ROI 提升 15%。'
      }
    ],
    careerExpectations: {
      city: '上海',
      salary: '45k-60k',
      role: '市场总监',
      industry: '快消/电商'
    }
  },
  {
    name: '陆家伟',
    gender: 'male',
    age: 31,
    location: '深圳',
    phone: '13766668888',
    email: 'lu.jw@tencent.com',
    currentCompany: '腾讯',
    currentTitle: '高级产品经理',
    totalYears: 8,
    degree: '本科',
    school: '武汉大学',
    major: '软件工程',
    status: 'offered',
    sourcePlatform: 'manual',
    workExperiences: [
      {
        company: '腾讯',
        position: '高级产品经理 (P10)',
        duration: '2018.10 - 至今',
        description: '负责微信支付跨境业务的产品矩阵规划，推动与 12 个国家银行的跨境支付结算打通。'
      }
    ],
    careerExpectations: {
      city: '深圳/香港',
      salary: '60k-80k',
      role: '产品专家',
      industry: '社交/支付'
    }
  },
  {
    name: '周思涵',
    gender: 'female',
    age: 27,
    location: '杭州',
    phone: '13588887777',
    email: 'zhou.sh@alibabacloud.com',
    currentCompany: '阿里云',
    currentTitle: '前端开发专家',
    totalYears: 5,
    degree: '硕士',
    school: '浙江大学',
    major: '人机交互',
    status: 'active',
    sourcePlatform: 'manual',
    workExperiences: [
      {
        company: '阿里云',
        position: '前端专家',
        duration: '2019.06 - 至今',
        description: '负责云控制台可视化引擎的设计与落地，主导了低代码平台的标准协议制定。'
      }
    ],
    careerExpectations: {
      city: '杭州',
      salary: '50k-70k',
      role: '前端架构师',
      industry: '云计算/SaaS'
    }
  }
];

async function seed() {
  console.log('--- 开始注入真实专业人才数据 ---');
  for (const candidate of candidates) {
    try {
      const res = await axios.post(`${API_BASE}/candidates`, candidate);
      console.log(`✅ 录入成功: ${candidate.name} (ID: ${res.data.id})`);
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.warn(`⚠️ 跳过重复数据: ${candidate.name}`);
      } else {
        console.error(`❌ 录入失败: ${candidate.name}`, e.message);
      }
    }
  }
  console.log('--- 注入完成 ---');
}

seed();
