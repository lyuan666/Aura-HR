const { Client } = require('pg');

async function checkLastCandidate() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'yzschros',
    password: 'yzschros_dev_2026',
    database: 'yzschros',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT name, email, school, degree, major, notes FROM candidates ORDER BY created_at DESC LIMIT 1;');
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkLastCandidate();
