'use client';

import React, { useState, useRef } from 'react';
import { Modal, Tabs, Form, Input, Button, Upload, App, Space, Typography } from 'antd';
import { 
  AudioOutlined, 
  FileTextOutlined, 
  CloudUploadOutlined, 
  RobotOutlined,
  StopOutlined
} from '@ant-design/icons';
import api from '@/lib/api';

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
      message.error('您的浏览器不支持语音识别');
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
      const res = await api.post('/job-positions/parse-text', {
        text: values.description,
      });
      const parsedData = res.data;

      const saveRes = await api.post('/job-positions', {
        title: parsedData.title || '猎头发布职位',
        description: values.description,
        salaryMin: parsedData.salaryMin,
        salaryMax: parsedData.salaryMax,
        skillTags: parsedData.requiredSkills
      });
      const finalData = saveRes.data;
      
      onSuccess(finalData);
      message.success('智能发布成功，职位已入库');
    } catch (e) {
      message.error('智能发布失败，请检查 AI 服务状态');
    } finally {
      setParsing(false);
    }
  };

  const handleFileParse = async () => {
    if (fileList.length === 0) {
      message.warning('请先上传文件');
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
      message.success('文件解析成功');
    } catch (e) {
      message.error('文件解析失败');
    } finally {
      setParsing(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined className="text-blue-500" />
          <span>智能 AI 发布职位</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      centered
      className="mophy-modal"
    >
      <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <Title level={5} className="mt-0 flex items-center">
           💡 智能提示
        </Title>
        <Text type="secondary" className="text-sm text-gray-500">
          您可以直接粘贴 JD、上传原始描述文案或通过录制语音口述需求。AI 会自动提取职位名称、薪资、技能要求及工作职责。
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'text',
            label: <Space><FileTextOutlined />文本输入 / 语音口述</Space>,
            children: (
              <Form form={form} layout="vertical" onFinish={handleTextFinish} className="mt-4">
                <Form.Item name="description" rules={[{ required: true, message: '请输入职位描述' }]}>
                  <TextArea 
                    rows={10} 
                    placeholder="在此贴入原始 JD 文案，或者使用下方语音功能口述需求..." 
                    className="rounded-xl p-4 bg-gray-50 border-none focus:bg-white transition-all"
                  />
                </Form.Item>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <Button 
                      type={isRecording ? 'primary' : 'default'}
                      danger={isRecording}
                      shape="circle" 
                      icon={isRecording ? <StopOutlined /> : <AudioOutlined />} 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording ? 'animate-pulse' : ''}
                    />
                    <Text type="secondary" className="text-xs">
                      {isRecording ? '正在录音并实时转录...' : '点击图标进入语音口述模式'}
                    </Text>
                  </div>
                  <Button type="primary" htmlType="submit" loading={parsing} className="h-10 px-8 rounded-lg bg-blue-600 border-none shadow-md shadow-blue-100">
                    {parsing ? '智能解析中...' : '提交智能解析'}
                  </Button>
                </div>
              </Form>
            )
          },
          {
            key: 'upload',
            label: <Space><CloudUploadOutlined />文件上传</Space>,
            children: (
              <div className="py-8 flex flex-col items-center justify-center">
                <Upload.Dragger 
                  className="w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                  maxCount={1}
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                >
                  <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined className="text-blue-400 text-5xl" />
                  </p>
                  <p className="ant-upload-text text-lg font-medium text-gray-700">将 JD 文件 (PDF/Docx) 拖拽到此处</p>
                  <p className="ant-upload-hint px-12 text-gray-400">
                    支持各种格式的文档描述，AI 将自动从文件中分析并提取结构化职位信息
                  </p>
                </Upload.Dragger>
                <Button 
                  type="primary" 
                  className="mt-8 h-12 px-12 rounded-xl bg-blue-600 border-none shadow-lg shadow-blue-100" 
                  icon={<RobotOutlined />}
                  onClick={handleFileParse}
                  loading={parsing}
                >
                   开始文件智能提取
                </Button>
              </div>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default SmartJobCreationModal;
