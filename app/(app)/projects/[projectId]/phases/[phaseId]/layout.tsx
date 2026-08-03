export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";

import { getPhaseHeader } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EditPhaseButton } from "@/components/editing/edit-buttons";
import { PhaseNav } from "@/components/phase-nav";

export default async function PhaseLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
  children: React.ReactNode;
}) {
  const { projectId, phaseId } = await params;
  const { phase, project } = await getPhaseHeader(phaseId);
  if (!phase) notFound();

  return (
    <>
      <PageHeader
        title={`${phase.position}. ${phase.name}`}
        description={`${project?.name ?? "Project"} · ${phase.description || "Phase workspace"}`}
      >
        <StatusPill value={phase.status} />
        <EditPhaseButton phase={phase} label="Edit phase" />
      </PageHeader>

      <PhaseNav projectId={projectId} phaseId={phaseId} />
      {children}
    </>
  );
}
