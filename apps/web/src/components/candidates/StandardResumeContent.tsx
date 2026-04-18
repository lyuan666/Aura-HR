'use client';

import React from 'react';
import { Typography, Divider, Tag, Space, Timeline, Descriptions, Empty } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  RocketOutlined, 
  ReadOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  MobileOutlined,
  MailOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface CandidateProps {
  candidate: any;
}

const StandardResumeContent: React.FC<CandidateProps> = ({ candidate }) => {
  if (!candidate) return <Empty description="暂无选中人才数据" className="py-20" />;

  // 模拟一些增强数据，如果原始数据缺失
  const workExperiences = candidate.workExperiences || [
    {
      company: candidate.currentCompany || '某科技互联网公司',
      position: candidate.currentJob || '高级职位',
      duration: '2020.06 - 至今',
      description: '1. 负责核心业务系统的架构设计与优化，提升系统稳定性至 99.99%；\n2. 带领 10 人团队完成从 0 到 1 的中台系统搭建；\n3. 通过技术手段降低服务器成本约 30%。'
    },
    {
      company: '前序知名企业',
      position: '中级工程师',
      duration: '2017.03 - 2020.05',
      description: '1. 参与分布式爬虫系统研发，支撑日均千万级数据采集；\n2. 优化数据库索引，核心接口响应速度提升 200%。'
    }
  ];

  const projectExperiences = candidate.projectExperiences || [
    {
      name: '智能招聘中台系统',
      role: '项目架构师 / 负责人',
      duration: '2021.01 - 2022.12',
      technology: ['React', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
      description: '该项目旨在建立全集团统一的招聘流程管理平台。我负责了底层的微服务架构规划，引入了 AI 简历解析引擎，并设计了高并发下的面试预约逻辑。项目上线后，招聘效率提升了 45%。'
    }
  ];

  const educationHistory = candidate.educationHistory || [
    {
      school: candidate.education === '硕士' ? '某著名 985 高校' : '某重点本科院校',
      major: '计算机科学与技术',
      degree: candidate.education || '本科',
      duration: '2013 - 2017'
    }
  ];

  const careerExpectations = candidate.careerExpectations || {
    city: candidate.city || '上海/北京',
    salary: candidate.salary || '30k - 50k',
    role: candidate.currentJob || '架构师/资深开发',
    industry: '互联网/金融科技'
  };

  return (
    <div className="bg-white p-12 max-w-5xl mx-auto shadow-sm min-h-screen">
      {/* 简历排版优化：更专业的左右布局 */}
      <div className="flex justify-between items-end mb-12 pb-8 border-b border-gray-100">
        <div>
          <Title level={1} className="m-0 mb-4 tracking-tighter text-gray-900">{candidate.name}</Title>
          <div className="flex flex-wrap gap-y-3 gap-x-8 text-gray-500 font-medium">
            <span className="flex items-center"><UserOutlined className="mr-2 text-blue-500" />{candidate.gender} · {candidate.age}岁 · {candidate.education}</span>
            <span className="flex items-center"><EnvironmentOutlined className="mr-2 text-blue-500" />{candidate.city}</span>
            <span className="flex items-center"><SafetyCertificateOutlined className="mr-2 text-blue-500" />{candidate.experienceYears}年工作年限</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end space-y-2">
           <Text className="text-gray-600 flex items-center"><MobileOutlined className="mr-2" />{candidate.phone}</Text>
           <Text className="text-gray-600 flex items-center"><MailOutlined className="mr-2" />{candidate.email}</Text>
        </div>
      </div>

      <section className="mb-12">
        <Title level={4} className="flex items-center mb-6 ml-[-4px]">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3" />
          求职意向
        </Title>
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
          <Descriptions column={2} size="middle" colon={false}>
            <Descriptions.Item label={<Text className="text-gray-400 font-normal">期望城市</Text>}>
              <Text className="font-bold">{careerExpectations.city}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Text className="text-gray-400 font-normal">期望年薪</Text>}>
              <Text className="font-bold text-orange-500">{careerExpectations.salary}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Text className="text-gray-400 font-normal">目标职位</Text>}>
              <Text className="font-bold">{careerExpectations.role}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Text className="text-gray-400 font-normal">目标行业</Text>}>
              <Text className="font-bold">{careerExpectations.industry}</Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </section>

      <section className="mb-12">
        <Title level={4} className="flex items-center mb-6 ml-[-4px]">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3" />
          工作历程
        </Title>
        <Timeline 
          mode="left"
          className="resume-timeline mt-8 ml-4"
          items={workExperiences.map((exp: any, index: number) => ({
            dot: <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />,
            label: <Text className="text-gray-400 font-mono text-xs">{exp.duration}</Text>,
            children: (
              <div key={index} className="pl-6 pb-12">
                <div className="flex justify-between items-center mb-3">
                  <Text className="text-lg font-black text-gray-800">{exp.company}</Text>
                  <Tag className="m-0 border-none bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full">{exp.position}</Tag>
                </div>
                <Paragraph className="text-gray-600 text-sm whitespace-pre-line leading-loose">
                  {exp.description}
                </Paragraph>
              </div>
            )
          }))}
        />
      </section>

      <section className="mb-12">
        <Title level={4} className="flex items-center mb-8 ml-[-4px]">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3" />
          核心项目
        </Title>
        <div className="space-y-8">
          {projectExperiences.map((proj: any, index: number) => (
            <div key={index} className="relative pl-8 border-l-2 border-gray-100 group hover:border-blue-400 transition-colors">
              <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-gray-200 group-hover:bg-blue-500 transition-colors" />
              <div className="flex justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">{proj.name}</Text>
                <div className="flex items-center space-x-2">
                  <Text className="text-xs text-gray-400">{proj.role}</Text>
                  <Divider type="vertical" />
                  <Text className="text-xs text-gray-400 font-mono">{proj.duration}</Text>
                </div>
              </div>
              {proj.technology && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {proj.technology.map((tech: string) => (
                    <Tag key={tech} className="m-0 border-none bg-blue-50/50 text-blue-500 text-[10px] px-2 py-0.5 rounded-md font-medium">{tech}</Tag>
                  ))}
                </div>
              )}
              <Paragraph className="text-gray-500 text-sm leading-relaxed m-0 bg-gray-50/50 p-4 rounded-xl border border-gray-100/30">
                {proj.description}
              </Paragraph>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Title level={4} className="flex items-center mb-8 ml-[-4px]">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3" />
          教育成就
        </Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {educationHistory.map((edu: any, index: number) => (
            <div key={index} className="flex items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mr-5 shrink-0">
                <ReadOutlined className="text-blue-500 text-xl" />
              </div>
              <div>
                <Text className="block text-gray-800 font-black text-base mb-1">{edu.school}</Text>
                <Text className="text-gray-400 text-sm">{edu.major} · {edu.degree}</Text>
                <Text className="block text-[10px] text-gray-300 font-mono mt-1">{edu.duration}</Text>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {candidate.remark && (
        <section className="mt-16">
          <div className="p-6 bg-orange-50/30 border-l-4 border-orange-400 rounded-r-2xl">
            <Title level={5} className="m-0 mb-2 text-orange-600">人才备注</Title>
            <Paragraph className="text-gray-600 italic m-0 text-sm leading-relaxed">
              "{candidate.remark}"
            </Paragraph>
          </div>
        </section>
      )}
      
      <div className="mt-20 text-center opacity-20 pointer-events-none">
        <Text disabled className="text-[10px] uppercase tracking-[1em]">YZS Intelligence System</Text>
      </div>
    </div>
  );
};

const TrophyOutlined = (props: any) => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="64 64 896 896" {...props}>
    <path d="M899.6 148H742.4c-9.1-39.6-26.4-74.9-50.5-104.1-3.2-3.9-8-6.1-13-6.1H345.1c-5 0-9.8 2.2-13 6.1-24.1 29.2-41.4 64.5-50.5 104.1H124.4c-17.7 0-32 14.3-32 32v154.5c0 85.4 56.6 158.4 135.2 181.7 20 62.1 57.5 116.3 106.3 155.6 24 19.3 50.8 35.1 79.9 46.3V820H320c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h416c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32H610.1v-103.9c29.1-11.2 55.9-27 79.9-46.3 48.8-39.3 86.3-93.5 106.3-155.6 78.6-23.3 135.2-96.3 135.2-181.7V180c0-17.7-14.3-32-32-32zM227.6 447.4C180.1 433 145.6 389.2 145.6 337.5V191.6h82v255.8zm382.5 158c-30.8 24.8-69.6 38.6-110.1 38.6s-79.3-13.8-110.1-38.6c-46-37-77.9-90.4-89.8-151.3V94.1h399.8v319.4c-11.9 60.9-43.8 114.3-89.8 151.3zM878.4 337.5c0 51.7-34.5 95.5-82 109.9V191.6h82v145.9z"></path>
  </svg>
);

export default StandardResumeContent;
