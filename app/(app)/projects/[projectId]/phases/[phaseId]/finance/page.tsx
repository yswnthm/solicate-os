import { getPhaseWorkspace, getProjectTransactions, getFinanceSettings } from "@/features/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Section } from "@/components/shared/section";
import { ProjectFinancePanel } from "@/components/finance/project-finance-panel";

export default async function PhaseFinancePage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { phases } = await getPhaseWorkspace(phaseId);
  const allocations = await getProjectTransactions(projectId);

  const supabase = await createSupabaseServerClient();
  const [peopleRes, settings] = await Promise.all([
    supabase.from("people").select("id, name").order("name"),
    getFinanceSettings(),
  ]);

  return (
    <Section title="Finance" count={allocations.length}>
      <ProjectFinancePanel
        projectId={projectId}
        allocations={allocations}
        phases={phases}
        people={peopleRes.data ?? []}
        categories={settings.categories}
        paymentMethods={settings.paymentMethods}
      />
    </Section>
  );
}
