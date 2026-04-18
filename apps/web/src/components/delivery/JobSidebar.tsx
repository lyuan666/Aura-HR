'use client';

import React from 'react';
import { Typography, Badge, Space, Input, List } from 'antd';
import { SearchOutlined, FolderOpenOutlined, FireOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface Job {
  id: string;
  title: string;
  count: number;
  status: 'active' | 'closed';
}

interface JobSidebarProps {
  jobs: Job[];
  selectedJobId: string;
  onSelect: (id: string) => void;
}

const JobSidebar: React.FC<JobSidebarProps> = ({ jobs, selectedJobId, onSelect }) => {
  return (
    <div className="w-72 h-full bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-50">
        <Title level={4} className="m-0 mb-4 font-bold text-gray-800">交付职位</Title>
        <Input 
          prefix={<SearchOutlined className="text-gray-400" />} 
          placeholder="搜索职位..." 
          className="rounded-lg bg-gray-50 border-none h-10"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <div className="px-6 mb-4">
           <Text className="text-gray-400 text-xs uppercase tracking-wider font-medium">活跃职位</Text>
        </div>
        
        <List
          dataSource={jobs}
          renderItem={(item) => (
            <div 
              onClick={() => onSelect(item.id)}
              className={`px-6 py-4 cursor-pointer transition-all flex items-center justify-between group
                ${selectedJobId === item.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <Text 
                  strong={selectedJobId === item.id}
                  className={`text-sm truncate ${selectedJobId === item.id ? 'text-blue-600' : 'text-gray-700'}`}
                >
                  {item.title}
                </Text>
                <div className="flex items-center mt-1">
                  <Badge status={item.status === 'active' ? 'success' : 'default'} />
                  <Text type="secondary" className="text-[11px] ml-1">
                    {item.status === 'active' ? '招募中' : '已结束'}
                  </Text>
                </div>
              </div>
              <Badge 
                count={item.count} 
                className="site-badge-count-4"
                style={{ 
                  backgroundColor: selectedJobId === item.id ? '#1890ff' : '#f0f2f5', 
                  color: selectedJobId === item.id ? '#fff' : '#8c8c8c',
                  boxShadow: 'none'
                }} 
              />
            </div>
          )}
        />
      </div>

      <div className="p-6 bg-gray-50/50 mt-auto border-t border-gray-100">
        <div className="flex items-center space-x-3 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">
          <FolderOpenOutlined />
          <Text className="text-sm">存档职位交付</Text>
        </div>
      </div>
    </div>
  );
};

export default JobSidebar;
