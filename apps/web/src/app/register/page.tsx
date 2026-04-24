'use client';

import { Card, Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, TeamOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';

const { Title, Text } = Typography;

interface RegisterValues {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
}

export default function RegisterPage() {
  const { message: apiMessage } = App.useApp();
  const router = useRouter();

  const onFinish = async (values: RegisterValues) => {
    try {
      await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        name: values.name,
        phone: values.phone,
      });

      apiMessage.success({
        content: '注册成功，请登录',
        className: 'rounded-lg',
      });
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || '注册失败，请稍后重试';
      apiMessage.error(msg);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0f172a]">
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
              申请入驻
            </Title>
            <Text className="text-gray-400 block mt-2 text-sm">
              填写信息完成注册，开始使用天选OS
            </Text>
          </div>

          <Form name="register" onFinish={onFinish} size="large" layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入您的姓名' }]}
            >
              <Input
                prefix={<TeamOutlined className="text-gray-400 mr-2" />}
                placeholder="姓名"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入您的邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400 mr-2" />}
                placeholder="邮箱地址"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <Form.Item
              name="phone"
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
                placeholder="手机号（选填）"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请设置密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400 mr-2" />}
                placeholder="设置密码（至少 6 位）"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl hover:border-blue-500 focus:border-blue-500 hover:bg-white/10"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="h-12 bg-blue-600 hover:bg-blue-500 border-none rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
              >
                提 交 注 册
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Text className="text-gray-500 text-xs">
              已有账号？{' '}
              <a href="/login" className="text-blue-400 font-medium hover:underline">返回登录</a>
            </Text>
          </div>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-[0.2em]"
        >
          POWERED BY 天选OS AI ENGINE
        </motion.p>
      </motion.div>
    </div>
  );
}
