import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const dbPassword = env.SUPABASE_DB_PASSWORD;

console.log('Supabase URL:', supabaseUrl);
console.log('Publishable Key available:', !!supabaseKey);
console.log('DB Password available:', !!dbPassword);

// Test querying via postgres using bun or fetch
async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: projects, error: projErr } = await supabase.from('projects').select('id, name, status');
  console.log('Projects query result (anon key):', projects, projErr);
}

main().catch(console.error);
