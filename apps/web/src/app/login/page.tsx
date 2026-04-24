'use client';

import { Card, Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface LoginValues {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { message: apiMessage } = App.useApp();
  const router = useRouter();

  const onFinish = async (values: LoginValues) => {
    try {
      const res = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      const { accessToken, refreshToken } = res.data;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
        apiMessage.success({
          content: '登录成功，欢迎回来！',
          className: 'rounded-lg',
        });
        setTimeout(() => router.replace('/dashboard'), 100);
      } else {
        apiMessage.error('登录失败：服务器未返回有效令牌');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请检查您的凭据';
      apiMessage.error(msg);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#1D1D1F]">
      {/* Minimal Apple-style ambient light */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#007AFF]/[0.04] rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#007AFF]/[0.03] rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="z-10 w-full max-w-[400px] px-4"
      >
        <Card
          className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[20px]"
          styles={{ body: { padding: '36px 32px' } }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-[12px] mb-5 overflow-hidden shadow-xl shadow-indigo-500/10"
            >
              <img src="/logo.png" alt="天选OS" className="w-full h-full object-cover" />
            </motion.div>

            <Title level={3} className="text-white m-0 font-bold tracking-tight text-xl">
              天选OS
            </Title>
            <Text className="text-[#8E8E93] block mt-1.5 text-[13px]">
              业务增强型智能操作系统
            </Text>
          </div>

          <Form name="login" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入您的邮箱' }]}
            >
              <Input
                prefix={<UserOutlined className="text-[#8E8E93] mr-2" />}
                placeholder="邮箱地址"
                className="h-11 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-[#8E8E93] rounded-[10px] hover:border-white/[0.2] focus:border-[#007AFF] hover:bg-white/[0.08]"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入您的密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-[#8E8E93] mr-2" />}
                placeholder="密码"
                className="h-11 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-[#8E8E93] rounded-[10px] hover:border-white/[0.2] focus:border-[#007AFF] hover:bg-white/[0.08]"
              />
            </Form.Item>

            <div className="flex justify-end items-center mb-5">
              <a href="#" className="text-xs text-[#007AFF] hover:text-[#007AFF]/80 transition-colors">忘记密码？</a>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="h-11 bg-[#007AFF] hover:bg-[#007AFF]/85 border-none rounded-[10px] font-medium text-[15px] active:scale-[0.98] transition-all"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <Text className="text-[#8E8E93] text-xs">
              还没有账号？{' '}
              <a href="/register" className="text-[#007AFF] font-medium hover:underline">立即申请入驻</a>
            </Text>
          </div>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[#48484A] text-[10px] mt-6 tracking-[0.15em] uppercase"
        >
          Powered by 天选OS
        </motion.p>
      </motion.div>
    </div>
  );
}
