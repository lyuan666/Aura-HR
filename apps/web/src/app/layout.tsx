import type { Metadata } from 'next';
import '@ant-design/v5-patch-for-react-19';
import './globals.css';
import AntdProvider from '@/components/AntdProvider';

export const metadata: Metadata = {
  title: '猎头智能系统 - 业务增强型智能猎头操作系统',
  description: '面向猎头公司的全流程智能化管理平台，整合客户开发、人才交付、智能匹配和企业协作',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
