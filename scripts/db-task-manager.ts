import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envText.split('\n')) {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const dbPassword = env.SUPABASE_DB_PASSWORD;
const connectionString = `postgresql://postgres.krfqsroptgwnmqoqvjle:${encodeURIComponent(dbPassword)}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase Postgres pooler!');

  // Query Stillness project
  const projRes = await client.query(
    "SELECT id, name, status FROM projects WHERE id = '1ce4a5c0-0000-4000-8000-000000000021' OR name ILIKE '%Stillness%'"
  );
  console.log('Projects:', projRes.rows);

  const stillnessId = projRes.rows[0]?.id || '1ce4a5c0-0000-4000-8000-000000000021';

  // Query phases for Stillness
  const phaseRes = await client.query(
    "SELECT id, name, status, position FROM phases WHERE project_id = $1 ORDER BY position ASC",
    [stillnessId]
  );
  console.log('\nPhases:', phaseRes.rows);

  // Query tasks for Stillness
  const taskRes = await client.query(
    "SELECT id, title, status, phase_id, created_at, completed_at FROM tasks WHERE project_id = $1 ORDER BY created_at DESC",
    [stillnessId]
  );
  console.log('\nTasks:', taskRes.rows);

  await client.end();
}

main().catch(console.error);
