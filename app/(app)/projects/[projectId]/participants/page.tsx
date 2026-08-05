import { redirect } from "next/navigation";

export default async function ProjectParticipantsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/info`);
}

