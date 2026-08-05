"use client";

import { useState } from "react";

export function Section({
  title,
  count,
  action,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="section">
      <div
        className="section-title"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="button ghost small"
            style={{
              padding: "2px 6px",
              fontSize: 11,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 22,
              height: 22,
              borderRadius: 4,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            aria-label={isOpen ? "Collapse section" : "Expand section"}
          >
            {isOpen ? "▼" : "▶"}
          </button>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {typeof count === "number" && <span>{count}</span>}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
      {isOpen && <div>{children}</div>}
    </section>
  );
}
