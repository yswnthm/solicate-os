"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "templates", label: "Templates" },
  { key: "models", label: "Models" },
  { key: "providers", label: "Provider keys" },
] as const;

export function AiNav() {
  const pathname = usePathname();
  const root = `/settings/ai`;

  return (
    <nav className="tabs" aria-label="AI sections">
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
