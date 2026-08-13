export const dynamic = "force-dynamic";

import { getActiveProjectsForSelect, getInboxData } from "@/features/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InboxCaptureHub } from "@/components/inbox-capture-hub";
import { EntriesSection } from "@/components/entries/entries-section";

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();
  const [inbox, projects, sortedRes] = await Promise.all([
    getInboxData(),
    getActiveProjectsForSelect(),
    supabase
      .from("entries")
      .select("id, title, type, body_md, occurred_at, project_id, decision_outcome, decision_state, phase_id, projects(name)")
      .eq("triage_state", "filed")
      .eq("type", "capture")
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="stack">
      <InboxCaptureHub
        entries={inbox.entries}
        projects={projects}
      />
      
      <EntriesSection
        title="Sorted Inbox"
        entries={sortedRes.data ?? []}
        edit={{ projects }}
        defaultOpen={false}
        empty="No filed captures yet."
      />
    </div>
  );
}
