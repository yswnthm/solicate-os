export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default async function PhaseScopePage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  redirect(`/projects/${projectId}/phases/${phaseId}/documents?tag=scope`);
}

