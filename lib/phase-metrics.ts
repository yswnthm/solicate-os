// Phase health + progress. Health is derived purely from execution state so a
// phase answers "how is this going" without a manual field that drifts.
// Tone maps to `.pill.health-*` classes in globals.css.

export type PhaseTone = "at_risk" | "watch" | "on_track" | "complete";

export function phaseHealth(opts: {
  status: string;
  tasks: { status: string; due_at: string | null }[];
  issues: { status: string; severity: string }[];
}): { label: string; tone: PhaseTone } {
  if (opts.status === "completed" || opts.status === "cancelled") {
    return { label: opts.status === "completed" ? "Complete" : "Cancelled", tone: "complete" };
  }
  const openTasks = opts.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const openIssues = opts.issues.filter((i) => !["resolved", "accepted", "closed"].includes(i.status));
  const blocking = openIssues.some((i) => i.severity === "critical" || i.severity === "high");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = openTasks.some((t) => t.due_at && t.due_at < today);
  if (blocking || overdue) return { label: "At risk", tone: "at_risk" };
  if (openIssues.length > 0) return { label: "Watch", tone: "watch" };
  if (openTasks.length > 0) return { label: "On track", tone: "on_track" };
  return { label: "No open work", tone: "on_track" };
}

export function phaseProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done" || t.status === "cancelled").length;
  return Math.round((done / tasks.length) * 100);
}
