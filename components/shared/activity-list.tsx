import { formatDateTime } from "@/lib/utils";

export type ActivityEvent = {
  id: string;
  event_type: string;
  summary: string;
  occurred_at: string;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  created: "var(--success)",
  completed: "var(--success)",
  resolved: "var(--success)",
  accepted: "var(--success)",
  updated: "var(--warning)",
  archived: "var(--muted-2)",
  cancelled: "var(--danger)",
};

export function ActivityList({ events }: { events: ActivityEvent[] }) {
  if (!events.length) {
    return <div className="empty">Meaningful work changes will appear here as you operate.</div>;
  }

  return (
    <div className="activity-compact-list">
      {events.map((event) => {
        const dotColor = EVENT_TYPE_COLORS[event.event_type] || "var(--muted-2)";
        return (
          <div key={event.id} className="activity-compact-item">
            <span className="activity-dot" style={{ backgroundColor: dotColor }} title={event.event_type} />
            <div className="activity-summary">{event.summary}</div>
            <div className="activity-time">{formatDateTime(event.occurred_at)}</div>
          </div>
        );
      })}
    </div>
  );
}
