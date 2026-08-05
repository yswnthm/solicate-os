import { StatusPill } from "@/components/status-pill";
import { EditEntryButton } from "@/components/editing/edit-buttons";
import { formatDateTime } from "@/lib/utils";

export type Entry = {
  id: string;
  title: string;
  type: string;
  body_md: string | null;
  occurred_at: string | null;
  decision_outcome: string | null;
  decision_state: string | null;
  project_id: string | null;
  phase_id: string | null;
};

export type EntryEditContext = {
  projects?: { id: string; name: string }[];
  phases?: { id: string; position: number; name: string }[];
};

function EditControls({ entry, edit }: { entry: Entry; edit?: EntryEditContext }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <StatusPill value={entry.type} />
      <EditEntryButton entry={entry} projects={edit?.projects} phases={edit?.phases} />
    </div>
  );
}

export function EntryCard({ entry, edit }: { entry: Entry; edit?: EntryEditContext }) {
  return (
    <article className="card" key={entry.id}>
      <div
        className="section-title"
        style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
      >
        <h3 style={{ margin: 0 }}>{entry.title}</h3>
        <EditControls entry={entry} edit={edit} />
      </div>
      <div className="row-meta" style={{ marginTop: 4 }}>
        {formatDateTime(entry.occurred_at)}
        {entry.decision_outcome ? ` · Outcome: ${entry.decision_outcome}` : ""}
      </div>
      {entry.body_md ? <div className="prose">{entry.body_md}</div> : null}
    </article>
  );
}

export function EntryList({
  entries,
  edit,
}: {
  entries: Entry[];
  edit?: EntryEditContext;
}) {
  return (
    <div className="list">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} edit={edit} />
      ))}
    </div>
  );
}

export function TimelineList({
  entries,
  edit,
}: {
  entries: Entry[];
  edit?: EntryEditContext;
}) {
  return (
    <div className="timeline">
      {entries.map((entry) => (
        <div key={entry.id} className="timeline-item">
          <div className="timeline-meta">
            {entry.type === "milestone" && (
              <span style={{ marginRight: 6 }}>
                <StatusPill value="milestone" />
              </span>
            )}
            {formatDateTime(entry.occurred_at)} · {entry.type.replaceAll("_", " ")}
          </div>
          <div className="row-title" style={{ margin: "2px 0 4px" }}>
            {entry.title}
          </div>
          {entry.body_md ? (
            <div className="prose" style={{ fontSize: 13 }}>
              {entry.body_md}
            </div>
          ) : null}
          {entry.decision_outcome ? (
            <div className="prose" style={{ fontSize: 13, marginTop: 4 }}>
              Outcome: {entry.decision_outcome}
            </div>
          ) : null}
          <div style={{ marginTop: 6 }}>
            <EditControls entry={entry} edit={edit} />
          </div>
        </div>
      ))}
    </div>
  );
}
