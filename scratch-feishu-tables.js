const axios = require('axios');

async function testFeishu() {
  const token = 'pt-ihnyHkNtWm8gSOPz2yjDeLvSrupfsAC5adAZ12meAQAAxwsA5LvLRO_xY1UB';
  const url = 'https://open.feishu.cn/open-apis/bitable/v1/apps/MkrwbNJbwa7lzbs04c4cTDnxn3g/tables';
  
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Success!', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log(`Failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
  }
}
testFeishu();
