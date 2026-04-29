const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT email, name FROM users LIMIT 1');
    console.log('Valid User found:', res.rows[0]);
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

main();
