const { Client } = require('pg');

async function cleanTestData() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'yzschros',
    password: 'yzschros_dev_2026',
    database: 'yzschros',
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // 删除测试账号（基于 email 或姓名）
    const res = await client.query("DELETE FROM candidates WHERE email = 'zhangsan@example.com' OR name LIKE '张三%'");
    console.log(`Deleted ${res.rowCount} test candidates.`);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

cleanTestData();
