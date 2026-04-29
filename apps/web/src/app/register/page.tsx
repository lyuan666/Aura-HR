'use client';

import { ProForm, ProFormText } from '@ant-design/pro-components';
import { LockOutlined, UserOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import { App, Card } from 'antd';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';

export default function RegisterPage() {
  const { message: apiMessage } = App.useApp();
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    try {
      await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        name: values.name,
        phone: values.phone,
      });

      apiMessage.success('注册成功，请登录');
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || '注册失败，请稍后重试';
      apiMessage.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card
        style={{ width: 420, borderRadius: 12 }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Image src="/logo-tx-v2.png" alt="天选OS" width={40} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>申请入驻</h2>
          <p style={{ color: '#999', marginTop: 8 }}>填写信息完成注册，开始使用天选OS</p>
        </div>

        <ProForm
          onFinish={handleSubmit}
          submitter={{
            searchConfig: { submitText: '提交注册' },
            resetButtonProps: false,
            submitButtonProps: {
              size: 'large',
              style: { width: '100%', height: 44 },
            },
          }}
        >
          <ProFormText
            name="name"
            fieldProps={{ size: 'large', prefix: <TeamOutlined /> }}
            placeholder="姓名"
            rules={[{ required: true, message: '请输入您的姓名' }]}
          />
          <ProFormText
            name="email"
            fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
            placeholder="邮箱地址"
            rules={[
              { required: true, message: '请输入您的邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          />
          <ProFormText
            name="phone"
            fieldProps={{ size: 'large', prefix: <PhoneOutlined /> }}
            placeholder="手机号（选填）"
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            placeholder="设置密码（至少 6 位）"
            rules={[
              { required: true, message: '请设置密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          />
        </ProForm>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: '#999', fontSize: 13 }}>
            已有账号？{' '}
            <a href="/login" style={{ fontWeight: 500 }}>返回登录</a>
          </span>
        </div>
      </Card>
    </div>
  );
}
