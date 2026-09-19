const { Client } = require('pg');
const fs = require('fs');
const env = Object.fromEntries(
  fs.readFileSync('d:/Projects/intresting/prod/restaurant-management/backend/.env', 'utf8')
    .split('\n').filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]; })
);
async function main() {
  const client = new Client({ host: env.DB_HOST, port: Number(env.DB_PORT), database: env.DB_DATABASE, user: env.DB_USERNAME, password: env.DB_PASSWORD, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const idx = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'order_items' AND indexname = 'idx_order_items_merge_key'`);
    console.log('idx_order_items_merge_key:', idx.rows);
    const migs = await client.query(`SELECT name FROM migrations ORDER BY id DESC LIMIT 10`);
    console.log('last 10 applied migrations:', migs.rows);
  } finally { await client.end(); }
}
main().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
