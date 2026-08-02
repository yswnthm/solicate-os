import { NavLink } from "@/components/nav-link";
import { signOut } from "@/features/actions";
import { CommandMenu } from "@/components/command-menu";
import { SearchTriggerButton } from "@/components/search-trigger-button";

export function AppShell({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  const userInitial = (displayName || "U").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <CommandMenu />
      <aside className="sidebar">
        {/* Workspace Brand Header */}
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-info">
            <div className="brand-text">Solicate OS</div>
            <div className="brand-sub">Agency Ops</div>
          </div>
          <div className="brand-chevron">▾</div>
        </div>

        {/* Quick Search / Command Palette Trigger */}
        <SearchTriggerButton />

        {/* Primary Navigation */}
        <nav className="nav" aria-label="Primary navigation">
          <span className="nav-section-label">Workspace</span>
          <NavLink href="/today">Today</NavLink>
          <NavLink href="/inbox">Inbox</NavLink>
          <NavLink href="/projects">Projects</NavLink>

          <span className="nav-section-label">People</span>
          <NavLink href="/clients">Clients</NavLink>
          <NavLink href="/people">People</NavLink>

          <span className="nav-section-label">Retrieve</span>
          <NavLink href="/search">Search</NavLink>
        </nav>

        {/* Sidebar Footer with User Profile */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">Internal user</span>
            </div>
          </div>
          <div className="sidebar-footer-actions">
            <NavLink href="/settings">Settings</NavLink>
            <form action={signOut} className="signout-form">
              <button type="submit" className="signout-btn">
                <span className="nav-icon">⎋</span>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

