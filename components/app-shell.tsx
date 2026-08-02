import Link from "next/link";
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
      
      {/* Top Header Navigation */}
      <header className="top-nav">
        <Link href="/today" className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-text">Solicate OS</div>
        </Link>

        {/* Global Search / Command Menu Trigger */}
        <div style={{ flex: 1, maxWidth: "480px", margin: "0 24px" }}>
          <SearchTriggerButton />
        </div>

        <div className="nav-actions">
          {/* User Profile */}
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
      </header>

      {/* Main Content Dashboard */}
      <main className="main">{children}</main>
    </div>
  );
}
