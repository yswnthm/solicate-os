export default function Loading() {
  return (
    <div className="stack">
      <div className="skeleton" style={{ height: 40, width: 120, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <div className="skeleton" style={{ height: 36, flex: 1 }} />
        <div className="skeleton" style={{ height: 36, width: 80 }} />
      </div>
    </div>
  );
}
