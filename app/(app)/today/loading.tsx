export default function TodayLoading() {
  return (
    <div className="stack">
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 8 }} />
      <div className="grid two" style={{ marginBottom: 4 }}>
        <div className="skeleton card" style={{ height: 80 }} />
        <div className="skeleton card" style={{ height: 80 }} />
        <div className="skeleton card" style={{ height: 80 }} />
      </div>
      <div className="section">
        <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 12 }} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="row skeleton-row">
            <div className="skeleton" style={{ height: 20, width: 60 }} />
            <div className="skeleton" style={{ height: 20, flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
