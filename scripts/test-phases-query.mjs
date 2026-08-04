// Test what getProjectWorkspace returns for phases
// This simulates the server-side query without auth (RLS will restrict)
// Run with: node scripts/test-phases-query.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://krfqsroptgwnmqoqvjle.supabase.co";
const SUPABASE_KEY = "sb_publishable_C9hiXmtUHgDf-Qi871kKEw_cvcKbUkv";
const PROJECT_ID = "2f9e3d70-0000-4000-8000-000000000021";

// Test 1: What fields are returned with no auth
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

console.log("=== Testing phases SELECT (no auth) ===");
const { data, error } = await supabase
  .from("phases")
  .select("id, name, description, position, status, started_on, target_date, completed_at, project_id")
  .eq("project_id", PROJECT_ID)
  .order("position");

console.log("Error:", JSON.stringify(error));
console.log("Data:", JSON.stringify(data, null, 2));
console.log("Data type:", typeof data);
console.log("Is array:", Array.isArray(data));
if (Array.isArray(data) && data.length > 0) {
  console.log("First phase fields:", Object.keys(data[0]));
  console.log("First phase.id:", data[0].id, "type:", typeof data[0].id);
}

// Test 2: Same query using getAll cookie approach (what the server action uses)
console.log("\n=== Testing direct PostgREST call with publishable key ===");
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/phases?select=id,name,position,status,project_id&project_id=eq.${PROJECT_ID}&order=position`,
  {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }
);
console.log("HTTP Status:", response.status);
const body = await response.json();
console.log("Body:", JSON.stringify(body, null, 2));

process.exit(0);
