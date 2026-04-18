const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function applyFix() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'yzschros',
    password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
    database: process.env.DATABASE_NAME || 'yzschros',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // 1. 安装扩展
    console.log('🚀 Installing pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension ensured.');

    // 2. 检查并添加 Candidates 表列
    console.log('🚀 Checking Candidates columns...');
    await client.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS embedding vector(2048);');
    await client.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS "resumeText" text;');
    console.log('✅ Candidates columns ensured.');

    // 3. 检查并添加 JobPositions 表列
    console.log('🚀 Checking JobPositions columns...');
    await client.query('ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS embedding vector(2048);');
    await client.query('ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS "enhancedDescription" text;');
    console.log('✅ JobPositions columns ensured.');

    // 4. 验证结果
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'embedding';");
    if (res.rows.length > 0) {
      console.log('🎊 ALL DATABASE FIXES APPLIED SUCCESSFULLY.');
    } else {
      console.log('❌ Failed to apply fixes.');
    }

  } catch (err) {
    console.error('❌ Error applying DB fixes:', err.message);
  } finally {
    await client.end();
  }
}

applyFix();
