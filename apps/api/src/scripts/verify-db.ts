import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function verifyDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'yzschros',
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully.');

    const res = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector';");
    if (res.rows.length > 0) {
      console.log('✅ pgvector extension is installed.');
    } else {
      console.log('❌ pgvector extension is NOT installed.');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await client.end();
  }
}

verifyDb();
