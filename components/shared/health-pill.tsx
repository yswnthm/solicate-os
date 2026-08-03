import { classNames } from "@/lib/utils";
import { phaseHealth, type PhaseTone } from "@/lib/phase-metrics";

export function HealthPill({ tone, label }: { tone: PhaseTone; label: string }) {
  return <span className={classNames("pill", `health-${tone}`)}>{label}</span>;
}

export function PhaseHealthPill({
  phase,
  tasks,
  issues,
}: {
  phase: { status: string };
  tasks: { status: string; due_at: string | null }[];
  issues: { status: string; severity: string }[];
}) {
  const { label, tone } = phaseHealth({ status: phase.status, tasks, issues });
  return <HealthPill tone={tone} label={label} />;
}
