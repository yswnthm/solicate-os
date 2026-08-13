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

  const projectId = '1ce4a5c0-0000-4000-8000-000000000021';
  const actorId = '662c2444-d9c6-4075-904e-5f6333426d55';
  const taskId = '2cb31583-7012-479e-ab5e-7b89e5e2499a';

  const activitySummary = 'Completed WooCommerce Age Confirmation Checkbox for August 21 Event (Product ID 7061)';
  const actInsertRes = await client.query(
    `INSERT INTO activity_events (
      project_id, actor_id, record_type, record_id, event_type, summary, occurred_at
    ) VALUES ($1, $2, 'task', $3, 'completed', $4, NOW())
    RETURNING id, record_type, record_id, event_type, summary, occurred_at`,
    [projectId, actorId, taskId, activitySummary]
  );

  console.log('Successfully logged completed activity event into DB:', actInsertRes.rows[0]);

  await client.end();
}

main().catch(console.error);
