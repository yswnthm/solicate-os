import Link from "next/link";
import { getPhaseWorkspace } from "@/features/queries";
import { createEntry } from "@/features/actions";
import { Section } from "@/components/shared/section";
import { EntryList } from "@/components/entries/entry-list";
import { EditScopeButton, EditProposalButton } from "@/components/editing/edit-buttons";
import { ModalTrigger } from "@/components/modal-trigger";
import { classNames } from "@/lib/utils";

export default async function PhaseDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { projectId, phaseId } = await params;
  const { tag: activeTag = "all" } = await searchParams;

  const { phase, entries, phases, project } = await getPhaseWorkspace(phaseId);
  const edit = { projects: [{ id: projectId, name: project?.name ?? "" }], phases };

  const tags = [
    { key: "all", label: "All" },
    { key: "scope", label: "Scope" },
    { key: "proposal", label: "Proposal" },
    { key: "decision", label: "Decisions" },
    { key: "note", label: "Notes" },
    { key: "document", label: "Documents" },
    { key: "record", label: "Records" },
  ] as const;

  const scopeBlocks = [
    { title: "Deliverables", body: phase.scope_deliverables, key: "deliverables" },
    { title: "Requirements", body: phase.scope_requirements, key: "requirements" },
    { title: "Acceptance criteria", body: phase.scope_acceptance, key: "acceptance" },
  ];
  const hasScope = scopeBlocks.some((b) => b.body);

  const proposalBlocks = [
    { title: "Quotation", body: phase.proposal_quotation, key: "quotation" },
    { title: "Pricing", body: phase.proposal_pricing, key: "pricing" },
    { title: "Revisions", body: phase.proposal_revisions, key: "revisions" },
  ];
  const hasProposal = proposalBlocks.some((b) => b.body);

  const filteredEntries = entries.filter((entry) => {
    if (activeTag === "all" || activeTag === "record") return true;
    if (activeTag === "document") return entry.type === "document";
    if (activeTag === "decision") return entry.type === "decision";
    if (activeTag === "note") return ["note", "meeting", "update", "capture"].includes(entry.type);
    if (activeTag === "scope" || activeTag === "proposal") return false; // Handled by structural sections above
    return true;
  });

  const showScope = activeTag === "all" || activeTag === "scope";
  const showProposal = activeTag === "all" || activeTag === "proposal";
  const showEntries = activeTag === "all" || ["decision", "note", "document", "record"].includes(activeTag);

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── Tag Navigation Header ─── */}
      <div className="section-title" style={{ marginBottom: 0, paddingBottom: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Phase Document Dashboard</h2>
        <ModalTrigger buttonLabel="+ Add document / record" title="Add Phase Record" buttonClass="button ghost small">
          <form className="form" action={createEntry}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="phase_id" value={phaseId} />
            <p className="muted" style={{ margin: 0 }}>
              Record will be scoped to {phase.position}. {phase.name}.
            </p>
            <div className="field">
              <label>Tag / Type</label>
              <select name="type" defaultValue={["document", "decision", "note"].includes(activeTag) ? activeTag : "document"}>
                <option value="document">Document</option>
                <option value="decision">Decision</option>
                <option value="note">Note</option>
                <option value="meeting">Meeting</option>
                <option value="update">Update</option>
                <option value="milestone">Milestone</option>
                <option value="capture">Quick capture</option>
              </select>
            </div>
            <div className="field">
              <label>Title</label>
              <input name="title" placeholder="Document title, note topic, or decision summary" required />
            </div>
            <div className="field">
              <label>Body / Content</label>
              <textarea name="body_md" placeholder="Content, specification, or meeting detail…" />
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
      </div>

      {/* ─── Tag Pills Filter Bar ─── */}
      <div className="tabs">
        {tags.map((t) => {
          const isActive = activeTag === t.key;
          let count = 0;
          if (t.key === "all") {
            count = (hasScope ? 1 : 0) + (hasProposal ? 1 : 0) + entries.length;
          } else if (t.key === "scope") {
            count = hasScope ? 1 : 0;
          } else if (t.key === "proposal") {
            count = hasProposal ? 1 : 0;
          } else if (t.key === "document") {
            count = entries.filter((e) => e.type === "document").length;
          } else if (t.key === "decision") {
            count = entries.filter((e) => e.type === "decision").length;
          } else if (t.key === "note") {
            count = entries.filter((e) => ["note", "meeting", "update", "capture"].includes(e.type)).length;
          } else if (t.key === "record") {
            count = entries.length;
          }

          return (
            <Link
              key={t.key}
              href={`/projects/${projectId}/phases/${phaseId}/documents${t.key === "all" ? "" : `?tag=${t.key}`}`}
              className={classNames("tab", isActive && "active")}
            >
              {t.label} <span className="tab-count">({count})</span>
            </Link>
          );
        })}
      </div>

      {/* ─── Scope Section ─── */}
      {showScope && (
        <Section title="Scope Tag" action={<EditScopeButton phase={phase} />}>
          {hasScope ? (
            <div className="strategy-grid">
              {scopeBlocks.map((block) => (
                <div className="strategy-block" key={block.key}>
                  <h4>{block.title}</h4>
                  {block.body ? <div className="prose">{block.body}</div> : <p className="muted">Not set yet.</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              Scope hasn&apos;t been defined for this phase — add deliverables, requirements, and acceptance criteria.
            </div>
          )}
        </Section>
      )}

      {/* ─── Proposal Section ─── */}
      {showProposal && (
        <Section title="Proposal Tag" action={<EditProposalButton phase={phase} />}>
          {hasProposal ? (
            <div className="strategy-grid">
              {proposalBlocks.map((block) => (
                <div className="strategy-block" key={block.key}>
                  <h4>{block.title}</h4>
                  {block.body ? <div className="prose">{block.body}</div> : <p className="muted">Not set yet.</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              No proposal recorded for this phase — capture quotation, pricing, and revisions here.
            </div>
          )}
        </Section>
      )}

      {/* ─── Documents / Decisions / Notes / Records List Section ─── */}
      {showEntries && (
        <Section
          title={
            activeTag === "all"
              ? "Phase Records & Documents"
              : `${activeTag.charAt(0).toUpperCase() + activeTag.slice(1)} Tagged Records`
          }
          count={filteredEntries.length}
        >
          {filteredEntries.length ? (
            <EntryList entries={filteredEntries} edit={edit} />
          ) : (
            <div className="empty">
              No records tagged as &ldquo;{activeTag}&rdquo; in this phase.
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
