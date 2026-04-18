const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function cleanup() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'yzschros',
    password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
    database: process.env.DATABASE_NAME || 'yzschros',
  });

  try {
    await client.connect();
    console.log('--- 开始物理清理数据库 ---');
    
    // 1. 清理 stress_test 来源的候选人
    const deleteRes = await client.query("DELETE FROM candidates WHERE source_platform = 'stress_test'");
    console.log(`✅ 已删除压测候选人数据: ${deleteRes.rowCount} 条`);
    
    // 2. 检查名称前缀（兜底）
    const deleteRes2 = await client.query("DELETE FROM candidates WHERE name LIKE 'test_stress_user%'");
    console.log(`✅ 已删除残留压测用户数据: ${deleteRes2.rowCount} 条`);
    
    // 3. 释放空间（VACUUM）
    // NOTE: VACUUM FULL 需要排他锁，此处使用常规 VACUUM ANALYZE
    await client.query("VACUUM ANALYZE candidates");
    console.log('✅ 已执行统计信息更新与空间标记');

    const finalCount = await client.query("SELECT count(*) FROM candidates");
    console.log(`📊 剩余候选人总数: ${finalCount.rows[0].count}`);
    
  } catch (err) {
    console.error('❌ 清理失败:', err.message);
  } finally {
    await client.end();
  }
}

cleanup();
