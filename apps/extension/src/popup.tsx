import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const Popup: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [accessToken, setAccessToken] = useState('');
  const [status, setStatus] = useState('未配置');

  useEffect(() => {
    chrome.storage.local.get(['apiBaseUrl', 'accessToken', 'tokenSavedAt'], (stored) => {
      const savedAt = Number(stored.tokenSavedAt || 0);
      const expired = savedAt > 0 && Date.now() - savedAt > TOKEN_MAX_AGE;
      if (expired) {
        chrome.storage.local.remove(['accessToken', 'tokenSavedAt']);
        setStatus('Token 已过期');
        return;
      }
      setApiBaseUrl(stored.apiBaseUrl || DEFAULT_API_BASE_URL);
      setAccessToken(stored.accessToken || '');
      setStatus(stored.accessToken ? '已连接' : '待填写 Token');
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.local.set(
      {
        apiBaseUrl: apiBaseUrl || DEFAULT_API_BASE_URL,
        accessToken,
        tokenSavedAt: Date.now(),
      },
      () => setStatus(accessToken ? '已保存' : '待填写 Token'),
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
          <span style={{ fontSize: '13px', color: '#64748b' }}>当前版本</span>
          <span style={{ fontSize: '13px', color: '#1e293b' }}>v1.0.0</span>
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
          API 地址
        </label>
        <input
          value={apiBaseUrl}
          onChange={(event) => setApiBaseUrl(event.target.value)}
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
          YZSCHROS Token
        </label>
        <textarea
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value.trim())}
          rows={4}
          placeholder="粘贴登录后的访问 Token"
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
          onClick={saveSettings}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '10px',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          保存插件设置
        </button>
      </div>

      <button 
        onClick={() => window.open('http://localhost:3000/candidates')}
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
          Token 保存在本机 chrome.storage.local，不会同步到其他设备
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
