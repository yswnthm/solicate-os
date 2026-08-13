"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Inbox, FolderKanban, Search, Wallet } from "lucide-react";

export function MobileBottomNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/today",
      label: "Today",
      icon: Calendar,
      isActive: pathname === "/today",
    },
    {
      href: "/inbox",
      label: "Inbox",
      icon: Inbox,
      badge: inboxCount > 0 ? inboxCount : null,
      isActive: pathname === "/inbox",
    },
    {
      href: "/projects",
      label: "Projects",
      icon: FolderKanban,
      isActive: pathname.startsWith("/projects"),
    },
    {
      href: "/finance",
      label: "Finance",
      icon: Wallet,
      isActive: pathname.startsWith("/finance"),
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      isActive: pathname === "/search",
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${item.isActive ? "active" : ""}`}
              aria-current={item.isActive ? "page" : undefined}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={20} strokeWidth={item.isActive ? 2.3 : 1.8} />
                {item.badge ? (
                  <span className="mobile-nav-badge">{item.badge > 99 ? "99+" : item.badge}</span>
                ) : null}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
