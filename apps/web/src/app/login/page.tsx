'use client';

import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, message } from 'antd';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';

export default function LoginPage() {
  const { message: apiMessage } = App.useApp();
  const router = useRouter();

  const handleSubmit = async (values: any) => {
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
        apiMessage.success('登录成功，欢迎回来！');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <LoginForm
        title="天选OS"
        subTitle="业务增强型智能操作系统"
        logo={<Image src="/logo-tx-v2.png" alt="天选OS" width={44} height={44} style={{ objectFit: 'contain' }} />}
        onFinish={handleSubmit}
        actions={
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ color: '#999', fontSize: 13 }}>
              还没有账号？{' '}
              <a href="/register" style={{ fontWeight: 500 }}>立即申请入驻</a>
            </span>
          </div>
        }
      >
        <ProFormText
          name="email"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined />,
          }}
          placeholder="邮箱地址"
          rules={[{ required: true, message: '请输入您的邮箱' }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder="密码"
          rules={[{ required: true, message: '请输入您的密码' }]}
        />
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <a style={{ fontSize: 13 }}>忘记密码？</a>
        </div>
      </LoginForm>
    </div>
  );
}
