const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function check() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'yzschros',
    password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
    database: process.env.DATABASE_NAME || 'yzschros',
  });

  try {
    await client.connect();
    const res = await client.query("SELECT source_platform, count(*) FROM candidates GROUP BY source_platform");
    console.log("Candidate Sources:", res.rows);
    
    const stressCount = await client.query("SELECT count(*) FROM candidates WHERE name LIKE 'test_stress_user%'");
    console.log("Total Stress Test Users:", stressCount.rows[0].count);
    
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
  }
}

check();
