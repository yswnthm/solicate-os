"use client";

import { Search } from "lucide-react";

export function SearchTriggerButton() {
  return (
    <button
      type="button"
      className="sidebar-search-trigger"
      onClick={() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        );
      }}
    >
      <span className="search-icon">
        <Search size={14} />
      </span>
      <span className="search-text">Search...</span>
      <kbd className="search-kbd">⌘K</kbd>
    </button>
  );
}
