chrome.runtime.onInstalled.addListener(() => {
  console.log('猎头智能助手已安装');
});

const API_BASE = 'http://localhost:3001/api';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROCESS_RESUME') {
    handleResumeUpload(message.payload)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, message: err.message }));
    return true; // 保持异步
  }
  
  if (message.type === 'GENERATE_GREETING') {
    handleAiGreeting(message.payload)
      .then(res => sendResponse({ success: true, greeting: res }))
      .catch(err => sendResponse({ success: false, message: err.message }));
    return true;
  }
});

async function handleAiGreeting(payload: any) {
  const res = await fetch(`${API_BASE}/ai/greeting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: payload.resumeText,
      job: { title: payload.jobTitle }
    }),
  });
  
  if (!res.ok) throw new Error('生成邀约语失败');
  return await res.text();
}

async function handleResumeUpload(payload: any) {
  // 1. 调用 AI 进行解析
  const parseRes = await fetch(`${API_BASE}/ai/parse-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: payload.rawText }), // 修正为后端期待的 'text' 字段
  });
  
  if (!parseRes.ok) throw new Error('AI 解析失败');
  const parsedData = await parseRes.json();

  // 2. 将解析数据和提取的结构整合入库
  const createData = {
    name: payload.name,
    sourcePlatform: payload.sourcePlatform,
    currentCompany: parsedData.currentCompany || payload.company || '',
    currentTitle: parsedData.currentTitle || payload.title || '',
    resumeText: payload.rawText, // 传递原始内容便于搜索
    parsedTags: parsedData,
  };

  const createRes = await fetch(`${API_BASE}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createData),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.message || '候选人入库查重未通过');
  }

  return await createRes.json();
}
