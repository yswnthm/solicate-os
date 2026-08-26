"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Inbox,
  FolderKanban,
  Building2,
  Users,
  Wallet,
  Search,
  BookOpen,
  Settings,
  LucideIcon,
} from "lucide-react";

const NAV_CONFIG: Record<string, { icon: LucideIcon; shortcut?: string }> = {
  "/today": { icon: CalendarDays, shortcut: "G T" },
  "/inbox": { icon: Inbox, shortcut: "G I" },
  "/projects": { icon: FolderKanban, shortcut: "G P" },
  "/solicate": { icon: Building2, shortcut: "G A" },
  "/clients": { icon: Building2, shortcut: "G C" },
  "/people": { icon: Users, shortcut: "G U" },
  "/finance": { icon: Wallet, shortcut: "G F" },
  "/search": { icon: Search, shortcut: "G S" },
  "/guide": { icon: BookOpen, shortcut: "G ?" },
  "/settings": { icon: Settings },
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
  const config = NAV_CONFIG[href];
  const IconComponent = config?.icon;

  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? "active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="nav-icon">
        {IconComponent ? <IconComponent size={18} strokeWidth={2} /> : null}
      </span>
      <span className="nav-label">{children}</span>
      {config?.shortcut && <span className="nav-shortcut">{config.shortcut}</span>}
      {count !== undefined && count > 0 && (
        <span className="nav-count" aria-label={`${count} items to triage`}>
          {count}
        </span>
      )}
    </Link>
  );
}

