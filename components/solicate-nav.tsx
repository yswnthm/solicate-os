"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "services", label: "Services" },
  { key: "phases", label: "Phases" },
  { key: "team", label: "Team" },
] as const;

export function SolicateNav() {
  const pathname = usePathname();
  const root = `/solicate`;

  return (
    <nav className="tabs" aria-label="Solicate sections">
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
