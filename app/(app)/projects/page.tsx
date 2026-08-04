export const dynamic = "force-dynamic";
import Link from "next/link";

import { getActiveClients, getProjects } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/utils";
import { NewProjectButton } from "@/components/new-project-button";
import { EditProjectButton } from "@/components/editing/edit-buttons";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getActiveClients()]);
  const activeCount = projects.filter((p: any) => p.status === "active").length;
  const pausedCount = projects.filter((p: any) => p.status === "paused").length;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Active delivery work. Projects are the primary unit of operation in Solicate OS."
      >
        <NewProjectButton clients={clients} />
      </PageHeader>

      {/* Main edge-to-edge layout */}
      <div className="stack">
        <div className="grid two" style={{ marginBottom: 4 }}>
          <div className="card">
            <p className="metric-label">Active</p>
            <div className="metric">{activeCount}</div>
          </div>
          <div className="card">
            <p className="metric-label">Paused</p>
            <div className="metric" style={{ color: pausedCount > 0 ? "var(--warning)" : undefined }}>
              {pausedCount}
            </div>
          </div>
        </div>

        <section className="section">
          <div className="section-title">
            <h2>All projects</h2>
            <span>{projects.length} visible</span>
          </div>
          {projects.length ? (
            <div className="list">
              {projects.map((project: any) => (
                <div className="row" key={project.id}>
                  <Link className="row-main" href={`/projects/${project.id}`}>
                    <div className="row-title">{project.name}</div>
                    <div className="row-meta">
                      {project.people?.name}
                      {project.code ? ` · ${project.code}` : ""}
                      {project.target_date ? ` · target ${formatDate(project.target_date)}` : ""}
                    </div>
                  </Link>
                  <StatusPill value={project.status} />
                  <EditProjectButton project={project} clients={clients} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              No projects yet. Create your first project to begin operating.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
