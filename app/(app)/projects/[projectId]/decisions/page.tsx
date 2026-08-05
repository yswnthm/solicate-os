export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

export default async function ProjectDecisionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/documents?tag=decision`);
}

