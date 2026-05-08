const axios = require('axios');

async function testFeishu() {
  try {
    const res = await axios.get(
      'https://open.feishu.cn/open-apis/bitable/v1/apps/MkrwbNJbwa7lzbs04c4cTDnxn3g/tables/tbl6k2yn1MM3Rs9m/records',
      {
        headers: {
          'Authorization': 'Bearer pt-ihnyHkNtWm8gSOPz2yjDeLvSrupfsAC5adAZ12meAQAAxwsA5LvLRO_xY1UB'
        }
      }
    );
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
testFeishu();
