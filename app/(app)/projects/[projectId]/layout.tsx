export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";

import { getActiveClients, getProjectHeader } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ProjectStatusControl } from "@/components/status-controls";
import { EditProjectButton } from "@/components/editing/edit-buttons";
import { ProjectNav } from "@/components/project-nav";

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const { projectId } = await params;
  const [project, clients] = await Promise.all([getProjectHeader(projectId), getActiveClients()]);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.people?.name ?? "Client"} ${project.code ? `· ${project.code}` : ""} · ${project.summary || "No working summary yet."}`}
      >
        <StatusPill value={project.status} />
        <EditProjectButton project={project} clients={clients} label="Edit" />
        <ProjectStatusControl projectId={projectId} initialStatus={project.status} />
      </PageHeader>

      <ProjectNav projectId={projectId} />
      {children}
    </>
  );
}
