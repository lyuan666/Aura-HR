'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Shield, Bell, Database,
  Cpu, Cloud, HardDrive, Key, Globe, Zap, Save, Camera, Mail, Phone, MapPin, Building
} from 'lucide-react';
import { SpotlightCard } from '@/components/v2/SpotlightCard';
import { App, Switch, Input, Button, Avatar, Upload, Divider, Skeleton } from 'antd';
import api from '@/lib/api';

export default function SettingsPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('个人档案');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string; phone?: string; avatar?: string } | null>(null);

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setProfile(res.data);
    }).catch(() => {
      message.error('加载用户信息失败');
    }).finally(() => setLoading(false));
  }, []);

  // 模拟配置状态
  const [config, setConfig] = useState({
    mfa: true,
    auditLog: false,
    apiKey: true,
    glm4: true,
    deepParse: true,
    autoInvite: false,
    wechat: false,
    esign: false,
  });

  const handleToggle = (key: keyof typeof config) => {
    const newValue = !config[key];
    setConfig(prev => ({ ...prev, [key]: newValue }));
    message.success(`${key.toUpperCase()} 配置已${newValue ? '开启' : '关闭'}`);
  };

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success('个人档案已同步至云端');
    }, 1000);
  };

  const navItems = [
    { name: '个人档案', icon: <User size={16} /> },
    { name: '安全设置', icon: <Shield size={16} /> },
    { name: '消息提醒', icon: <Bell size={16} /> },
    { name: 'AI 配置', icon: <Zap size={16} /> },
    { name: '数据存储', icon: <HardDrive size={16} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden pb-6">
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">系统调校 <span className="text-sm font-normal text-[#555762] ml-2">Control Panel</span></h1>
          <div className="text-[11px] text-[#8B8D97] font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
            <Settings size={12} className="animate-spin-slow" /> 全局配置与底层引擎参数优化
          </div>
        </div>
        {activeTab === '个人档案' && (
          <button 
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-[#6C5CE7] hover:bg-[#5a4cdb] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? '正在同步...' : '保存更改'}
          </button>
        )}
      </div>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Left: Sidebar Nav */}
        <div className="w-64 flex flex-col gap-2 shrink-0">
           {navItems.map((nav, i) => (
             <div 
               key={nav.name} 
               onClick={() => setActiveTab(nav.name)}
               className={`flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all border ${activeTab === nav.name ? 'bg-[#6C5CE7]/10 text-[#A29BFE] border-[#6C5CE7]/30 shadow-[inset_0_0_20px_rgba(108,92,231,0.05)]' : 'text-[#555762] border-transparent hover:bg-white/5 hover:text-white'}`}
             >
               {nav.icon}
               <span className="text-[11px] font-black uppercase tracking-widest">{nav.name}</span>
             </div>
           ))}
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
          <AnimatePresence mode="wait">
            {activeTab === '个人档案' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SpotlightCard className="p-8">
                  {loading ? (
                    <Skeleton active avatar paragraph={{ rows: 4 }} />
                  ) : profile ? (
                  <div>
                  <div className="flex items-center gap-8 mb-10">
                    <div className="relative group">
                      <Avatar size={100} className="border-2 border-[#6C5CE7]/30 shadow-2xl" src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'User'}`} />
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white mb-1">{profile.name || '未设置'}</h2>
                      <p className="text-xs text-[#555762] font-bold uppercase tracking-widest">{profile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-[#555762] uppercase tracking-[0.2em] mb-2 block">真实姓名 (Full Name)</label>
                        <Input defaultValue={profile.name || ''} className="bg-[#13161C] border-white/5 text-white h-11 rounded-xl focus:border-[#6C5CE7]/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-[#555762] uppercase tracking-[0.2em] mb-2 block">电子邮箱 (Email)</label>
                        <Input prefix={<Mail size={14} className="text-[#555762] mr-2" />} defaultValue={profile.email || ''} className="bg-[#13161C] border-white/5 text-white h-11 rounded-xl focus:border-[#6C5CE7]/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-[#555762] uppercase tracking-[0.2em] mb-2 block">联系电话 (Phone)</label>
                        <Input prefix={<Phone size={14} className="text-[#555762] mr-2" />} defaultValue={profile.phone || ''} className="bg-[#13161C] border-white/5 text-white h-11 rounded-xl focus:border-[#6C5CE7]/50" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-[#555762] uppercase tracking-[0.2em] mb-2 block">系统语言 (Locale)</label>
                        <select className="w-full bg-[#13161C] border border-white/5 text-white h-11 rounded-xl px-4 text-xs focus:border-[#6C5CE7]/50 outline-none">
                          <option>简体中文 (Chinese)</option>
                          <option>English (US)</option>
                          <option>日本語 (Japanese)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  </div>
                  ) : null}
                </SpotlightCard>
              </motion.div>
            )}

            {activeTab === '安全设置' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {[
                  { id: 'mfa', name: '多重身份验证 (MFA)', desc: '为您的账户增加额外的安全保障层，通过移动端 App 验证登录。', icon: <Shield size={18} /> },
                  { id: 'auditLog', name: '登录审计日志', desc: '记录并审计最近 90 天内所有的 API 请求和控制台登录行为。', icon: <Database size={18} /> },
                  { id: 'apiKey', name: 'API 访问令牌', desc: '允许通过加密令牌访问系统核心接口，用于外部机器人集成。', icon: <Key size={18} /> },
                ].map((item) => (
                  <SpotlightCard key={item.id} className="p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${config[item.id as keyof typeof config] ? 'bg-[#6C5CE7]/10 text-[#A29BFE]' : 'bg-white/5 text-[#555762]'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white group-hover:text-[#A29BFE] transition-colors">{item.name}</div>
                        <div className="text-[10px] text-[#555762] mt-1 font-medium max-w-md">{item.desc}</div>
                      </div>
                    </div>
                    <Switch 
                      checked={config[item.id as keyof typeof config]} 
                      onChange={() => handleToggle(item.id as keyof typeof config)}
                      className={config[item.id as keyof typeof config] ? 'bg-[#6C5CE7]' : ''}
                    />
                  </SpotlightCard>
                ))}
              </motion.div>
            )}

            {activeTab === 'AI 配置' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-[#6C5CE7]/5 border border-[#6C5CE7]/20 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap size={18} className="text-[#A29BFE]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">底层 AI 算力节点已连接</h3>
                  </div>
                  <p className="text-[11px] text-[#8B8D97] leading-relaxed">当前正在使用 GLM-4 视觉解析引擎与专用人才向量空间。您可以动态调整模型权重以优化匹配精度。</p>
                </div>

                {[
                  { id: 'glm4', name: 'GLM-4 增强解析', desc: '开启深度语义理解，自动提取简历中的隐藏技能标签与软素质。', icon: <Cpu size={18} /> },
                  { id: 'deepParse', name: '全链路向量空间映射', desc: '将候选人与职位库进行 1024 维向量匹配，提升 40% 的准确率。', icon: <Database size={18} /> },
                  { id: 'autoInvite', name: '自动邀约话术生成', desc: '根据候选人画像，AI 自动生成定制化的面试邀约内容，提升回复率。', icon: <Mail size={18} /> },
                ].map((item) => (
                  <SpotlightCard key={item.id} className="p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${config[item.id as keyof typeof config] ? 'bg-[#00D2FF]/10 text-[#00D2FF]' : 'bg-white/5 text-[#555762]'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white group-hover:text-[#00D2FF] transition-colors">{item.name}</div>
                        <div className="text-[10px] text-[#555762] mt-1 font-medium max-w-md">{item.desc}</div>
                      </div>
                    </div>
                    <Switch 
                      checked={config[item.id as keyof typeof config]} 
                      onChange={() => handleToggle(item.id as keyof typeof config)}
                      className={config[item.id as keyof typeof config] ? 'bg-[#00D2FF]' : ''}
                    />
                  </SpotlightCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

const Tag = ({ children, color, className }: any) => (
  <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-black uppercase ${className}`}>
    {children}
  </span>
);
