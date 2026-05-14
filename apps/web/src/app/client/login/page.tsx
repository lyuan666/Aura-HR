'use client';

import { Alert, Button, Form, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

export default function ClientLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (values: { account: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', values);
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      router.replace(user?.role === 'hr_client' ? '/client/recommendations' : '/dashboard');
    } catch (err) {
      console.error(err);
      setError('登录失败，请检查账号权限或密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
      <section className="w-full max-w-[420px] rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="m-0 text-xl font-bold">客户 HR 登录</h1>
          <p className="m-0 mt-1 text-sm text-slate-500">查看推荐候选人并提交反馈</p>
        </div>
        {error && <Alert className="mb-4" type="error" message={error} showIcon />}
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="account" label="邮箱 / 手机号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </section>
    </main>
  );
}
