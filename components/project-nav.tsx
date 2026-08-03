"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "documents", label: "Documents" },
  { key: "decisions", label: "Decisions" },
  { key: "finances", label: "Finances" },
  { key: "milestones", label: "Milestones" },
  { key: "participants", label: "Participants" },
  { key: "phases", label: "Phases" },
] as const;

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const root = `/projects/${projectId}`;

  return (
    <nav className="tabs" aria-label="Project sections">
      {TABS.map((tab) => {
        const href = tab.key === "overview" ? root : `${root}/${tab.key}`;
        const active =
          tab.key === "overview"
            ? pathname === root
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={tab.key} href={href} className={classNames("tab", active && "active")}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
