import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const DEFAULT_API_BASE_URL = 'http://47.97.62.57/api';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const Popup: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [userLabel, setUserLabel] = useState('');
  const [status, setStatus] = useState('请登录');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['apiBaseUrl', 'accessToken', 'refreshToken', 'tokenSavedAt', 'userLabel'], (stored) => {
      const savedAt = Number(stored.tokenSavedAt || 0);
      const expired = savedAt > 0 && Date.now() - savedAt > TOKEN_MAX_AGE;
      if (expired) {
        chrome.storage.local.remove(['accessToken', 'refreshToken', 'tokenSavedAt', 'userLabel']);
        setStatus('登录已过期');
        return;
      }
      setApiBaseUrl(stored.apiBaseUrl || DEFAULT_API_BASE_URL);
      setAccessToken(stored.accessToken || '');
      setRefreshToken(stored.refreshToken || '');
      setUserLabel(stored.userLabel || '');
      setStatus(stored.accessToken ? '已登录' : '请登录');
    });
  }, []);

  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
  const appBaseUrl = normalizedApiBaseUrl.replace(/\/api\/?$/, '');

  const login = async () => {
    if (!account.trim() || !password) {
      setStatus('请输入账号和密码');
      return;
    }
    setLoading(true);
    setStatus('正在登录...');
    try {
      const res = await fetch(`${normalizedApiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: account.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.accessToken) {
        throw new Error(data.message || '账号或密码错误');
      }
      const nextUserLabel = data.user?.name || data.user?.email || account.trim();
      chrome.storage.local.set(
        {
          apiBaseUrl: normalizedApiBaseUrl,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || '',
          refreshTokenSavedAt: Date.now(),
          tokenSavedAt: Date.now(),
          userLabel: nextUserLabel,
          userRole: data.user?.role || '',
        },
        () => {
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken || '');
          setUserLabel(nextUserLabel);
          setPassword('');
          setStatus('已登录');
        },
      );
    } catch (err: any) {
      setStatus(humanizeLoginError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    chrome.storage.local.remove(['accessToken', 'refreshToken', 'tokenSavedAt', 'refreshTokenSavedAt', 'userLabel', 'userRole'], () => {
      setAccessToken('');
      setRefreshToken('');
      setUserLabel('');
      setStatus('已退出，请重新登录');
    });
  };

  const saveAdvancedSettings = () => {
    chrome.storage.local.set(
      {
        apiBaseUrl: normalizedApiBaseUrl,
        accessToken,
        refreshToken,
        refreshTokenSavedAt: refreshToken ? Date.now() : 0,
        tokenSavedAt: Date.now(),
      },
      () => setStatus(accessToken ? '高级设置已保存' : '请登录'),
    );
  };

  return (
    <div style={{ 
      width: 320, 
      padding: '24px', 
      fontFamily: "'Inter', system-ui, sans-serif",
      background: '#ffffff',
      color: '#1e293b'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ 
          width: 40, height: 40, 
          background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px'
        }}>🎯</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>YZSCHROS</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>AI 猎头智选助手</p>
        </div>
      </div>

      <div style={{ 
        background: '#f8fafc', 
        borderRadius: '16px', 
        padding: '16px',
        border: '1px solid #f1f5f9',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>服务状态</span>
          <span style={{ fontSize: '13px', color: accessToken ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>当前账号</span>
          <span style={{ fontSize: '13px', color: '#1e293b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userLabel || '未登录'}
          </span>
        </div>
      </div>

      <div style={{
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #f1f5f9',
        marginBottom: '20px'
      }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
          系统地址
        </label>
        <input
          value={apiBaseUrl}
          onChange={(event) => setApiBaseUrl(event.target.value)}
          placeholder="http://47.97.62.57/api"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 12,
            fontSize: 12,
          }}
        />
        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
          邮箱 / 手机号
        </label>
        <input
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          autoComplete="username"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 12,
            fontSize: 12,
          }}
        />
        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
          密码
        </label>
        <input
          value={password}
          type="password"
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
          }}
        />
        <button
          onClick={login}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '11px',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? '正在登录...' : accessToken ? '重新登录' : '登录插件账号'}
        </button>
        {accessToken && (
          <button
            onClick={logout}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '9px',
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            退出登录
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowAdvanced((value) => !value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            color: '#64748b',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {showAdvanced ? '收起高级设置' : '高级设置'}
        </button>
        {showAdvanced && (
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #f1f5f9',
            marginTop: 10,
          }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
              手动令牌
            </label>
            <textarea
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value.trim())}
              rows={4}
              placeholder="仅用于开发或排错，普通用户不需要填写"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                resize: 'vertical',
              }}
            />
            <button
              onClick={saveAdvancedSettings}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '10px',
                background: '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              保存高级设置
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={() => window.open(`${appBaseUrl}/candidates`)}
        style={{ 
          width: '100%', 
          padding: '12px', 
          background: '#6366f1', 
          color: 'white', 
          border: 'none', 
          borderRadius: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
      >
        进入人才库管理
      </button>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
          登录信息仅保存在本机 chrome.storage.local，不会同步到其他设备
        </p>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

function normalizeApiBaseUrl(value: string) {
  const trimmed = (value || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function humanizeLoginError(message: string) {
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return '连接失败，请检查系统地址';
  }
  if (/401|账号|密码|Unauthorized/i.test(message)) {
    return '账号或密码错误';
  }
  if (/403|权限|Forbidden/i.test(message)) {
    return '无权限，请联系管理员开通';
  }
  return message || '登录失败，请稍后重试';
}
