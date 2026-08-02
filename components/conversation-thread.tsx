"use client";

import { useOptimistic, useTransition, useRef, useState } from "react";
import { createMessage, addConversationParticipant } from "@/features/actions";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  body_md: string;
  sent_at: string;
  direction: string;
  people?: { name: string } | null;
  app_users?: { display_name: string } | null;
};

type Person = { id: string; name: string };

export function ConversationThread({
  conversationId,
  projectId,
  initialMessages,
  people,
}: {
  conversationId: string;
  projectId: string;
  initialMessages: ThreadMessage[];
  people: Person[];
}) {
  const [messages, addOptimistic] = useOptimistic(initialMessages, (state, next: ThreadMessage) => [
    ...state,
    next,
  ]);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const senderLabel = (m: ThreadMessage) =>
    m.people?.name ?? m.app_users?.display_name ?? (m.direction === "inbound" ? "Inbound" : "You");

  const sorted = [...messages].sort((a, b) => a.sent_at.localeCompare(b.sent_at));

  const logMessage = (formData: FormData) => {
    const direction = String(formData.get("direction") ?? "inbound");
    const body = String(formData.get("body_md") ?? "").trim();
    if (!body) return;
    const personId = String(formData.get("sender_person_id") ?? "");
    const sender =
      direction === "inbound" ? people.find((p) => p.id === personId)?.name ?? "Inbound" : "You";
    addOptimistic({
      id: crypto.randomUUID(),
      body_md: body,
      sent_at: new Date().toISOString(),
      direction,
      people: direction === "inbound" ? { name: sender } : null,
      app_users: direction === "outbound" ? { display_name: sender } : null,
    });
    formRef.current?.reset();
    startTransition(async () => {
      setPending(true);
      try {
        await createMessage(formData);
      } finally {
        setPending(false);
      }
    });
  };

  return (
    <div
      className="stack"
      style={{
        padding: "16px 20px",
        border: "1px solid var(--line)",
        borderTop: "none",
        borderRadius: "0 0 8px 8px",
        background: "var(--surface)",
      }}
    >
      <div className="stack" style={{ gap: 10 }}>
        {sorted.length ? (
          sorted.map((m) => (
            <div
              key={m.id}
              className={`thread-bubble ${m.direction === "outbound" ? "out" : "in"}`}
            >
              <div className="thread-bubble-meta">
                <StatusPill value={m.direction} />
                <span>{senderLabel(m)} · {formatDateTime(m.sent_at)}</span>
              </div>
              <div className="prose thread-bubble-body">{m.body_md}</div>
            </div>
          ))
        ) : (
          <div className="empty" style={{ padding: "12px 0" }}>
            No messages yet. Log the first one below.
          </div>
        )}
      </div>

      <form
        ref={formRef}
        className="form"
        action={logMessage}
        style={{ marginTop: 12, gap: 12, borderTop: "1px solid var(--line-2)", paddingTop: 16 }}
      >
        <input type="hidden" name="conversation_id" value={conversationId} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="sent_at" value="" />
        <div className="form-grid">
          <div className="field">
            <label>Direction</label>
            <select name="direction" defaultValue="inbound">
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
          <div className="field">
            <label>Sender (inbound)</label>
            <select name="sender_person_id">
              <option value="">Choose person</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Message</label>
          <textarea
            name="body_md"
            required
            placeholder="Paste or type the message"
            style={{ minHeight: 64 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="button small" type="submit" disabled={pending}>
            {pending ? "Logging…" : "Log message"}
          </button>
          <AddPersonButton conversationId={conversationId} projectId={projectId} people={people} />
        </div>
      </form>
    </div>
  );
}

function AddPersonButton({
  conversationId,
  projectId,
  people,
}: {
  conversationId: string;
  projectId: string;
  people: Person[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="button ghost small" onClick={() => setOpen(true)}>
        + Add person
      </button>
    );
  }

  return (
    <form
      className="inline-form"
      action={addConversationParticipant}
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="project_id" value={projectId} />
      <select name="person_id" required style={{ width: 160 }}>
        <option value="">Choose</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <button className="button secondary small" type="submit">
        Add
      </button>
    </form>
  );
}
