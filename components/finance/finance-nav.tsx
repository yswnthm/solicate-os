"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "transactions", label: "Ledger" },
  { key: "invoices", label: "Invoices" },
] as const;

export function FinanceNav() {
  const pathname = usePathname();
  const root = `/finance`;

  return (
    <nav className="tabs" aria-label="Finance sections">
      {TABS.map((tab) => {
        const href = `${root}/${tab.key}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={tab.key} href={href} className={classNames("tab", active && "active")}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
