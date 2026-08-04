export const dynamic = "force-dynamic";

import { getActiveProjectsForSelect, getCaptureFormOptions, getInboxData } from "@/features/queries";
import { InboxCaptureHub } from "@/components/inbox-capture-hub";

export default async function InboxPage() {
  const [{ messages, entries }, projects, captureOptions] = await Promise.all([
    getInboxData(),
    getActiveProjectsForSelect(),
    getCaptureFormOptions(),
  ]);

  return (
    <InboxCaptureHub
      entries={entries}
      messages={messages}
      projects={projects}
      captureOptions={captureOptions}
    />
  );
}
