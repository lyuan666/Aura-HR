const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'yzschros',
  password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
  database: process.env.DATABASE_NAME || 'yzschros',
};

async function stressTest() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('🚀 Starting Stress Test...');

    // 1. 尝试启用 pgvector 扩展
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('✅ Extension "vector" ensured.');
    } catch (e) {
      console.warn('⚠️  Could not enable "vector" extension. This is critical for semantic search.');
      console.warn('   Error:', e.message);
    }

    // 2. 尝试添加 embedding 列（如果缺失）
    try {
      await client.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS embedding vector(1024);');
      console.log('✅ Column "embedding" ensured.');
    } catch (e) {
      console.error('❌ Failed to ensure "embedding" column:', e.message);
    }

    // 3. 准备测试数据
    const COUNT = 10000;
    console.log(`📦 Generating ${COUNT} mock candidates...`);
    
    // 清理旧的测试数据 (假设名字前缀为 test_stress_)
    await client.query("DELETE FROM candidates WHERE name LIKE 'test_stress_%';");

    const insertQuery = `
      INSERT INTO candidates (id, name, source_platform, current_title, current_company, status, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `;

    const startInsert = Date.now();
    for (let i = 0; i < COUNT; i++) {
      const id = require('crypto').randomUUID();
      const name = `test_stress_user_${i}`;
      const vector = Array.from({ length: 1024 }, () => Math.random().toFixed(4));
      const vectorStr = `[${vector.join(',')}]`;
      
      await client.query(insertQuery, [
        id, 
        name, 
        'stress_test', 
        'Software Engineer', 
        'Mock Corp', 
        'new',
        vectorStr
      ]);
      
      if (i % 1000 === 0 && i > 0) console.log(`   Inserted ${i} items...`);
    }
    const endInsert = Date.now();
    console.log(`✅ Insertion completed in ${((endInsert - startInsert) / 1000).toFixed(2)}s`);

    // 4. 执行语义搜索压测
    try {
      console.log('🔍 Running semantic search performance test...');
      const searchVector = Array.from({ length: 1024 }, () => Math.random().toFixed(4));
      const searchVectorStr = `[${searchVector.join(',')}]`;

      const searchStart = Date.now();
      const searchRes = await client.query(`
        SELECT name, embedding <=> $1 as distance 
        FROM candidates 
        ORDER BY distance 
        LIMIT 10;
      `, [searchVectorStr]);
      const searchEnd = Date.now();

      console.log(`⏱️  Search (Top 10) completed in ${searchEnd - searchStart}ms`);
      console.log('📊 Result preview:', searchRes.rows.map(r => ({ name: r.name, distance: parseFloat(r.distance).toFixed(4) })));
    } catch (e) {
      console.warn('⚠️  Semantic search test skipped:', e.message);
    }

    // 5. 数据量统计
    const totalCount = await client.query('SELECT count(*) FROM candidates;');
    console.log(`📈 Current total records in candidates: ${totalCount.rows[0].count}`);

    // 6. 清理建议 (可选)
    // console.log('🧹 To clear test data, run: DELETE FROM candidates WHERE sourcePlatform = \'stress_test\';');

  } catch (err) {
    console.error('❌ Stress test failed:', err);
  } finally {
    await client.end();
  }
}

stressTest();
