"use client";

// Mobile drawer toggle: slides the sidebar in/out on <900px viewports.
export function SidebarToggle() {
  return (
    <button
      type="button"
      className="nav-toggle"
      aria-label="Toggle navigation"
      aria-expanded="false"
      onClick={() => document.body.classList.toggle("sidebar-open")}
    >
      ☰
    </button>
  );
}
