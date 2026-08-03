"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "scope", label: "Scope" },
  { key: "proposal", label: "Proposal" },
  { key: "finance", label: "Finance" },
  { key: "timeline", label: "Timeline" },
  { key: "tasks", label: "Tasks" },
  { key: "issues", label: "Issues" },
  { key: "decisions", label: "Decisions" },
  { key: "notes", label: "Notes" },
  { key: "documents", label: "Documents" },
  { key: "milestones", label: "Milestones" },
  { key: "records", label: "Records" },
] as const;

export function PhaseNav({ projectId, phaseId }: { projectId: string; phaseId: string }) {
  const pathname = usePathname();
  const root = `/projects/${projectId}/phases/${phaseId}`;

  return (
    <nav className="tabs" aria-label="Phase sections">
      {TABS.map((tab) => {
        const href = tab.key === "dashboard" ? root : `${root}/${tab.key}`;
        const active =
          tab.key === "dashboard" ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={tab.key} href={href} className={classNames("tab", active && "active")}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
