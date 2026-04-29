const axios = require('axios');
const fs = require('fs');

async function debugVision(filePath) {
  const apiKey = '9f1925f431c44aaab72caf2fd427966f.My5sSrunPXET0jTX';
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  
  console.log('Sending vision request for:', filePath);
  try {
    const res = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4v-plus',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'hi' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }
        ]
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    console.log('Success:', res.data);
  } catch (e) {
    console.log('Status:', e.response?.status);
    console.log('Data:', JSON.stringify(e.response?.data, null, 2));
  }
}

debugVision('/Users/lee/Downloads/test.pdf');
