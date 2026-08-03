export const dynamic = "force-dynamic";

import { getAllModels } from "@/lib/ai";
import { ModelManagement } from "@/components/model-management";
import { PageHeader } from "@/components/page-header";
import { requireActiveUser } from "@/lib/auth";

export default async function ModelsPage() {
  await requireActiveUser();
  const models = await getAllModels();

  return (
    <>
      <PageHeader
        title="AI models"
        description="The model catalog the execution engine resolves at runtime. Active models are available as template defaults and fallbacks."
      />
      <ModelManagement models={models} />
    </>
  );
}
