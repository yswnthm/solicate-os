export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";

import { getActiveClients, getProjectHeader } from "@/features/queries";
import { ProjectHeaderWrapper } from "@/components/project-header-wrapper";

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
    <ProjectHeaderWrapper project={project} clients={clients} projectId={projectId}>
      {children}
    </ProjectHeaderWrapper>
  );
}
