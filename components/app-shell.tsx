import Link from "next/link";
import { CaptureFAB } from "@/components/capture-fab";
import { LogOut } from "lucide-react";
import { signOut } from "@/features/actions";
import { CommandMenu } from "@/components/command-menu";
import { SearchTriggerButton } from "@/components/search-trigger-button";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { NavLink } from "@/components/nav-link";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { getActiveClients, getProjects } from "@/features/queries";

export async function AppShell({
  children,
  displayName,
  inboxCount,
}: {
  children: React.ReactNode;
  displayName: string;
  inboxCount: number;
}) {
  const [projects, clients] = await Promise.all([getProjects(), getActiveClients()]);
  const userInitial = (displayName || "U").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <CommandMenu projects={projects} clients={clients} />
      <KeyboardShortcuts />

      {/* Floating Dynamic Island */}
      <header className="top-nav">
        <SidebarToggle />
        <div style={{ width: "320px" }}>
          <SearchTriggerButton />
        </div>
        <ThemeToggle />
      </header>

      {/* Floating Sidebar Island */}
      <aside className="sidebar">
        <Link href="/today" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="By Order" className="brand-logo" />
          <div className="brand-text">By Order</div>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink href="/today">Today</NavLink>
          <NavLink href="/inbox">
            Inbox
          </NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/solicate">Agency</NavLink>
          <NavLink href="/people">People & Relationships</NavLink>
          <NavLink href="/finance">Finance</NavLink>

          <NavLink href="/guide">Guide</NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink href="/settings">Settings</NavLink>
          <div className="user-menu">
            <div className="user-avatar">{userInitial}</div>
            <span className="user-name">{displayName}</span>
            <form action={signOut} style={{ display: "flex" }}>
              <button type="submit" className="signout-btn" title="Sign out">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Global Capture FAB */}
      <CaptureFAB projects={projects} />

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav inboxCount={inboxCount} />

      {/* Main column */}
      <div className="shell-main">
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
