export function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2>{title}</h2>
          {typeof count === "number" && <span>{count}</span>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}
