'use client';

import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Card, 
  Typography, 
  Statistic, 
  Row, 
  Col,
  Avatar,
  message,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export default function ContractsPage() {
  const [loading, setLoading] = useState(false);

  const mockData = [
    {
      key: '1',
      contractNo: 'HT-2023-1101',
      title: '字节跳动 - 2024年度框架合作协议',
      enterprise: '字节跳动有限公司',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ByteDance',
      amount: '￥500,000.00',
      status: '执行中',
      endDate: '2024-12-31',
      owner: 'Franklin Jr.',
    },
    {
      key: '2',
      contractNo: 'HT-2023-1105',
      title: '美团 - 高级技术人才寻访服务项目',
      enterprise: '北京三快在线科技有限公司',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Meituan',
      amount: '￥150,000.00',
      status: '待审核',
      endDate: '2024-06-15',
      owner: '李经理',
    },
    {
      key: '3',
      contractNo: 'HT-2023-1099',
      title: '阿里巴巴 - 蚂蚁金服专项招聘协议',
      enterprise: '蚂蚁科技集团股份有限公司',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Alipay',
      amount: '￥320,000.00',
      status: '已完成',
      endDate: '2023-12-01',
      owner: 'Sarah Chen',
    },
  ];

  const columns = [
    { 
      title: '合同信息', 
      dataIndex: 'title', 
      key: 'title',
      render: (text: string, record: any) => (
        <Space size={12}>
           <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
             <FileTextOutlined style={{ fontSize: 18 }} />
           </div>
           <div>
              <div className="font-bold text-gray-800">{text}</div>
              <div className="text-[11px] text-gray-400">编号: {record.contractNo}</div>
           </div>
        </Space>
      )
    },
    { 
      title: '签约主体', 
      dataIndex: 'enterprise', 
      key: 'enterprise',
      render: (text: string, record: any) => (
        <Space>
           <Avatar src={record.logo} size="small" />
           <span className="text-sm">{text}</span>
        </Space>
      )
    },
    { 
      title: '合同总额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (text: string) => <Text strong className="text-blue-600">{text}</Text>
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          '执行中': 'blue',
          '待审核': 'orange',
          '已完成': 'green',
        };
        return <Tag color={colors[status]} className="rounded-md border-none px-2">{status}</Tag>
      }
    },
    { 
      title: '到期日期', 
      dataIndex: 'endDate', 
      key: 'endDate',
      render: (date: string) => (
        <Space className="text-gray-500 text-xs">
           <ClockCircleOutlined />
           {date}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size={16}>
           <Tooltip title="查看详情"><EyeOutlined className="text-gray-400 hover:text-blue-500 cursor-pointer" /></Tooltip>
           <Tooltip title="下载附件"><DownloadOutlined className="text-gray-400 hover:text-blue-500 cursor-pointer" /></Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <div className="flex items-center space-x-2 text-gray-400 text-xs mb-1 uppercase tracking-widest font-bold">
              <SafetyCertificateOutlined />
              <span>商务合规管理</span>
           </div>
           <h1 className="text-3xl font-black m-0 text-gray-900 tracking-tighter">合同协议中心</h1>
        </div>
        <Space size={12}>
          <Input 
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
            placeholder="搜索合同、企业号..." 
            className="w-72 rounded-xl h-10 border-gray-100 bg-white" 
          />
          <Button type="primary" icon={<PlusOutlined />} className="h-10 rounded-xl bg-blue-600 border-none shadow-lg shadow-blue-100 px-6">
            创建新合同
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700">
             <Statistic 
                title={<span className="text-blue-100 text-xs">执行中合同总额</span>} 
                value={970000} 
                prefix="￥"
                valueStyle={{ color: '#fff', fontWeight: 900, fontSize: '24px' }}
             />
             <div className="mt-2 text-[10px] text-blue-200">当前活跃合同共 5 份</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-2xl border-none shadow-sm bg-white">
             <Statistic 
                title={<span className="text-gray-400 text-xs">待审核项目</span>} 
                value={3} 
                suffix="份"
                valueStyle={{ color: '#f59e0b', fontWeight: 900, fontSize: '24px' }}
             />
             <div className="mt-2 text-[10px] text-gray-400 italic">最新提交：美团高级人才寻访项目</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-2xl border-none shadow-sm bg-white">
             <Statistic 
                title={<span className="text-gray-400 text-xs">本月已回款</span>} 
                value={128400} 
                prefix="￥"
                valueStyle={{ color: '#10b981', fontWeight: 900, fontSize: '24px' }}
             />
             <div className="mt-2 text-[10px] text-gray-400 flex items-center">
                <CheckCircleOutlined className="text-green-500 mr-1" />
                回款进度正常
             </div>
          </Card>
        </Col>
      </Row>

      <Card className="rounded-2xl border-gray-100 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={mockData} 
          pagination={false}
          className="mophy-table"
        />
      </Card>
    </div>
  );
}
