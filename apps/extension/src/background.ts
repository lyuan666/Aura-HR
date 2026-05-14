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

  if (message.type === 'UPLOAD_ATTACHMENT') {
    handleAttachmentUpload(message.payload)
      .then(res => sendResponse({ success: true, data: res }))
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
  const captureRes = await apiFetch('/import/extension-capture', {
    method: 'POST',
    body: JSON.stringify({
      sourcePlatform: payload.sourcePlatform,
      sourceUrl: payload.url,
      sourceRecordId: payload.sourceRecordId,
      name: payload.name,
      company: payload.company,
      title: payload.title,
      rawText: payload.rawText,
    }),
  });

  if (!captureRes.ok) {
    const err = await captureRes.json();
    throw new Error(err.message || '暂存区写入失败');
  }

  return await captureRes.json();
}

async function handleAttachmentUpload(payload: any) {
  const fileRes = await fetch(payload.fileUrl);
  if (!fileRes.ok) throw new Error('附件下载失败');
  const blob = await fileRes.blob();
  const fileName = payload.fileName || payload.fileUrl.split('/').pop()?.split('?')[0] || 'resume.pdf';
  const formData = new FormData();
  formData.append('sourcePlatform', payload.sourcePlatform);
  formData.append('sourceUrl', payload.url);
  if (payload.sourceRecordId) formData.append('sourceRecordId', payload.sourceRecordId);
  if (payload.name) formData.append('name', payload.name);
  if (payload.company) formData.append('company', payload.company);
  if (payload.title) formData.append('title', payload.title);
  formData.append('resume', blob, fileName);

  const uploadRes = await apiFetch('/import/extension-attachment', {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.message || '附件暂存失败');
  }
  return uploadRes.json();
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const settings = await getSettings();
  if (!settings.accessToken) {
    throw new Error('请先在插件设置中填写 YZSCHROS Token');
  }

  const isFormData = init.body instanceof FormData;
  return fetch(`${settings.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
