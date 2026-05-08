const axios = require('axios');

async function testFeishu() {
  const token = 'pt-ro3GxLEbRHAg4gjr6JS_GR6gcvRfsAC5adAZ12meAQAAxwsA5LvLRO9IfWgB';
  const url = 'https://open.feishu.cn/open-apis/bitable/v1/apps/MkrwbNJbwa7lzbs04c4cTDnxn3g/tables/tbl6k2yn1MM3Rs9m/records';
  
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Success!', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log(`Failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
  }
}
testFeishu();
