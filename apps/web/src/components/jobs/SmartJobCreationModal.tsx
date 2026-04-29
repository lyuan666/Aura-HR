'use client';

import React, { useState, useRef } from 'react';
import { Modal, Tabs, Form, Input, Button, Upload, App, Space, Typography, Progress } from 'antd';
import { 
  AudioOutlined, 
  FileTextOutlined, 
  CloudUploadOutlined, 
  RobotOutlined,
  StopOutlined,
  ThunderboltOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface SmartJobCreationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: any) => void;
}

const SmartJobCreationModal: React.FC<SmartJobCreationModalProps> = ({ visible, onCancel, onSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const recognitionRef = useRef<any>(null);

  // 语音识别逻辑
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      message.error('当前浏览器环境不支持 AI 语音交互');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const currentDesc = form.getFieldValue('description') || '';
      form.setFieldsValue({ description: currentDesc + transcript });
    };
    recognitionRef.current.onerror = () => setIsRecording(false);
    recognitionRef.current.onend = () => setIsRecording(false);

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTextFinish = async (values: any) => {
    setParsing(true);
    try {
      // 模拟解析过程的视觉延迟
      await new Promise(r => setTimeout(r, 1500));
      const res = await api.post('/job-positions/parse-text', {
        text: values.description,
      });
      const parsedData = res.data;

      const saveRes = await api.post('/job-positions', {
        title: parsedData.title || 'AI 解析职位',
        description: values.description,
        salaryMin: parsedData.salaryMin,
        salaryMax: parsedData.salaryMax,
        skillTags: parsedData.requiredSkills || ['AI', 'Tech']
      });
      
      onSuccess(saveRes.data);
      message.success('AI 节点构建成功，职位已入库');
      form.resetFields();
    } catch (e) {
      message.error('智能解析服务暂不可用');
    } finally {
      setParsing(false);
    }
  };

  const handleFileParse = async () => {
    if (fileList.length === 0) {
      message.warning('请先提供 JD 文档节点');
      return;
    }

    setParsing(true);
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj);

    try {
      const res = await api.post('/job-positions/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess(res.data);
      message.success('文档节点解析完成');
      setFileList([]);
    } catch (e) {
      message.error('文档节点提取失败');
    } finally {
      setParsing(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={null}
      centered
      closeIcon={<div className="bg-white/5 hover:bg-[#FF5252]/20 p-2 rounded-xl transition-all text-[#555762] hover:text-[#FF5252]"><StopOutlined /></div>}
      styles={{
        content: { backgroundColor: '#0B0D11', padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 0 50px rgba(108,92,231,0.1)' },
        body: { padding: 0 }
      }}
      className="v2-dark-modal"
    >
      <div className="flex h-[600px]">
        {/* 左侧：状态指示与引导 */}
        <div className="w-[280px] bg-gradient-to-b from-[#11131A] to-[#0B0D11] p-10 flex flex-col border-r border-white/5 relative overflow-hidden">
           <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#6C5CE7]/5 blur-[100px] rounded-full" />
           <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#A29BFE] mb-8 shadow-inner border border-[#6C5CE7]/20">
                <RobotOutlined className="text-2xl" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 tracking-tighter leading-tight italic">AI 智能需求<br/>提取引擎</h2>
              <p className="text-[11px] text-[#555762] font-medium leading-relaxed mb-10 uppercase tracking-widest">
                通过深度神经网络分析职位描述，自动结构化薪资、技能、职责及核心标签，实现零输入发布。
              </p>
              
              <div className="space-y-6 mt-auto">
                 {[
                   { icon: <ThunderboltOutlined />, label: 'NLP 文本建模', color: '#6C5CE7' },
                   { icon: <AudioOutlined />, label: '实时语音转录', color: '#00D2FF' },
                   { icon: <CloudUploadOutlined />, label: '文档视觉解析', color: '#00E676' }
                 ].map((step, i) => (
                   <div key={i} className="flex items-center gap-3 opacity-60">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px]" style={{ color: step.color }}>{step.icon}</div>
                      <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{step.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 右侧：主交互区 */}
        <div className="flex-1 flex flex-col bg-[#0B0D11] overflow-hidden">
          {/* Tabs - Custom Styled */}
          <div className="flex px-10 pt-10 border-b border-white/5 bg-white/[0.01]">
            {[
              { key: 'text', label: '描述提取', icon: <FileTextOutlined /> },
              { key: 'upload', label: '文档上传', icon: <CloudUploadOutlined /> }
            ].map(tab => (
              <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-4 px-6 text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 transition-all",
                  activeTab === tab.key ? "text-[#6C5CE7] border-[#6C5CE7]" : "text-[#555762] border-transparent hover:text-white/60"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-10 relative">
             <AnimatePresence mode="wait">
               {activeTab === 'text' ? (
                 <motion.div
                   key="text-tab"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                 >
                   <Form form={form} layout="vertical" onFinish={handleTextFinish}>
                      <Form.Item name="description" rules={[{ required: true, message: '请贴入职位描述文案' }]}>
                        <TextArea 
                          rows={12} 
                          placeholder="在此贴入原始 JD 文本，或通过语音录入需求..." 
                          className="!bg-[#11131A] !border-white/5 !rounded-3xl !p-8 !text-white/80 placeholder:!text-[#555762] focus:!border-[#6C5CE7]/30 !transition-all text-xs leading-relaxed"
                        />
                      </Form.Item>
                      
                      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-3xl p-4">
                        <div className="flex items-center gap-4">
                          <button 
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90",
                              isRecording 
                                ? "bg-[#FF5252] text-white animate-pulse shadow-[#FF5252]/20" 
                                : "bg-white/5 text-[#555762] hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {isRecording ? <StopOutlined /> : <AudioOutlined />}
                          </button>
                          <div>
                             <div className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-0.5">
                               {isRecording ? "Listening..." : "Voice Interaction"}
                             </div>
                             <div className="text-[9px] text-[#555762] font-black uppercase tracking-tighter">
                               {isRecording ? "AI 正在实时听取并转录需求描述" : "点击麦克风开启语音需求录入模式"}
                             </div>
                          </div>
                        </div>
                        
                        <button 
                          disabled={parsing}
                          type="submit"
                          className="bg-gradient-to-r from-[#6C5CE7] to-[#8E78FF] text-white px-8 h-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#6C5CE7]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {parsing ? <LoadingOutlined /> : <ThunderboltOutlined />} 智能解析并发布
                        </button>
                      </div>
                   </Form>
                 </motion.div>
               ) : (
                 <motion.div
                   key="upload-tab"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="h-full flex flex-col"
                 >
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01] hover:bg-white/[0.03] transition-all group p-12">
                       <Upload.Dragger 
                         className="v2-dark-dragger"
                         maxCount={1}
                         fileList={fileList}
                         onChange={({ fileList }) => setFileList(fileList)}
                         beforeUpload={() => false}
                       >
                         <div className="py-10">
                            <div className="w-20 h-20 rounded-[30px] bg-white/5 border border-white/5 flex items-center justify-center text-[#555762] group-hover:text-[#6C5CE7] group-hover:border-[#6C5CE7]/30 transition-all mx-auto mb-6 shadow-2xl">
                               <CloudUploadOutlined className="text-3xl" />
                            </div>
                            <div className="text-lg font-black text-white/80 mb-2 uppercase tracking-widest">提供 JD 数据节点</div>
                            <p className="text-[10px] text-[#555762] px-20 uppercase font-black tracking-widest leading-relaxed">
                              支持 PDF, DOCX 格式。AI 会自动识别文字层及视觉布局，提取精准招聘要素。
                            </p>
                         </div>
                       </Upload.Dragger>
                    </div>
                    
                    <button 
                       onClick={handleFileParse}
                       disabled={parsing || fileList.length === 0}
                       className="mt-8 w-full bg-white/5 border border-white/10 hover:bg-[#6C5CE7] text-white/40 hover:text-white h-14 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl hover:shadow-[#6C5CE7]/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
                    >
                       {parsing ? <LoadingOutlined /> : <ThunderboltOutlined className="text-[#6C5CE7] group-hover:text-white" />} 开始智能文档提取
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
             
             {/* Parsing Overlay */}
             <AnimatePresence>
               {parsing && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-[#0B0D11]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-20"
                 >
                    <div className="w-24 h-24 relative mb-8">
                       <div className="absolute inset-0 border-4 border-[#6C5CE7]/20 rounded-full" />
                       <div className="absolute inset-0 border-4 border-t-[#6C5CE7] rounded-full animate-spin shadow-[0_0_15px_#6C5CE7]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <RobotOutlined className="text-3xl text-white animate-pulse" />
                       </div>
                    </div>
                    <div className="text-sm font-black text-white uppercase tracking-[0.4em] mb-4 italic">Neural Parsing...</div>
                    <div className="w-full max-w-[300px]">
                       <Progress 
                        percent={90} 
                        status="active" 
                        showInfo={false} 
                        strokeColor={{ '0%': '#6C5CE7', '100%': '#00D2FF' }} 
                        trailColor="rgba(255,255,255,0.05)"
                       />
                    </div>
                    <p className="text-[10px] text-[#555762] mt-6 font-black uppercase tracking-widest text-center">
                      AI 正在深度理解需求文本语义<br/>构建结构化职位节点数据
                    </p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SmartJobCreationModal;
