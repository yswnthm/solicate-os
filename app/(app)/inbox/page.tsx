export const dynamic = "force-dynamic";

import { getActiveProjectsForSelect, getCaptureFormOptions, getInboxData } from "@/features/queries";
import { InboxCaptureHub } from "@/components/inbox-capture-hub";

export default async function InboxPage() {
  const [inbox, projects, captureOptions] = await Promise.all([
    getInboxData(),
    getActiveProjectsForSelect(),
    getCaptureFormOptions(),
  ]);

  return (
    <InboxCaptureHub
      entries={inbox.entries}
      projects={projects}
      captureOptions={captureOptions}
    />
  );
}
