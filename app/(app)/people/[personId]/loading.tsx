export default function PersonDetailLoading() {
  return (
    <div className="stack">
      <div className="skeleton" style={{ height: 40, width: 220, marginBottom: 8 }} />
      <div className="section">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="row skeleton-row">
            <div className="skeleton" style={{ height: 18, flex: 1 }} />
            <div className="skeleton" style={{ height: 18, width: 80 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
