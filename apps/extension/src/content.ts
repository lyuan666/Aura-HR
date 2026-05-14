import '../public/content.css';

console.log('🎯 YZSCHROS 智能助手已激活');

interface ExtractedData {
  name: string;
  sourcePlatform: string;
  url: string;
  rawText: string;
  company?: string;
  title?: string;
}

function detectPlatform(): string | null {
  const hostname = window.location.hostname;
  if (hostname.includes('zhipin.com')) return 'boss_zhipin';
  if (hostname.includes('liepin.com')) return 'liepin';
  return null;
}

const platform = detectPlatform();

function extractResumeData(): ExtractedData {
  const data: any = { sourcePlatform: platform, url: window.location.href };

  if (platform === 'boss_zhipin') {
    data.name = document.querySelector('.name')?.textContent?.trim() || '未名人才';
    data.title = document.querySelector('.job-title')?.textContent?.trim();
    data.company = document.querySelector('.company-name')?.textContent?.trim();
    data.rawText = document.body.innerText.substring(0, 8000);
  } else if (platform === 'liepin') {
    data.name = document.querySelector('.name-text')?.textContent?.trim() || '未名人才';
    data.rawText = document.body.innerText.substring(0, 8000);
  }

  // Fallback for demo
  if (!data.name || data.name === '未名人才') {
    data.name = document.title.split('-')[0].trim() || '候选人';
  }
  
  return data;
}

function injectFloatingPanel() {
  if (document.getElementById('yzschros-ext-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'yzschros-ext-panel';
  panel.innerHTML = `
    <div class="yzschros-panel-header">
      <span>🎯 猎头 AI 助手</span>
      <span style="font-size: 10px; opacity: 0.8">v1.0</span>
    </div>
    <div class="yzschros-panel-body">
      <div class="yzschros-status-badge">
        检测到 ${platform === 'boss_zhipin' ? 'BOSS直聘' : '猎聘号'} 简历
      </div>
      <p style="margin-bottom: 20px;">系统已就绪，可将当前页面内容送入数据导入暂存区。</p>
      
      <button id="yzschros-btn-extract" class="yzschros-btn">
        <span>✨ 暂存候选人</span>
      </button>
      
      <div id="yzschros-result" style="display: none;"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const btnExtract = document.getElementById('yzschros-btn-extract') as HTMLButtonElement;
  const resultDiv = document.getElementById('yzschros-result') as HTMLDivElement;

  btnExtract.addEventListener('click', async () => {
    btnExtract.disabled = true;
    btnExtract.innerHTML = '<span>⏳ 正在写入暂存区...</span>';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>正在保存页面文本和来源证据...</p>';
    
    const resumeData = extractResumeData();
    
    chrome.runtime.sendMessage({ type: 'PROCESS_RESUME', payload: resumeData }, (response) => {
      if (response && response.success) {
        const row = response.data || {};
        const decisionLabel = row.importDecision === 'candidate'
          ? '可入库'
          : row.importDecision === 'reject'
            ? '拒绝'
            : row.matchedCandidateId
              ? '重复'
              : '待复核';
        resultDiv.innerHTML = `
          <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✅ 已进入数据导入暂存区</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.8;">
            <div>质量评分: ${row.qualityScore ?? 0}</div>
            <div>处理状态: ${row.createdCandidateId ? '已成功入库' : decisionLabel}</div>
          </div>
          <div class="yzschros-tag-list">
            ${(row.qualityReasons || []).map((t: string) => `<span class="yzschros-tag">${t}</span>`).join('')}
          </div>
          <button id="yzschros-btn-greeting" class="yzschros-btn yzschros-btn-secondary">
            🪄 生成 AI 邀约语
          </button>
          <div id="yzschros-greeting-result"></div>
        `;
        
        btnExtract.style.display = 'none';

        // 绑定邀约语生成
        document.getElementById('yzschros-btn-greeting')?.addEventListener('click', async () => {
          const greetBtn = document.getElementById('yzschros-btn-greeting') as HTMLButtonElement;
          const greetResult = document.getElementById('yzschros-greeting-result') as HTMLDivElement;
          
          greetBtn.disabled = true;
          greetBtn.innerText = '⏳ 正在构建个性化话术...';
          
          chrome.runtime.sendMessage({ 
            type: 'GENERATE_GREETING', 
            payload: { 
              resumeText: resumeData.rawText,
              jobTitle: resumeData.title || '适合您的职位'
            } 
          }, (greetRes) => {
            if (greetRes && greetRes.success) {
              greetResult.innerHTML = `
                <div class="yzschros-greeting-box">
                  <div class="yzschros-copy-tag" onclick="navigator.clipboard.writeText(this.parentElement.innerText)">复制</div>
                  ${greetRes.greeting}
                </div>
              `;
              greetBtn.innerText = '🔄 重新生成';
              greetBtn.disabled = false;
            } else {
              greetResult.innerHTML = `<p style="color: #ef4444">生成失败: ${greetRes.message}</p>`;
              greetBtn.disabled = false;
            }
          });
        });

      } else {
        resultDiv.innerHTML = `<p style="color: #ef4444">❌ 录入失败: ${response?.message || '未知错误'}</p>`;
        btnExtract.disabled = false;
        btnExtract.innerHTML = '<span>✨ 重试暂存</span>';
      }
    });
  });
}

if (platform) {
  setTimeout(injectFloatingPanel, 1000); // 延迟确保护理加载
}
