import Link from "next/link";
import { getProjectWorkspace } from "@/features/queries";
import { createEntry } from "@/features/actions";
import { ModalTrigger } from "@/components/modal-trigger";
import { Section } from "@/components/shared/section";
import { EntryList } from "@/components/entries/entry-list";
import { classNames } from "@/lib/utils";

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { projectId } = await params;
  const { tag: activeTag = "all" } = await searchParams;

  const data = await getProjectWorkspace(projectId);
  const edit = { projects: [{ id: projectId, name: data.project?.name ?? "" }], phases: data.phases };

  const tags = [
    { key: "all", label: "All Records" },
    { key: "document", label: "Documents" },
    { key: "decision", label: "Decisions" },
    { key: "note", label: "Notes" },
    { key: "record", label: "Records" },
  ] as const;

  const filteredEntries = data.entries.filter((entry) => {
    if (entry.triage_state === "inbox") return false;
    if (activeTag === "all" || activeTag === "record") return true;
    if (activeTag === "document") return entry.type === "document";
    if (activeTag === "decision") return entry.type === "decision";
    if (activeTag === "note") return ["note", "meeting", "update", "capture"].includes(entry.type);
    return true;
  });

  return (
    <div className="stack">
      <Section
        title="Project Documents & Decisions"
        count={filteredEntries.length}
        action={
          <ModalTrigger buttonLabel="+ Add document / decision" title="New Document or Decision" buttonClass="button ghost small">
            <form className="form" action={createEntry}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Type / Tag</label>
                <select name="type" defaultValue={activeTag !== "all" && activeTag !== "record" ? activeTag : "document"}>
                  <option value="document">Document</option>
                  <option value="decision">Decision</option>
                  <option value="note">Note</option>
                  <option value="meeting">Meeting</option>
                  <option value="update">Update</option>
                  <option value="capture">Quick capture</option>
                </select>
              </div>
              <div className="field">
                <label>Title</label>
                <input name="title" placeholder="Document title or decision subject" required />
              </div>
              <div className="field">
                <label>Body / Content</label>
                <textarea name="body_md" placeholder="Content, reference details, or decision summary…" />
              </div>
              <div className="field">
                <label>Decision outcome (decisions only)</label>
                <input name="decision_outcome" placeholder="What was decided" />
              </div>
              <input type="hidden" name="occurred_at" value="" />
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Save Record
              </button>
            </form>
          </ModalTrigger>
        }
      >
        <div className="chip-group" style={{ marginBottom: 20 }}>
          {tags.map((t) => {
            const count = data.entries.filter((e) => {
              if (e.triage_state === "inbox") return false;
              if (t.key === "all" || t.key === "record") return true;
              if (t.key === "document") return e.type === "document";
              if (t.key === "decision") return e.type === "decision";
              if (t.key === "note") return ["note", "meeting", "update", "capture"].includes(e.type);
              return true;
            }).length;

            const isActive = activeTag === t.key;
            return (
              <Link
                key={t.key}
                href={`/projects/${projectId}/documents${t.key === "all" ? "" : `?tag=${t.key}`}`}
                className={classNames("chip", isActive && "active")}
              >
                {t.label} <span className="chip-count">({count})</span>
              </Link>
            );
          })}
        </div>

        {filteredEntries.length ? (
          <EntryList entries={filteredEntries} edit={edit} showPhaseBadge={true} />
        ) : (
          <div className="empty">
            No records match tag &ldquo;{activeTag}&rdquo;. Use <strong>+ Add document / decision</strong> above to add one.
          </div>
        )}
      </Section>
    </div>
  );
}
