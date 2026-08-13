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
          <span
            style={{
              fontSize: 10,
              color: "var(--muted)",
              display: "inline-block",
              transition: "transform 150ms ease",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {typeof count === "number" && <span>({count})</span>}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
      {isOpen && <div>{children}</div>}
    </section>
  );
}
