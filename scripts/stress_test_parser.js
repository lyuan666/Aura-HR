const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function stressTest() {
  const url = 'http://localhost:3001/api/candidates/upload';
  const filePath = path.join(__dirname, '../test_resume.txt');
  const concurrency = 5;

  console.log(`Starting stress test with ${concurrency} concurrent uploads...`);
  
  const promises = Array.from({ length: concurrency }).map(async (_, i) => {
    const form = new FormData();
    // 修改 email 以避免数据库冲突
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content
      .replace('zhangsan@example.com', `zhangsan_${i}_${Date.now()}@example.com`)
      .replace('13800138000', `13800138${i}${Math.floor(Math.random() * 90) + 10}`);

    const tempPath = path.join(__dirname, `../test_resume_temp_${i}.txt`);
    fs.writeFileSync(tempPath, newContent);

    form.append('file', fs.createReadStream(tempPath));
    
    const start = Date.now();
    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
      });
      const end = Date.now();
      console.log(`Upload ${i} success: ${res.data.success}, Time: ${(end - start) / 1000}s, ParseTime: ${res.data.data?.notes}`);
    } catch (err) {
      console.error(`Upload ${i} failed: ${err.message}`);
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  });

  await Promise.all(promises);
  console.log('Stress test completed.');
}

stressTest();
