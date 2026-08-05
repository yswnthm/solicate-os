"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "templates", label: "Templates", href: "/ai/templates" },
  { key: "settings", label: "Settings", href: "/ai/settings" },
] as const;

export function AiNav() {
  const pathname = usePathname();
  return (
    <nav className="tabs" aria-label="AI sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.key} href={tab.href} className={classNames("tab", active && "active")}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
