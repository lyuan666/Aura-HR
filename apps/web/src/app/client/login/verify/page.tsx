'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { App, Spin, Typography } from 'antd';
import api from '@/lib/api';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

function VerifyMagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { message } = App.useApp();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError(true);
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth-client/magic-link/login', { token });
        const { access_token, user } = res.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        message.success('登录成功');
        router.replace('/client/dashboard');
      } catch (err) {
        setError(true);
        message.error('链接已失效或无效');
      }
    };

    verify();
  }, [searchParams, router, message]);

  return (
    <div className="text-center">
      {error ? (
        <div className="text-[#FF5252]">
          <div className="text-6xl mb-4">!</div>
          <Text className="text-[#FF5252] text-lg font-bold">登录失败，链接已失效</Text>
          <div className="mt-6">
            <button 
              onClick={() => router.push('/client/login')}
              className="text-[#6C5CE7] hover:underline"
            >
              返回重新申请
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#6C5CE7' }} spin />} />
          <Text className="text-[#555762] uppercase tracking-[0.3em] font-black text-xs">
            正在验证您的身份节点...
          </Text>
        </div>
      )}
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0D11] p-6">
      <Suspense fallback={<Spin />}>
        <VerifyMagicLinkContent />
      </Suspense>
    </div>
  );
}
