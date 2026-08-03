"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";

import {
  createClient,
  createConversation,
  createEntry,
  createIssue,
  createPerson,
  createProject,
  createRelationship,
  createTask,
  updateProjectStatus,
} from "@/features/actions";
import { quickSearch } from "@/features/search";

type PaletteMode =
  | "command"
  | "project"
  | "client"
  | "person"
  | "task"
  | "issue"
  | "record"
  | "conversation"
  | "relationship";

type Project = {
  id: string;
  name: string;
  code?: string | null;
  status: string;
  clients?: Array<{ name: string }> | { name: string } | null;
};

const clientName = (c: Project["clients"]) =>
  Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null;

type Client = { id: string; name: string };

const MODE_TITLES: Record<Exclude<PaletteMode, "command">, string> = {
  project: "New project",
  client: "New client",
  person: "New person",
  task: "Add task",
  issue: "Log issue",
  record: "Log project record",
  conversation: "New conversation",
  relationship: "New relationship",
};

export function CommandMenu({ projects, clients }: { projects: Project[]; clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>("command");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{
    entries: any[];
    messages: any[];
    projects: any[];
    people: any[];
  }>({ entries: [], messages: [], projects: [], people: [] });
  const [searching, setSearching] = useState(false);
  const searchIdRef = useRef(0);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Contextual actions: on a project page, offer create actions pre-scoped to it.
  const context = (() => {
    const projectMatch = pathname.match(/^\/projects\/([0-9a-f-]{36})/);
    if (projectMatch) {
      const project = projects.find((p) => p.id === projectMatch[1]);
      return { projectId: projectMatch[1], projectName: project?.name ?? "this project" };
    }
    const clientMatch = pathname.match(/^\/clients\/([0-9a-f-]{36})/);
    if (clientMatch) {
      const client = clients.find((c) => c.id === clientMatch[1]);
      return { clientId: clientMatch[1], clientName: client?.name ?? "this client" };
    }
    return null;
  })();

  const currentStatus = context?.projectId
    ? projects.find((p) => p.id === context.projectId)?.status ?? null
    : null;

  const openInMode = useCallback((next: PaletteMode) => {
    setMode(next);
    setSearch("");
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K toggles the palette; ⌘⇧X opens the AI Capture flow.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && (e.key === "X" || e.key === "x")) {
        e.preventDefault();
        setOpen(false);
        router.push("/capture");
        return;
      }
      if (mod && e.key === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (o) setMode("command");
          return !o;
        });
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [openInMode, router]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const setProjectStatus = (next: string) => {
    const projectId = context?.projectId;
    if (!projectId) return;
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("status", next);
    setOpen(false);
    startTransition(async () => {
      await updateProjectStatus(formData);
    });
  };

  // Debounced live search while in command mode.
  useEffect(() => {
    if (!open || mode !== "command" || search.trim().length < 2) {
      setSearching(false);
      setResults({ entries: [], messages: [], projects: [], people: [] });
      return;
    }
    const query = search.trim();
    const id = ++searchIdRef.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const next = await quickSearch(query);
        if (searchIdRef.current === id) {
          setResults(next);
          setSearching(false);
        }
      } catch {
        if (searchIdRef.current === id) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
    };
  }, [search, open, mode]);

  const reset = () => {
    setSearch("");
    setMode("command");
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const recents = projects.slice(0, 5);
  const showResults = search.trim().length >= 2;

  const closeAfterSubmit = () => setTimeout(() => setOpen(false), 120);

  return (
    <>
      {open && <div className="cmdk-overlay" onClick={() => setOpen(false)} />}
      <Command.Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            reset();
          }
          setOpen(o);
        }}
        label="Global Command Menu"
        className="cmdk-dialog"
      >
        {mode === "command" ? (
          <>
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command, project, or search…"
              className="cmdk-input"
            />
            <Command.List className="cmdk-list">
              <Command.Empty className="cmdk-empty">
                {showResults ? `No matches for “${search}”.` : "No results found."}
              </Command.Empty>

              {context?.projectId && (
                <Command.Group heading={`Actions for ${context.projectName}`} className="cmdk-group-heading">
                  <Command.Item
                    className="cmdk-item"
                    onSelect={() => openInMode("task")}
                  >
                    <span className="cmdk-icon">☑</span>
                    <span className="cmdk-item-main">
                      <span>Add task to {context.projectName}</span>
                      <span className="cmdk-sub">New task, pre-scoped to this project</span>
                    </span>
                  </Command.Item>
                  <Command.Item className="cmdk-item" onSelect={() => openInMode("issue")}>
                    <span className="cmdk-icon">⚠</span>
                    <span className="cmdk-item-main">
                      <span>Log issue on {context.projectName}</span>
                      <span className="cmdk-sub">Problem or risk, pre-scoped to this project</span>
                    </span>
                  </Command.Item>
                  <Command.Item className="cmdk-item" onSelect={() => openInMode("record")}>
                    <span className="cmdk-icon">§</span>
                    <span className="cmdk-item-main">
                      <span>Log record on {context.projectName}</span>
                      <span className="cmdk-sub">Note, decision, meeting, milestone…</span>
                    </span>
                  </Command.Item>
                  <ProjectStatusCommands status={currentStatus} onChange={setProjectStatus} />
                </Command.Group>
              )}

              {context?.clientId && (
                <Command.Group heading={`Actions for ${context.clientName}`} className="cmdk-group-heading">
                  <Command.Item className="cmdk-item" onSelect={() => openInMode("conversation")}>
                    <span className="cmdk-icon">◍</span>
                    <span className="cmdk-item-main">
                      <span>New conversation for {context.clientName}</span>
                      <span className="cmdk-sub">WhatsApp, email, or manual thread</span>
                    </span>
                  </Command.Item>
                </Command.Group>
              )}

              {showResults && (
                <Command.Group heading="Search results" className="cmdk-group-heading">
                  {results.projects.slice(0, 4).map((p: any) => (
                    <Command.Item key={`p-${p.id}`} className="cmdk-item" onSelect={() => go(`/projects/${p.id}`)}>
                      <span className="cmdk-icon">◻</span>
                      <span className="cmdk-item-main">
                        <span>{p.name}</span>
                        <span className="cmdk-sub">
                          {clientName(p.clients) ?? "Project"} · {p.status}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                  {results.people.slice(0, 3).map((person: any) => (
                    <Command.Item key={`pe-${person.id}`} className="cmdk-item" onSelect={() => go("/people")}>
                      <span className="cmdk-icon">◎</span>
                      <span className="cmdk-item-main">
                        <span>{person.name}</span>
                        <span className="cmdk-sub">{person.email || (person.is_partner ? "Partner" : "Person")}</span>
                      </span>
                    </Command.Item>
                  ))}
                  {results.entries.slice(0, 4).map((e: any) => (
                    <Command.Item
                      key={`e-${e.id}`}
                      className="cmdk-item"
                      onSelect={() => go(e.project_id ? `/projects/${e.project_id}` : "/inbox")}
                    >
                      <span className="cmdk-icon">·</span>
                      <span className="cmdk-item-main">
                        <span>{e.title}</span>
                        <span className="cmdk-sub">
                          {e.projects?.name ?? "Unsorted"} · {e.type}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                  {results.messages.slice(0, 4).map((m: any) => (
                    <Command.Item
                      key={`m-${m.id}`}
                      className="cmdk-item"
                      onSelect={() => go(m.conversations?.project_id ? `/projects/${m.conversations.project_id}` : "/inbox")}
                    >
                      <span className="cmdk-icon">◍</span>
                      <span className="cmdk-item-main">
                        <span>{m.conversations?.title ?? "Message"}</span>
                        <span className="cmdk-sub">{m.body_md.slice(0, 80)}</span>
                      </span>
                    </Command.Item>
                  ))}
                  {showResults && !searching && results.projects.length + results.people.length + results.entries.length + results.messages.length === 0 && (
                    <Command.Item className="cmdk-item" onSelect={() => go(`/search?q=${encodeURIComponent(search)}`)}>
                      <span className="cmdk-icon">⌕</span>
                      <span className="cmdk-item-main">
                        <span>Full search for “{search}”</span>
                        <span className="cmdk-sub">Open the search page with all results</span>
                      </span>
                    </Command.Item>
                  )}
                </Command.Group>
              )}

              {!showResults && recents.length > 0 && (
                <Command.Group heading="Recents" className="cmdk-group-heading">
                  {recents.map((p) => (
                    <Command.Item key={`r-${p.id}`} className="cmdk-item" onSelect={() => go(`/projects/${p.id}`)}>
                      <span className="cmdk-icon">◻</span>
                      <span className="cmdk-item-main">
                        <span>{p.name}</span>
                        <span className="cmdk-sub">
                          {clientName(p.clients) ?? "Project"} · {p.status}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {!showResults && (
                <>
                  <Command.Group heading="Go to" className="cmdk-group-heading">
                    <Command.Item className="cmdk-item" onSelect={() => go("/today")}>
                      <span className="cmdk-icon">◈</span>
                      <span className="cmdk-item-main"><span>Today</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/inbox")}>
                      <span className="cmdk-icon">⬡</span>
                      <span className="cmdk-item-main"><span>Inbox</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/projects")}>
                      <span className="cmdk-icon">◻</span>
                      <span className="cmdk-item-main"><span>Projects</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/clients")}>
                      <span className="cmdk-icon">◑</span>
                      <span className="cmdk-item-main"><span>Clients</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/relationships")}>
                      <span className="cmdk-icon">↗</span>
                      <span className="cmdk-item-main"><span>Relationships</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/people")}>
                      <span className="cmdk-icon">◎</span>
                      <span className="cmdk-item-main"><span>People</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/search")}>
                      <span className="cmdk-icon">⌕</span>
                      <span className="cmdk-item-main"><span>Search</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/ai/drafter")}>
                      <span className="cmdk-icon">✉</span>
                      <span className="cmdk-item-main">
                        <span>Message Drafter</span>
                        <span className="cmdk-sub">Draft a message to anyone on a project</span>
                      </span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/ai/templates")}>
                      <span className="cmdk-icon">▤</span>
                      <span className="cmdk-item-main"><span>AI templates</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/ai/models")}>
                      <span className="cmdk-icon">◉</span>
                      <span className="cmdk-item-main"><span>AI models</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/guide")}>
                      <span className="cmdk-icon">?</span>
                      <span className="cmdk-item-main"><span>Guide</span></span>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Create" className="cmdk-group-heading">
                    <Command.Item className="cmdk-item" onSelect={() => go("/capture")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main">
                        <span>Capture (AI)</span>
                        <span className="cmdk-sub">⌘⇧X · explain what happened, AI proposes the updates</span>
                      </span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => openInMode("project")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main"><span>New project</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => openInMode("client")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main"><span>New client</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => openInMode("relationship")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main"><span>New relationship</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => openInMode("person")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main"><span>New person</span></span>
                    </Command.Item>
                  </Command.Group>
                </>
              )}
            </Command.List>
          </>
        ) : (
          <CreateForm
            mode={mode}
            clients={clients}
            context={context}
            onBack={reset}
            onDone={closeAfterSubmit}
          />
        )}
      </Command.Dialog>
    </>
  );
}

function ProjectStatusCommands({
  status,
  onChange,
}: {
  status: string | null;
  onChange: (next: string) => void;
}) {
  if (!status) return null;
  const transitions: Record<string, { label: string; next: string }[]> = {
    active: [
      { label: "Pause project", next: "paused" },
      { label: "Complete project", next: "completed" },
      { label: "Archive project", next: "archived" },
    ],
    paused: [
      { label: "Reactivate project", next: "active" },
      { label: "Archive project", next: "archived" },
    ],
    completed: [{ label: "Archive project", next: "archived" }],
  };
  const options = transitions[status];
  if (!options) return null;
  return (
    <>
      {options.map((opt) => (
        <Command.Item key={opt.next} className="cmdk-item" onSelect={() => onChange(opt.next)}>
          <span className="cmdk-icon">↻</span>
          <span className="cmdk-item-main">
            <span>{opt.label}</span>
            <span className="cmdk-sub">Change project status</span>
          </span>
        </Command.Item>
      ))}
    </>
  );
}

function CreateForm({
  mode,
  clients,
  context,
  onBack,
  onDone,
}: {
  mode: Exclude<PaletteMode, "command">;
  clients: Client[];
  context: { projectId?: string; projectName?: string; clientId?: string; clientName?: string } | null;
  onBack: () => void;
  onDone: () => void;
}) {
  return (
    <div className="cmdk-form">
      <div className="cmdk-form-head">
        <button type="button" className="cmdk-back" onClick={onBack}>
          ← All commands
        </button>
        <span className="cmdk-form-title">{MODE_TITLES[mode]}</span>
      </div>

      {mode === "project" && (
        <form className="form" action={createProject} onSubmit={onDone}>
          <div className="field">
            <label htmlFor="palette-project-client">Client</label>
            <select id="palette-project-client" name="client_id" required autoFocus>
              <option value="">Choose client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="palette-project-name">Project name</label>
            <input id="palette-project-name" name="name" placeholder="Website redesign" required />
          </div>
          <div className="field">
            <label htmlFor="palette-project-code">Code (optional)</label>
            <input id="palette-project-code" name="code" placeholder="SOL-026" />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Create project
          </button>
          {clients.length === 0 && (
            <p className="notice" style={{ marginTop: 16 }}>
              No clients yet — add a client first, or use the clients page.
            </p>
          )}
        </form>
      )}

      {mode === "client" && (
        <form className="form" action={createClient} onSubmit={onDone}>
          <div className="field">
            <label htmlFor="palette-client-name">Client name</label>
            <input id="palette-client-name" name="name" placeholder="Acme Inc." required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="palette-client-kind">Type</label>
            <select id="palette-client-kind" name="kind">
              <option value="business">Business</option>
              <option value="person">Individual</option>
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Create client
          </button>
        </form>
      )}

      {mode === "relationship" && (
        <form className="form" action={createRelationship} onSubmit={onDone}>
          <div className="field">
            <label htmlFor="palette-relationship-client">Client</label>
            <select id="palette-relationship-client" name="client_id" required autoFocus>
              <option value="">Choose client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="palette-relationship-source">Source</label>
            <select id="palette-relationship-source" name="source">
              <option value="direct_outreach">Direct outreach</option>
              <option value="referral_partner">Referral partner</option>
              <option value="existing_client">Existing client</option>
              <option value="marketplace">Marketplace</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="palette-relationship-arrangement">Financial arrangement</label>
            <select id="palette-relationship-arrangement" name="financial_arrangement">
              <option value="none">None</option>
              <option value="referral_commission">Referral commission</option>
              <option value="revenue_share">Revenue share</option>
              <option value="delivery_split">Delivery split</option>
              <option value="fixed_fee">Fixed fee</option>
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Create relationship
          </button>
          {clients.length === 0 && (
            <p className="notice" style={{ marginTop: 16 }}>
              No clients yet — add a client first, or use the clients page.
            </p>
          )}
        </form>
      )}

      {mode === "person" && (
        <form className="form" action={createPerson} onSubmit={onDone}>
          <div className="field">
            <label htmlFor="palette-person-name">Person name</label>
            <input id="palette-person-name" name="name" placeholder="Komal Gupta" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="palette-person-email">Email (optional)</label>
            <input id="palette-person-email" name="email" type="email" placeholder="komal@acme.com" />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Add person
          </button>
        </form>
      )}

      {mode === "task" && context?.projectId && (
        <form className="form" action={createTask} onSubmit={onDone}>
          <input type="hidden" name="project_id" value={context.projectId} />
          <p className="muted" style={{ margin: 0 }}>
            Task will be filed under {context.projectName}.
          </p>
          <div className="field">
            <label htmlFor="palette-task-title">Task title</label>
            <input id="palette-task-title" name="title" placeholder="What needs to happen" required autoFocus />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="palette-task-priority">Priority</label>
              <select id="palette-task-priority" name="priority">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="palette-task-due">Due date</label>
              <input id="palette-task-due" name="due_at" type="date" />
            </div>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Add task
          </button>
        </form>
      )}

      {mode === "issue" && context?.projectId && (
        <form className="form" action={createIssue} onSubmit={onDone}>
          <input type="hidden" name="project_id" value={context.projectId} />
          <p className="muted" style={{ margin: 0 }}>
            Issue will be logged on {context.projectName}.
          </p>
          <div className="field">
            <label htmlFor="palette-issue-title">Issue</label>
            <input id="palette-issue-title" name="title" placeholder="What is the problem or risk" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="palette-issue-severity">Severity</label>
            <select id="palette-issue-severity" name="severity">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Log issue
          </button>
        </form>
      )}

      {mode === "record" && context?.projectId && (
        <form className="form" action={createEntry} onSubmit={onDone}>
          <input type="hidden" name="project_id" value={context.projectId} />
          <p className="muted" style={{ margin: 0 }}>
            Record will be filed under {context.projectName}.
          </p>
          <div className="field">
            <label htmlFor="palette-record-title">Title</label>
            <input id="palette-record-title" name="title" placeholder="What happened" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="palette-record-type">Type</label>
            <select id="palette-record-type" name="type">
              <option value="note">Note</option>
              <option value="meeting">Meeting</option>
              <option value="decision">Decision</option>
              <option value="document">Document</option>
              <option value="update">Update</option>
              <option value="milestone">Milestone</option>
              <option value="capture">Capture</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="palette-record-body">Details</label>
            <textarea id="palette-record-body" name="body_md" placeholder="Context, links, or summary" />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            File record
          </button>
        </form>
      )}

      {mode === "conversation" && context?.clientId && (
        <form className="form" action={createConversation} onSubmit={onDone}>
          <input type="hidden" name="client_id" value={context.clientId} />
          <p className="muted" style={{ margin: 0 }}>
            Conversation will attach to {context.clientName}.
          </p>
          <div className="field">
            <label htmlFor="palette-conversation-title">Title</label>
            <input id="palette-conversation-title" name="title" placeholder="Client + Sakshi WhatsApp" required autoFocus />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="palette-conversation-kind">Type</label>
              <select id="palette-conversation-kind" name="kind">
                <option value="group">Group</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="palette-conversation-channel">Channel</label>
              <select id="palette-conversation-channel" name="channel">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Create conversation
          </button>
        </form>
      )}
    </div>
  );
}
