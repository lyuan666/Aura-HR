import React from 'react';
import { createRoot } from 'react-dom/client';

const Popup: React.FC = () => {
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
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>运行中</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>当前版本</span>
          <span style={{ fontSize: '13px', color: '#1e293b' }}>v1.0.0</span>
        </div>
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
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>
          在 BOSS 或 猎聘 简历详情页会自动开启抓取
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
