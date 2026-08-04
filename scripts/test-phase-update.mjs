// Diagnostic script to test the phase update directly.
// Run with: node scripts/test-phase-update.mjs
// This uses the anon/publishable key WITHOUT a user session, which will fail RLS.
// To test WITH auth, you need to pass a valid session token.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://krfqsroptgwnmqoqvjle.supabase.co";
const SUPABASE_KEY = "sb_publishable_C9hiXmtUHgDf-Qi871kKEw_cvcKbUkv";
const PHASE_ID = "2f9e3d70-0000-4000-8000-000000001000";
const PROJECT_ID = "2f9e3d70-0000-4000-8000-000000000021";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

console.log("=== Testing Phase Read (no auth, RLS will restrict) ===");
const { data: readData, error: readError } = await supabase
  .from("phases")
  .select("id, name, position, status, project_id")
  .eq("project_id", PROJECT_ID)
  .order("position");

console.log("Read result:", JSON.stringify({ data: readData, error: readError }, null, 2));

console.log("\n=== Testing Phase Update (no auth, RLS will restrict) ===");
const { data: updateData, error: updateError, status: updateStatus, count: updateCount } = await supabase
  .from("phases")
  .update({
    project_id: PROJECT_ID,
    name: "Phase 1 — Etsy catalog [DIAG TEST]",
    description: "Etsy shop consistency pass: 4 existing + 20 new listings, plus-size only, US market. ₹5,000 deal closed via Sakshi.",
    position: 1,
    status: "active",
    started_on: "2026-07-04",
    target_date: null,
  })
  .eq("id", PHASE_ID);

console.log("Update result:", JSON.stringify({ data: updateData, error: updateError, status: updateStatus, count: updateCount }, null, 2));

process.exit(0);
