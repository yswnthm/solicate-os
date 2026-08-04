import { getProjectWorkspace, getProjectTransactions, getFinanceSettings } from "@/features/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Section } from "@/components/shared/section";
import { ProjectFinancePanel } from "@/components/finance/project-finance-panel";

export default async function ProjectFinancesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);
  const allocations = await getProjectTransactions(projectId);
  
  const supabase = await createSupabaseServerClient();
  const [peopleRes, settings] = await Promise.all([
    supabase.from("people").select("id, name").order("name"),
    getFinanceSettings(),
  ]);

  return (
    <Section
      title="Finances"
      count={allocations.length}
    >
      <ProjectFinancePanel
        projectId={projectId}
        allocations={allocations}
        phases={data.phases}
        people={peopleRes.data ?? []}
        categories={settings.categories}
        paymentMethods={settings.paymentMethods}
      />
    </Section>
  );
}
