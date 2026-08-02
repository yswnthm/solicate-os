"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";

import { dismissInboxEntry, dismissInboxMessage, fileInboxEntry, fileInboxMessage } from "@/features/actions";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";

type InboxState = { entries: any[]; messages: any[] };
type Removed = { kind: "entry" | "message"; id: string };

export function InboxList({ entries, messages }: InboxState) {
  const [optimistic, addOptimistic] = useOptimistic(
    { entries, messages },
    (state: InboxState, removed: Removed): InboxState => ({
      entries: removed.kind === "entry" ? state.entries.filter((e) => e.id !== removed.id) : state.entries,
      messages: removed.kind === "message" ? state.messages.filter((m) => m.id !== removed.id) : state.messages,
    }),
  );
  const [, startTransition] = useTransition();

  const run = (removed: Removed, formData: FormData, action: (fd: FormData) => Promise<void>) => {
    addOptimistic(removed);
    startTransition(async () => {
      await action(formData);
    });
  };

  const total = optimistic.entries.length + optimistic.messages.length;

  if (total === 0) {
    return (
      <div className="empty" style={{ marginTop: 0 }}>
        Inbox is clear. Nothing needs triage right now.
      </div>
    );
  }

  return (
    <>
      {optimistic.entries.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Captures</h2>
            <span>{optimistic.entries.length} untriaged</span>
          </div>
          <div className="list">
            {optimistic.entries.map((entry: any) => (
              <div className="row" key={entry.id}>
                <StatusPill value={entry.type} />
                <div className="row-main">
                  <div className="row-title">{entry.title}</div>
                  <div className="row-meta">
                    {entry.projects?.name ?? "No project"} · {formatDateTime(entry.occurred_at)}
                  </div>
                </div>
                <div className="row-actions-always">
                  {entry.project_id && (
                    <Link className="button secondary small" href={`/projects/${entry.project_id}`}>
                      Open project
                    </Link>
                  )}
                  <form
                    className="inline-form"
                    action={(fd) => run({ kind: "entry", id: entry.id }, fd, fileInboxEntry)}
                  >
                    <input type="hidden" name="entry_id" value={entry.id} />
                    <button className="button small" type="submit" title="Mark as filed">
                      File
                    </button>
                  </form>
                  <form
                    className="inline-form"
                    action={(fd) => run({ kind: "entry", id: entry.id }, fd, dismissInboxEntry)}
                  >
                    <input type="hidden" name="entry_id" value={entry.id} />
                    <button className="button ghost small" type="submit" title="Dismiss">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {optimistic.messages.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Messages</h2>
            <span>{optimistic.messages.length} untriaged</span>
          </div>
          <div className="list">
            {optimistic.messages.map((message: any) => (
              <div className="row" key={message.id}>
                <StatusPill value="message" />
                <div className="row-main">
                  <div className="row-title">
                    {message.conversations?.title ?? "Conversation"}
                  </div>
                  <div className="row-meta">
                    {formatDateTime(message.sent_at)} · {message.body_md.slice(0, 140)}
                  </div>
                </div>
                <div className="row-actions-always">
                  {message.conversations?.project_id && (
                    <Link
                      className="button secondary small"
                      href={`/projects/${message.conversations.project_id}`}
                    >
                      Open project
                    </Link>
                  )}
                  <form
                    className="inline-form"
                    action={(fd) => run({ kind: "message", id: message.id }, fd, fileInboxMessage)}
                  >
                    <input type="hidden" name="message_id" value={message.id} />
                    <button className="button small" type="submit">
                      File
                    </button>
                  </form>
                  <form
                    className="inline-form"
                    action={(fd) => run({ kind: "message", id: message.id }, fd, dismissInboxMessage)}
                  >
                    <input type="hidden" name="message_id" value={message.id} />
                    <button className="button ghost small" type="submit">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
