chrome.runtime.onInstalled.addListener(() => {
  console.log('猎头智能助手已安装');
});

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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
  const res = await apiFetch('/ai/greeting', {
    method: 'POST',
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
  const parseRes = await apiFetch('/ai/parse-resume', {
    method: 'POST',
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

  const createRes = await apiFetch('/candidates', {
    method: 'POST',
    body: JSON.stringify(createData),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.message || '候选人入库查重未通过');
  }

  return await createRes.json();
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const settings = await getSettings();
  if (!settings.accessToken) {
    throw new Error('请先在插件设置中填写 YZSCHROS Token');
  }

  return fetch(`${settings.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${settings.accessToken}`,
    },
  });
}

async function getSettings(): Promise<{ apiBaseUrl: string; accessToken: string }> {
  const stored = await chrome.storage.local.get(['apiBaseUrl', 'accessToken', 'tokenSavedAt']);
  const savedAt = Number(stored.tokenSavedAt || 0);
  if (savedAt > 0 && Date.now() - savedAt > TOKEN_MAX_AGE) {
    await chrome.storage.local.remove(['accessToken', 'tokenSavedAt']);
    return { apiBaseUrl: stored.apiBaseUrl || DEFAULT_API_BASE_URL, accessToken: '' };
  }
  return {
    apiBaseUrl: stored.apiBaseUrl || DEFAULT_API_BASE_URL,
    accessToken: stored.accessToken || '',
  };
}
