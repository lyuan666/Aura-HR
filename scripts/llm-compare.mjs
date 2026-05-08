#!/usr/bin/env node
/**
 * LLM Resume Parsing Comparison
 * Tests: 智谱 glm-4-flash vs DeepSeek chat vs Gemini gemini-2.0-flash
 * Measures: latency, quality (field extraction completeness)
 */
import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const FILES = [
  '/Users/lee/Downloads/【技术经理_杭州 18-26K】华秦 10年以上.pdf',
  '/Users/lee/Downloads/【技术经理_杭州 18-26K】陈春雷 10年以上.pdf',
  '/Users/lee/Downloads/【技术经理_杭州 18-26K】方先生 10年以上.pdf',
];

const PROMPT = (text) => `你是简历信息提取专家。从以下简历文本中提取结构化信息，返回严格 JSON 格式。

要求提取的字段:
- name: 姓名
- gender: 性别 (male/female/unknown)
- phone: 手机号
- email: 邮箱
- age: 年龄 (数字)
- location: 城市
- currentCompany: 当前公司
- currentTitle: 当前职位
- totalYears: 工作年限 (数字)
- degree: 最高学历
- school: 毕业院校
- major: 专业
- workExperiences: 工作经历数组 [{company, title, startDate, endDate, description}]
- projectExperiences: 项目经历数组 [{name, role, description}]
- educationHistory: 教育经历数组 [{school, degree, major, startDate, endDate}]
- skills: 技能标签数组
- summary: 一句话总结

简历文本:
${text.substring(0, 4000)}

返回纯 JSON，不要任何其他文字。`;

const SYSTEM = '你是专业简历信息提取系统。只返回 JSON，不添加任何解释。';

const PROVIDERS = {
  zhipu: {
    name: '智谱 glm-4-flash',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    key: '9f1925f431c44aaab72caf2fd427966f.My5sSrunPXET0jTX',
  },
  deepseek: {
    name: 'DeepSeek chat',
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    key: 'sk-9b7db7ebeca54ec080ccb66db30369f7',
  },
  gemini: {
    name: 'Gemini gemini-2.0-flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    key: 'AIzaSyComzp_Snjq0DuLYOIlZ4agId057oKGNH4',
  },
};

async function extractText(filePath) {
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  return result.text;
}

async function callLLM(provider, text) {
  const start = Date.now();
  const resp = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: PROMPT(text) },
      ],
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${err.substring(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices[0].message.content;
  const latency = Date.now() - start;
  return { content, latency };
}

function extractJson(raw) {
  let cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.substring(start, end + 1);
  return JSON.parse(cleaned);
}

function scoreQuality(obj) {
  const fields = ['name', 'phone', 'email', 'age', 'location', 'currentCompany', 'currentTitle', 'totalYears', 'degree', 'school', 'workExperiences', 'skills', 'summary'];
  let filled = 0;
  for (const f of fields) {
    if (obj[f] !== undefined && obj[f] !== null && obj[f] !== '' && obj[f] !== 'unknown' && !(Array.isArray(obj[f]) && obj[f].length === 0)) {
      filled++;
    }
  }
  return { filled, total: fields.length, pct: Math.round(filled / fields.length * 100) };
}

async function main() {
  console.log('=== LLM Resume Parsing Comparison ===\n');

  // Step 1: Extract text from all PDFs
  console.log('Step 1: Extracting text from PDFs...');
  const texts = [];
  for (const f of FILES) {
    const name = f.split('/').pop().replace('.pdf', '');
    const t0 = Date.now();
    const text = await extractText(f);
    const ms = Date.now() - t0;
    texts.push({ name, text, extractMs: ms });
    console.log(`  ${name}: ${text.length} chars, ${ms}ms`);
  }
  console.log('');

  // Step 2: Test each provider with each file
  const results = [];
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    console.log(`\n--- ${provider.name} ---`);
    for (const { name, text } of texts) {
      try {
        const { content, latency } = await callLLM(provider, text);
        const parsed = extractJson(content);
        const quality = scoreQuality(parsed);
        console.log(`  ${name}: ${latency}ms, quality ${quality.filled}/${quality.total} (${quality.pct}%)`);
        console.log(`    name=${parsed.name}, company=${parsed.currentCompany}, title=${parsed.currentTitle}, years=${parsed.totalYears}`);
        results.push({ provider: provider.name, file: name, latency, quality, parsed });
      } catch (e) {
        console.log(`  ${name}: FAILED - ${e.message}`);
        results.push({ provider: provider.name, file: name, latency: -1, error: e.message });
      }
    }
  }

  // Step 3: Summary table
  console.log('\n\n=== Summary ===');
  console.log('Provider'.padEnd(30) + 'File'.padEnd(20) + 'Latency'.padEnd(12) + 'Quality');
  console.log('-'.repeat(75));
  for (const r of results) {
    if (r.error) {
      console.log(r.provider.padEnd(30) + r.file.padEnd(20) + 'FAILED'.padEnd(12) + r.error.substring(0, 30));
    } else {
      console.log(r.provider.padEnd(30) + r.file.padEnd(20) + `${r.latency}ms`.padEnd(12) + `${r.quality.filled}/${r.quality.total} (${r.quality.pct}%)`);
    }
  }

  // Average by provider
  console.log('\n--- Average by Provider ---');
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    const runs = results.filter(r => r.provider === provider.name && r.latency > 0);
    if (runs.length === 0) continue;
    const avgLatency = Math.round(runs.reduce((s, r) => s + r.latency, 0) / runs.length);
    const avgQuality = Math.round(runs.reduce((s, r) => s + r.quality.pct, 0) / runs.length);
    console.log(`  ${provider.name}: avg ${avgLatency}ms, avg quality ${avgQuality}%`);
  }
}

main().catch(console.error);
