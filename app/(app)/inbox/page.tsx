export const dynamic = "force-dynamic";
import Link from "next/link";

import { dismissInboxEntry, dismissInboxMessage, fileInboxEntry, fileInboxMessage } from "@/features/actions";
import { getInboxData } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";

export default async function InboxPage() {
  const { messages, entries } = await getInboxData();
  const total = messages.length + entries.length;

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Triage incoming messages and quick captures. File them into the project record or dismiss."
      >
        {total > 0 && (
          <span className="pill" style={{ fontSize: 13 }}>
            {total} untriaged
          </span>
        )}
      </PageHeader>

      {total === 0 && (
        <div className="empty" style={{ marginTop: 0 }}>
          Inbox is clear. Nothing needs triage right now.
        </div>
      )}

      {/* Captures and entries */}
      {entries.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Captures</h2>
            <span>{entries.length} untriaged</span>
          </div>
          <div className="list">
            {entries.map((entry: any) => (
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
                  <form className="inline-form" action={fileInboxEntry}>
                    <input type="hidden" name="entry_id" value={entry.id} />
                    <button className="button small" type="submit" title="Mark as filed">
                      File
                    </button>
                  </form>
                  <form className="inline-form" action={dismissInboxEntry}>
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

      {/* Messages */}
      {messages.length > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Messages</h2>
            <span>{messages.length} untriaged</span>
          </div>
          <div className="list">
            {messages.map((message: any) => (
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
                  <form className="inline-form" action={fileInboxMessage}>
                    <input type="hidden" name="message_id" value={message.id} />
                    <button className="button small" type="submit">
                      File
                    </button>
                  </form>
                  <form className="inline-form" action={dismissInboxMessage}>
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
