export default function Loading() {
  return (
    <div className="stack">
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 8 }} />
      <div className="section">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="row skeleton-row">
            <div className="skeleton" style={{ height: 18, flex: 1 }} />
            <div className="skeleton" style={{ height: 18, width: 80 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
