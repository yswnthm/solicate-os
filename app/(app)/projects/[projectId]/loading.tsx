export default function Loading() {
  return (
    <div className="stack">
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 16 }} />
      <div className="grid two" style={{ marginBottom: 8 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton card" style={{ height: 80 }} />
        ))}
      </div>
      <div className="section">
        <div className="skeleton" style={{ height: 20, width: 80, marginBottom: 12 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="row skeleton-row">
            <div className="skeleton" style={{ height: 18, flex: 1 }} />
            <div className="skeleton" style={{ height: 18, width: 60 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
