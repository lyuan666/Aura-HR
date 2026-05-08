'use client';

import React, { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate randomized properties for particles to ensure variety
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: `${Math.random() * 2 + 1}px`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 10 + 10}s`,
      drift: `${Math.random() * 100 - 50}px`,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  const stars = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 50}%`,
      delay: `${Math.random() * 20}s`,
    }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { account, password });
      const { accessToken, refreshToken } = res.data;

      if (accessToken) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
        router.replace('/dashboard');
      } else {
        setError('登录失败：服务器未返回有效令牌');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查您的凭据');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-universe">
      {/* Background layers */}
      <div className="login-grid" />
      <div className="login-ribbon login-ribbon--top" />
      <div className="login-ribbon login-ribbon--bottom" />
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />

      {/* Rich Particle System */}
      <div className="login-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="login-particle"
            style={{
              '--size': p.size,
              '--left': p.left,
              '--delay': p.delay,
              '--duration': p.duration,
              '--drift': p.drift,
              '--opacity': p.opacity,
            } as React.CSSProperties}
          />
        ))}
        {stars.map((s) => (
          <div
            key={s.id}
            className="login-star"
            style={{
              '--top': s.top,
              '--left': s.left,
              '--delay': s.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Panel wrapper */}
      <div className="login-panel-wrapper">
        <div className="login-logo-float">
          <div className="login-logo-ring">
            <Image
              src="/logo-tx-v2.png"
              alt="天选OS"
              width={92}
              height={92}
              priority
            />
          </div>
        </div>

        <form className="login-glass-panel" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-brand-area">
            <h1 className="login-brand-title">天选OS</h1>
            <div className="login-brand-en">TIANXUAN OS</div>
            <div className="login-brand-sub">猎头管理系统</div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field-group">
            <div className="login-field">
              <input
                type="text"
                placeholder="邮箱 / 手机号"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                autoComplete="username"
              />
              <span className="login-field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              {account && (
                <button type="button" className="login-field-action" onClick={() => setAccount('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <div className="login-field-glow" />
            </div>

            <div className="login-field">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <span className="login-field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <button type="button" className="login-field-action" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              <div className="login-field-glow" />
            </div>
          </div>

          <div className="login-forgot">
            <a href="#">忘记密码？</a>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading && <span className="login-spinner" />}
            {loading ? '正在载入...' : '登 录'}
          </button>
        </form>

        <div className="login-external-footer">
          还没有账号？ <a href="/register">立即申请入驻</a>
        </div>
      </div>

      <div className="login-version">v2.1.0 · YZSCHROS ENGINE</div>
    </div>
  );
}
