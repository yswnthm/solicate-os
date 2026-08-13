"use client";

import { PanelLeft } from "lucide-react";

// Mobile drawer toggle: slides the sidebar in/out on <900px viewports.
export function SidebarToggle() {
  return (
    <button
      type="button"
      className="nav-toggle"
      aria-label="Toggle navigation"
      aria-expanded="false"
      onClick={() => {
        if (window.innerWidth < 900) {
          document.body.classList.toggle("sidebar-open");
        } else {
          document.body.classList.toggle("desktop-sidebar-collapsed");
        }
      }}
    >
      <PanelLeft size={18} />
    </button>
  );
}
