import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Read env variables manually
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
const connectionString = `postgresql://postgres.krfqsroptgwnmqoqvjle:${dbPassword}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const query = `
BEGIN;

-- Delete any remaining relationships for the old business entities (Stillness Co, CYCFDesign)
DELETE FROM relationships WHERE client_id IN ('1ce4a5c0-0000-4000-8000-000000000001', '2f9e3d70-0000-4000-8000-000000000001');
DELETE FROM relationships WHERE person_id IN ('1ce4a5c0-0000-4000-8000-000000000001', '2f9e3d70-0000-4000-8000-000000000001');

-- Delete any project participants for them just in case
DELETE FROM project_participants WHERE person_id IN ('1ce4a5c0-0000-4000-8000-000000000001', '2f9e3d70-0000-4000-8000-000000000001');

-- Delete the old business people records
DELETE FROM people WHERE id IN ('1ce4a5c0-0000-4000-8000-000000000001', '2f9e3d70-0000-4000-8000-000000000001');

COMMIT;
  `;

  try {
    await client.query(query);
    console.log('Query successful');
  } catch (err) {
    console.error('Error executing query:', err);
    await client.query('ROLLBACK;');
  } finally {
    await client.end();
  }
}

main().catch(console.error);
