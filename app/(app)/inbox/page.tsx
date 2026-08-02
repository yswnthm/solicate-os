export const dynamic = "force-dynamic";

import { getActiveProjectsForSelect, getInboxData } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { InboxList } from "@/components/inbox-list";

export default async function InboxPage() {
  const [{ messages, entries }, projects] = await Promise.all([
    getInboxData(),
    getActiveProjectsForSelect(),
  ]);
  const total = messages.length + entries.length;

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Triage incoming messages and quick captures. File them into the project record or dismiss."
      >
        {total > 0 && (
          <span className="pill" style={{ fontSize: 13 }}>
            {total} untriaged
          </span>
        )}
      </PageHeader>

      <InboxList entries={entries} messages={messages} projects={projects} />
    </>
  );
}
