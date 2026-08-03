import Link from "next/link";
import { signOut } from "@/features/actions";
import { CommandMenu } from "@/components/command-menu";
import { SearchTriggerButton } from "@/components/search-trigger-button";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { NavLink } from "@/components/nav-link";
import { SidebarToggle } from "@/components/sidebar-toggle";
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

      {/* Persistent Sidebar */}
      <aside className="sidebar">
        <Link href="/today" className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-text">Solicate</div>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink href="/today">Today</NavLink>
          <NavLink href="/inbox" count={inboxCount}>
            Inbox
          </NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/clients">Clients</NavLink>
          <NavLink href="/relationships">Relationships</NavLink>
          <NavLink href="/people">People</NavLink>
          <NavLink href="/guide">Guide</NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink href="/settings">Settings</NavLink>
          <div className="user-menu">
            <div className="user-avatar">{userInitial}</div>
            <span className="user-name">{displayName}</span>
            <form action={signOut} style={{ display: "flex" }}>
              <button type="submit" className="signout-btn" title="Sign out">
                ⎋
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="shell-main">
        <header className="top-nav">
          <SidebarToggle />
          <div style={{ flex: 1, maxWidth: "480px" }}>
            <SearchTriggerButton />
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
