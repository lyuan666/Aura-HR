const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// 环境变量加载
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function verifyDb() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'yzschros',
    password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
    database: process.env.DATABASE_NAME || 'yzschros',
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully.');

    // 验证 pgvector
    const res = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector';");
    if (res.rows.length > 0) {
      console.log('✅ pgvector extension is installed.');
    } else {
      console.log('❌ pgvector extension is NOT installed.');
    }

    // 验证核心表结构与数据量
    const tables = ['candidates', 'enterprises', 'contracts', 'invoices', 'follow_ups', 'audit_logs'];
    for (const table of tables) {
      const tableRes = await client.query(`SELECT count(*) FROM information_schema.tables WHERE table_name = '${table}';`);
      if (parseInt(tableRes.rows[0].count) > 0) {
        const countRes = await client.query(`SELECT count(*) FROM ${table};`);
        console.log(`✅ Table "${table}" exists. Records: ${countRes.rows[0].count}`);
        
        if (table === 'candidates') {
          const colRes = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'embedding';");
          if (colRes.rows.length > 0) {
            console.log(`   - "embedding" column type: ${colRes.rows[0].data_type}`);
          } else {
            console.log('   ❌ "embedding" column is missing.');
          }
        }
      } else {
        console.log(`❌ Table "${table}" is missing.`);
      }
    }

  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await client.end();
  }
}

verifyDb();
