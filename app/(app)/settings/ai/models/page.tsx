export const dynamic = "force-dynamic";

import { getAllModels } from "@/lib/ai";
import { ModelManagement } from "@/components/model-management";
import { requireActiveUser } from "@/lib/auth";

export default async function AiModelsPage() {
  await requireActiveUser();
  const models = await getAllModels();

  return (
    <section className="card">
      <div className="section-title">
        <h2>Model catalog</h2>
        <span>Active models are available as template defaults and fallbacks</span>
      </div>
      <ModelManagement models={models} />
    </section>
  );
}
