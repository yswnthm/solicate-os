export const dynamic = "force-dynamic";

import { MessageDrafter } from "@/components/message-drafter";
import { PageHeader } from "@/components/page-header";
import { requireActiveUser } from "@/lib/auth";

export default async function DrafterPage() {
  await requireActiveUser();
  return (
    <>
      <PageHeader
        title="Message Drafter"
        description="Write to anyone on a project. Solicate gathers the context; the model drafts the message; you decide when it's sent."
      />
      <MessageDrafter />
    </>
  );
}
