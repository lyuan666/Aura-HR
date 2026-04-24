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
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  App,
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

const { Text } = Typography;
const { Option } = Select;

export default function ContractsPage() {
  const { message: antMessage } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockData = [
    {
      key: '1',
      contractNo: 'HT-2023-1101',
      title: '字节跳动 - 2024年度框架合作协议',
      enterprise: '字节跳动有限公司',
      logo: null,
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
      logo: null,
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
      logo: null,
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
          <div className="w-9 h-9 rounded-[10px] bg-[#007AFF]/[0.08] flex items-center justify-center text-[#007AFF]">
            <FileTextOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div className="font-medium text-[#1D1D1F]">{text}</div>
            <div className="text-[11px] text-[#8E8E93]">编号: {record.contractNo}</div>
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
          <Avatar
            size="small"
            style={!record.logo ? { backgroundColor: '#007AFF', fontSize: 12, fontWeight: 500 } : {}}
          >
            {!record.logo ? text?.[0] : null}
          </Avatar>
          <span className="text-sm text-[#1D1D1F]">{text}</span>
        </Space>
      )
    },
    {
      title: '合同总额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: string) => <Text strong className="text-[#007AFF]">{text}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, string> = {
          '执行中': '#007AFF',
          '待审核': '#FF9500',
          '已完成': '#34C759',
        };
        return (
          <Tag style={{ color: config[status], background: `${config[status]}10`, border: 'none', borderRadius: 8, fontWeight: 500 }}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: '到期日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => (
        <Space className="text-[#8E8E93] text-xs">
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
          <Tooltip title="查看详情"><EyeOutlined className="text-[#8E8E93] hover:text-[#007AFF] cursor-pointer" /></Tooltip>
          <Tooltip title="下载附件"><DownloadOutlined className="text-[#8E8E93] hover:text-[#007AFF] cursor-pointer" /></Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-2 text-[#8E8E93] text-xs mb-1 uppercase tracking-wider font-medium">
            <SafetyCertificateOutlined />
            <span>商务合规管理</span>
          </div>
          <h1 className="text-xl font-semibold m-0 text-[#1D1D1F] tracking-tight">合同协议中心</h1>
        </div>
        <Space size={12}>
          <Input
            prefix={<SearchOutlined style={{ color: '#C7C7CC' }} />}
            placeholder="搜索合同、企业号..."
            className="w-64 rounded-[10px] h-10 bg-[#F2F2F7] border-transparent"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="h-10 rounded-[10px] px-5"
          >
            创建新合同
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={20}>
        <Col span={8}>
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <Statistic
              title={<span className="text-[#8E8E93] text-xs">执行中合同总额</span>}
              value={970000}
              prefix="￥"
              valueStyle={{ color: '#007AFF', fontWeight: 600, fontSize: '24px' }}
            />
            <div className="mt-2 text-[10px] text-[#8E8E93]">当前活跃合同共 5 份</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <Statistic
              title={<span className="text-[#8E8E93] text-xs">待审核项目</span>}
              value={3}
              suffix="份"
              valueStyle={{ color: '#FF9500', fontWeight: 600, fontSize: '24px' }}
            />
            <div className="mt-2 text-[10px] text-[#8E8E93]">最新提交：美团高级人才寻访项目</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="rounded-[20px] border-none shadow-sm bg-white">
            <Statistic
              title={<span className="text-[#8E8E93] text-xs">本月已回款</span>}
              value={128400}
              prefix="￥"
              valueStyle={{ color: '#34C759', fontWeight: 600, fontSize: '24px' }}
            />
            <div className="mt-2 text-[10px] text-[#8E8E93] flex items-center">
              <CheckCircleOutlined className="text-[#34C759] mr-1" />
              回款进度正常
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="rounded-[20px] border-none shadow-sm">
        <Table
          columns={columns}
          dataSource={mockData}
          pagination={false}
        />
      </Card>

      {/* Modal */}
      <Modal
        title="创建新合同"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setIsModalOpen(false)} className="rounded-[10px]">取消</Button>
            <Button type="primary" onClick={() => {
              setIsModalOpen(false);
              antMessage.info('合同创建功能开发中');
            }} className="rounded-[10px]">
              创建
            </Button>
          </Space>
        }
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="合同标题" name="title" rules={[{ required: true, message: '请输入合同标题' }]}>
            <Input placeholder="请输入合同标题" className="rounded-[10px]" />
          </Form.Item>
          <Form.Item label="签约主体" name="enterprise" rules={[{ required: true, message: '请输入签约主体' }]}>
            <Input placeholder="请输入签约主体名称" className="rounded-[10px]" />
          </Form.Item>
          <Form.Item label="合同金额" name="amount">
            <InputNumber prefix="￥" placeholder="请输入合同金额" className="w-full rounded-[10px]" />
          </Form.Item>
          <Form.Item label="到期日期" name="endDate">
            <DatePicker className="w-full rounded-[10px]" placeholder="请选择到期日期" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
