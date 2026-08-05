"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ProjectStatusControl } from "@/components/status-controls";
import { EditProjectButton } from "@/components/editing/edit-buttons";
import { ProjectNav } from "@/components/project-nav";

export function ProjectHeaderWrapper({
  project,
  clients,
  projectId,
  children,
}: {
  project: any;
  clients: any;
  projectId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Check if we are inside a specific phase workspace: /projects/[projectId]/phases/[phaseId]...
  const isPhaseWorkspace = /\/projects\/[^/]+\/phases\/[^/]+/.test(pathname);

  if (isPhaseWorkspace) {
    return (
      <>
        <div style={{ marginTop: 76, marginBottom: 8 }}>
          <Link
            href={`/projects/${projectId}/phases`}
            className="button ghost small"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            ← Back to <strong>{project.name}</strong> (Phases)
          </Link>
        </div>
        {children}
      </>
    );
  }

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
