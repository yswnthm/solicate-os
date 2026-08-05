"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_CONFIG: Record<string, { icon: string; shortcut?: string }> = {
  "/today": { icon: "◈", shortcut: "G T" },
  "/inbox": { icon: "⬡", shortcut: "G I" },
  "/projects": { icon: "◻", shortcut: "G P" },
  "/clients": { icon: "◑", shortcut: "G C" },
  "/people": { icon: "◎", shortcut: "G U" },
  "/search": { icon: "⌕", shortcut: "G S" },
  "/guide": { icon: "?", shortcut: "G ?" },
  "/settings": { icon: "⚙" },
};

export function NavLink({
  href,
  children,
  count,
}: {
  href: string;
  children: React.ReactNode;
  count?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/" && pathname.startsWith(href)) ||
    (href === "/people" && (pathname.startsWith("/clients") || pathname.startsWith("/relationships")));
  const config = NAV_CONFIG[href] ?? { icon: "·" };

  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? "active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="nav-icon">{config.icon}</span>
      <span className="nav-label">{children}</span>
      {config.shortcut && <span className="nav-shortcut">{config.shortcut}</span>}
      {count !== undefined && count > 0 && (
        <span className="nav-count" aria-label={`${count} items to triage`}>
          {count}
        </span>
      )}
    </Link>
  );
}

