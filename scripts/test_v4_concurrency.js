const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 模拟全局并发控制器
class Semaphore {
  constructor(count) {
    this.tasks = [];
    this.count = count;
  }
  async acquire() {
    if (this.count > 0) {
      this.count--;
      return;
    }
    return new Promise(resolve => this.tasks.push(resolve));
  }
  release() {
    if (this.tasks.length > 0) {
      const next = this.tasks.shift();
      next();
    } else {
      this.count++;
    }
  }
}

const semaphore = new Semaphore(1); // 严格限制并发为 1

async function callAiWithSemaphore(name, apiKey) {
  console.log(`[${name}] 正在排队等待信号量...`);
  await semaphore.acquire();
  console.log(`[${name}] 已获取信号量，开始调用 API...`);
  
  const startTime = Date.now();
  try {
    const res = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: 'hi' }]
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    console.log(`[${name}] API 调用成功，耗时: ${Date.now() - startTime}ms`);
  } catch (e) {
    console.error(`[${name}] API 调用失败: ${e.response?.status || e.message}`);
  } finally {
    semaphore.release();
    console.log(`[${name}] 释放信号量。`);
  }
}

async function runTest() {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    console.error('请设置 ZHIPU_API_KEY 环境变量');
    return;
  }

  console.log('--- 开始并发压力测试 (Semaphore 控制) ---');
  // 同时发起 5 个并发请求
  const promises = ['T1', 'T2', 'T3', 'T4', 'T5'].map(name => callAiWithSemaphore(name, apiKey));
  await Promise.all(promises);
  console.log('--- 测试结束 ---');
}

runTest();
