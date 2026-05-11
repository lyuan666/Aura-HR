'use client';

import React, { useState } from 'react';
import { Form, Input, Button, App, Card, Typography, Space } from 'antd';
import { MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export default function ClientLoginPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await api.post('/auth-client/magic-link/request', { email: values.email });
      message.success('登录链接已发送至您的邮箱/飞书');
      setSent(true);
    } catch (error) {
      message.error('请求失败，请检查邮箱是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-b from-[#11131A] to-[#0B0D11]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
          <div className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#A29BFE] shadow-inner border border-[#6C5CE7]/20">
                <ThunderboltOutlined className="text-3xl" />
              </div>
            </div>
            
            <div className="text-center mb-10">
              <Title level={2} className="!text-white !mb-2 !font-black tracking-tight italic">
                天选 OS · 甲方门户
              </Title>
              <Text className="text-[#555762] uppercase tracking-[0.2em] font-black text-[10px]">
                智能招聘协同系统 · 客户登录
              </Text>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-[#00E676] text-4xl mb-4">✓</div>
                <Title level={4} className="!text-white mb-2">链接已发送</Title>
                <Text className="text-[#555762]">请检查您的邮箱或飞书工作通知，点击链接即可免密登录。</Text>
                <Button 
                  type="link" 
                  onClick={() => setSent(false)} 
                  className="mt-6 text-[#6C5CE7]"
                >
                  更换邮箱重新发送
                </Button>
              </div>
            ) : (
              <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-[#555762]" />} 
                    placeholder="您的工作邮箱" 
                    size="large"
                    className="h-14 !bg-[#11131A] !border-white/5 !rounded-2xl !text-white/80"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="h-14 mt-4 bg-gradient-to-r from-[#6C5CE7] to-[#8E78FF] border-none rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-[#6C5CE7]/20"
                >
                  发送登录链接
                </Button>
              </Form>
            )}
          </div>
        </Card>
        
        <div className="mt-8 text-center">
          <Text className="text-[#555762] text-[10px] uppercase tracking-widest font-bold">
            Powered by Antigravity AI Engine
          </Text>
        </div>
      </motion.div>
    </div>
  );
}
