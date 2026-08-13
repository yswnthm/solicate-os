"use client";

import { InboxList } from "@/components/inbox-list";
import { PageHeader } from "@/components/page-header";

interface InboxProject {
  id: string;
  name: string;
  people?: Array<{ name: string }> | { name: string } | null;
}

export function InboxCaptureHub({
  entries,
  projects,
}: {
  entries: any[];
  projects: InboxProject[];
}) {
  return (
    <>
      <PageHeader
        title="Inbox"
        description="Your saved ideas and notes. File them to a project or dismiss."
      />
      <InboxList entries={entries} projects={projects} />
    </>
  );
}
