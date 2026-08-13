export const dynamic = "force-dynamic";
import Link from "next/link";

import { getActiveClients, getAllProjects } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDate } from "@/lib/utils";
import { NewProjectButton } from "@/components/new-project-button";
import { EditProjectButton } from "@/components/editing/edit-buttons";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const { filter = "active" } = await searchParams;
  const [allProjects, clients] = await Promise.all([getAllProjects(), getActiveClients()]);
  
  const activeCount = allProjects.filter((p: any) => p.status === "active").length;
  const pausedCount = allProjects.filter((p: any) => p.status === "paused").length;
  const archivedCount = allProjects.filter((p: any) => p.status === "archived").length;

  const displayedProjects = filter === "all" 
    ? allProjects 
    : allProjects.filter((p: any) => {
        if (filter === "active") return p.status === "active";
        if (filter === "paused") return p.status === "paused";
        if (filter === "archived") return p.status === "archived";
        return true;
      });

  return (
    <>
      <PageHeader
        title="Projects"
        description="Active delivery work. Projects are the primary unit of operation in Solicate OS."
      >
        <NewProjectButton clients={clients} />
      </PageHeader>

      <div className="stack">
        <div className="grid three" style={{ marginBottom: 16 }}>
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
          <div className="card">
            <p className="metric-label">Archived</p>
            <div className="metric">{archivedCount}</div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <Link href="/projects?filter=active" className={`tab ${filter === "active" ? "active" : ""}`}>
            Active
          </Link>
          <Link href="/projects?filter=paused" className={`tab ${filter === "paused" ? "active" : ""}`}>
            Paused
          </Link>
          <Link href="/projects?filter=archived" className={`tab ${filter === "archived" ? "active" : ""}`}>
            Archived
          </Link>
          <Link href="/projects?filter=all" className={`tab ${filter === "all" ? "active" : ""}`}>
            All
          </Link>
        </div>

        <section className="section">
          <div className="section-title">
            <h2>{filter === "all" ? "All projects" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} projects`}</h2>
            <span>{displayedProjects.length} visible</span>
          </div>
          {displayedProjects.length ? (
            <div className="list">
              {displayedProjects.map((project: any) => (
                <div className="row" key={project.id}>
                  <Link className="row-main" href={`/projects/${project.id}`}>
                    <div className="row-title">{project.name}</div>
                    <div className="row-meta">
                      {[
                        project.people?.name,
                        project.target_date ? `Target: ${formatDate(project.target_date)}` : null,
                        project.summary
                      ].filter(Boolean).join(" · ") || "No details provided"}
                    </div>
                  </Link>
                  <StatusPill value={project.status} />
                  <EditProjectButton project={project} clients={clients} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              No projects found for this filter.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
