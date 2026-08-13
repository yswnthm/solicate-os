"use client";

import { useState, useRef } from "react";
import { StatusPill } from "@/components/status-pill";
import { EditEntryButton } from "@/components/editing/edit-buttons";
import { ModalTrigger } from "@/components/modal-trigger";
import { createEntry, unfileInboxEntry } from "@/features/actions";
import { formatDateTime } from "@/lib/utils";
import { Inbox } from "lucide-react";

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
  phases?: any;
};

export type EntryEditContext = {
  projects?: { id: string; name: string }[];
  phases?: { id: string; position: number; name: string }[];
};

function EditControls({ entry, edit }: { entry: Entry; edit?: EntryEditContext }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <StatusPill value={entry.type} />
      
      <form action={unfileInboxEntry} title="Send back to Inbox">
        <input type="hidden" name="entry_id" value={entry.id} />
        {entry.project_id && <input type="hidden" name="project_id" value={entry.project_id} />}
        <button
          type="submit"
          className="button ghost small icon-only"
          style={{ padding: "4px 6px", height: "auto" }}
        >
          <Inbox size={14} style={{ opacity: 0.7 }} />
        </button>
      </form>

      <EditEntryButton entry={entry} projects={edit?.projects} phases={edit?.phases} />
    </div>
  );
}

export function EntryCard({
  entry,
  edit,
  showPhaseBadge = false,
}: {
  entry: Entry;
  edit?: EntryEditContext;
  showPhaseBadge?: boolean;
}) {
  const phaseObj = Array.isArray(entry.phases) ? entry.phases[0] : entry.phases;
  const phaseLabel = phaseObj
    ? `${phaseObj.position ? `Phase ${phaseObj.position} · ` : ""}${phaseObj.name}`
    : "Project Level";

  return (
    <article className="entry-card" key={entry.id}>
      <div className="entry-card-header">
        <div className="entry-card-title-group">
          <h3 className="entry-card-title">{entry.title}</h3>
          {showPhaseBadge && (
            <span className="entry-phase-badge">
              {phaseLabel}
            </span>
          )}
        </div>
        <EditControls entry={entry} edit={edit} />
      </div>
      <div className="entry-meta" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        <span suppressHydrationWarning>{formatDateTime(entry.occurred_at)}</span>
        {entry.decision_outcome ? ` · Outcome: ${entry.decision_outcome}` : ""}
      </div>
      {entry.body_md ? <div className="entry-body">{entry.body_md}</div> : null}
    </article>
  );
}

export function EntryList({
  entries,
  edit,
  showPhaseBadge = false,
}: {
  entries: Entry[];
  edit?: EntryEditContext;
  showPhaseBadge?: boolean;
}) {
  return (
    <div className="list">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} edit={edit} showPhaseBadge={showPhaseBadge} />
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
  const [viewMode, setViewMode] = useState<"horizontal" | "vertical">("horizontal");
  const milestoneTrackRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const amount = direction === "left" ? -340 : 340;
      ref.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const milestones = entries.filter((e) => e.type === "milestone");
  const now = new Date();

  const projectId = edit?.projects?.[0]?.id;

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* ─── Dedicated Milestone Roadmap Section (Distance Separation) ─── */}
      <div className="milestone-section">
        <div className="milestones-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusPill value="milestone" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Project Milestones</h3>
            </div>
            <p className="milestones-subtitle" style={{ margin: "4px 0 0" }}>
              Key target checkpoints & delivery goals — separated from daily activity logs.
            </p>
          </div>
          {projectId && (
            <ModalTrigger buttonLabel="+ Add milestone" title="New Milestone" buttonClass="button ghost small">
              <form className="form" action={createEntry}>
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="type" value="milestone" />
                <div className="field">
                  <label>Milestone Name</label>
                  <input name="title" placeholder="e.g. Beta Delivery, Sign-off, Launch" required />
                </div>
                {edit?.phases && edit.phases.length > 0 && (
                  <div className="field">
                    <label>Phase (Optional)</label>
                    <select name="phase_id">
                      <option value="">Project-wide</option>
                      {edit.phases.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.position}. {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label>Target / Occurred Date</label>
                  <input name="occurred_at" type="datetime-local" />
                </div>
                <div className="field">
                  <label>Description & Scope</label>
                  <textarea name="body_md" placeholder="Summary of milestone criteria and deliverables" />
                </div>
                <button className="button" type="submit" style={{ marginTop: 8 }}>
                  Create Milestone
                </button>
              </form>
            </ModalTrigger>
          )}
        </div>

        {milestones.length > 0 ? (
          <div className="scroll-track-container">
            <button
              className="scroll-btn left"
              onClick={() => scrollContainer(milestoneTrackRef, "left")}
              title="Scroll left"
              type="button"
            >
              ‹
            </button>
            <button
              className="scroll-btn right"
              onClick={() => scrollContainer(milestoneTrackRef, "right")}
              title="Scroll right"
              type="button"
            >
              ›
            </button>
            <div className="milestone-track-wrapper" ref={milestoneTrackRef}>
              {milestones.map((m) => {
                const date = m.occurred_at ? new Date(m.occurred_at) : null;
                const isUpcoming = date ? date > now : true;

                return (
                  <div key={m.id} className={`milestone-card ${isUpcoming ? "upcoming" : ""}`}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span className={`milestone-badge ${isUpcoming ? "pending" : "achieved"}`}>
                          {isUpcoming ? "⚡ Target Milestone" : "✓ Achieved"}
                        </span>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                          <span suppressHydrationWarning>{formatDateTime(m.occurred_at)}</span>
                        </div>
                      </div>
                      <div className="row-title" style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        {m.title}
                      </div>
                      {m.body_md && (
                        <div className="prose" style={{ fontSize: 12, color: "var(--ink-2)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {m.body_md}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                      <EditControls entry={m} edit={edit} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty" style={{ padding: "16px 0", fontSize: 13 }}>
            No target milestones set yet. Click <strong>+ Add milestone</strong> above to set key delivery checkpoints.
          </div>
        )}
      </div>

      {/* ─── Timeline Stream (Horizontal & Vertical View Modes) ─── */}
      <div>
        <div className="timeline-view-header">
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
              Timeline Stream
            </h4>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={`button ghost small ${viewMode === "horizontal" ? "active" : ""}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setViewMode("horizontal")}
              type="button"
            >
              Horizontal Axis
            </button>
            <button
              className={`button ghost small ${viewMode === "vertical" ? "active" : ""}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setViewMode("vertical")}
              type="button"
            >
              Vertical List
            </button>
          </div>
        </div>

        {viewMode === "horizontal" ? (
          <div className="scroll-track-container">
            {entries.length > 0 && (
              <>
                <button
                  className="scroll-btn left"
                  onClick={() => scrollContainer(timelineTrackRef, "left")}
                  title="Scroll left"
                  type="button"
                >
                  ‹
                </button>
                <button
                  className="scroll-btn right"
                  onClick={() => scrollContainer(timelineTrackRef, "right")}
                  title="Scroll right"
                  type="button"
                >
                  ›
                </button>
              </>
            )}
            <div className="timeline-horizontal-container" ref={timelineTrackRef}>
              <div className="timeline-axis-line" />
              <div className="timeline-horizontal-track">
                {entries.map((entry) => (
                  <div key={entry.id} className="timeline-h-item">
                    <div className={`timeline-h-node ${entry.type === "milestone" ? "milestone" : ""}`} />
                    <div className="timeline-h-card">
                      <div>
                        <div className="timeline-meta" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span suppressHydrationWarning>{formatDateTime(entry.occurred_at)}</span>
                          <StatusPill value={entry.type} />
                        </div>
                        <div className="row-title" style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                          {entry.title}
                        </div>
                        {entry.body_md && (
                          <div className="prose" style={{ fontSize: 12, color: "var(--ink-2)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {entry.body_md}
                          </div>
                        )}
                        {entry.decision_outcome && (
                          <div className="prose" style={{ fontSize: 12, marginTop: 4, color: "var(--muted)" }}>
                            <strong>Outcome:</strong> {entry.decision_outcome}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                        <EditControls entry={entry} edit={edit} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="timeline">
            {entries.map((entry) => (
              <div key={entry.id} className="timeline-item">
                <div className="timeline-meta">
                  {entry.type === "milestone" && (
                    <span style={{ marginRight: 6 }}>
                      <StatusPill value="milestone" />
                    </span>
                  )}
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                  <span suppressHydrationWarning>{formatDateTime(entry.occurred_at)}</span> · {entry.type.replaceAll("_", " ")}
                </div>
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
        )}
      </div>
    </div>
  );
}
