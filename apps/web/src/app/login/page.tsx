'use client';

import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';

const { Title, Text } = Typography;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface LoginValues {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const onFinish = async (values: LoginValues) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: values.email,
        password: values.password,
      });

      const { accessToken } = res.data;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
        // 同时写入 cookie 供 middleware 路由守卫使用
        document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        message.success({
          content: '登录成功，欢迎回来！',
          className: 'rounded-lg',
        });
        router.push('/dashboard');
      } else {
        message.error('登录失败：服务器未返回有效令牌');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请检查您的凭据';
      message.error(msg);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* 动态背景装饰 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-[420px] px-4"
      >
        <Card
          className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-[32px] overflow-hidden"
          styles={{ body: { padding: '40px' } }}
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-6"
            >
              <ThunderboltFilled className="text-3xl text-white" />
            </motion.div>

            <Title level={2} className="text-white m-0 font-bold tracking-tight">
              智领未来 · YZSCHROS
            </Title>
            <Text className="text-gray-400 block mt-2 text-sm">
              业务增强型智能猎头操作系统
            </Text>
          </div>

          <Form name="login" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入您的邮箱' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400 mr-2" />}
                placeholder="邮箱地址"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入您的密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400 mr-2" />}
                placeholder="密码"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-6">
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">忘记密码？</a>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="h-12 bg-blue-600 hover:bg-blue-500 border-none rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
              >
                启 动 系 统
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Text className="text-gray-500 text-xs">
              还没有账号？{' '}
              <a href="/register" className="text-blue-400 font-medium hover:underline">立即申请入驻</a>
            </Text>
          </div>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-[0.2em]"
        >
          POWERED BY YZSCHROS AI ENGINE
        </motion.p>
      </motion.div>
    </div>
  );
}
