import { redirect } from "next/navigation";

export default async function PhaseIssuesPage({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;
  redirect(`/projects/${projectId}/phases/${phaseId}/tasks`);
}
