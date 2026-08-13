export const dynamic = "force-dynamic";

import { getActiveProjectsForSelect, getInboxData } from "@/features/queries";
import { InboxCaptureHub } from "@/components/inbox-capture-hub";

export default async function InboxPage() {
  const [inbox, projects] = await Promise.all([
    getInboxData(),
    getActiveProjectsForSelect(),
  ]);

  return (
    <InboxCaptureHub
      entries={inbox.entries}
      projects={projects}
    />
  );
}
