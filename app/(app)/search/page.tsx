import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { searchRecords } from "@/features/queries";
import { formatDateTime } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await searchRecords(q);
  const total =
    results.entries.length + results.messages.length + results.projects.length + results.people.length;

  return (
    <>
      <PageHeader title="Search" description="Find the original record, not a summary." />

      <form action="/search" style={{ marginBottom: 28 }}>
        <div className="form-grid" style={{ alignItems: "end" }}>
          <div className="field">
            <label htmlFor="q">Search project memory</label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Stillness checkout, Komal request, Q3 decision…"
              autoFocus
              autoComplete="off"
            />
          </div>
          <button className="button" type="submit">
            Search
          </button>
        </div>
      </form>

      {q ? (
        <section className="section">
          <div className="section-title">
            <h2>Results for &ldquo;{q}&rdquo;</h2>
            <span>{total} match{total !== 1 ? "es" : ""}</span>
          </div>
          {total > 0 ? (
            <div className="stack">
              {results.projects.length > 0 && (
                <>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                    PROJECTS
                  </p>
                  <div className="list">
                    {results.projects.map((project: any) => (
                      <Link
                        className="row"
                        href={`/projects/${project.id}`}
                        key={`project-${project.id}`}
                      >
                        <StatusPill value="project" />
                        <div className="row-main">
                          <div className="row-title">{project.name}</div>
                          <div className="row-meta">
                            {project.clients?.name} {project.code ? `· ${project.code}` : ""}
                          </div>
                        </div>
                        <StatusPill value={project.status} />
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.people.length > 0 && (
                <>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                    PEOPLE
                  </p>
                  <div className="list">
                    {results.people.map((person: any) => (
                      <Link className="row" href="/people" key={`person-${person.id}`}>
                        <StatusPill value={person.is_partner ? "partner" : "person"} />
                        <div className="row-main">
                          <div className="row-title">{person.name}</div>
                          <div className="row-meta">{person.email ?? ""}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.entries.length > 0 && (
                <>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                    PROJECT RECORDS
                  </p>
                  <div className="list">
                    {results.entries.map((entry: any) => (
                      <Link
                        className="row"
                        href={`/projects/${entry.project_id}`}
                        key={`entry-${entry.id}`}
                      >
                        <StatusPill value={entry.type} />
                        <div className="row-main">
                          <div className="row-title">{entry.title}</div>
                          <div className="row-meta">
                            {entry.projects?.name} · {formatDateTime(entry.occurred_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.messages.length > 0 && (
                <>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                    MESSAGES
                  </p>
                  <div className="list">
                    {results.messages.map((message: any) => (
                      <Link
                        className="row"
                        href={
                          message.conversations?.project_id
                            ? `/projects/${message.conversations.project_id}`
                            : "/inbox"
                        }
                        key={`message-${message.id}`}
                      >
                        <StatusPill value="message" />
                        <div className="row-main">
                          <div className="row-title">
                            {message.conversations?.title ?? "Conversation"}
                          </div>
                          <div className="row-meta">
                            {message.body_md.slice(0, 180)} · {formatDateTime(message.sent_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="empty">No records match &ldquo;{q}&rdquo;. Try a different term.</div>
          )}
        </section>
      ) : (
        <div className="empty">
          Search covers entry titles, entry bodies, and message content — backed by Postgres full-text search.
        </div>
      )}
    </>
  );
}
