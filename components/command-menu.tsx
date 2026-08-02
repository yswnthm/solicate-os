"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

import { createClient, createPerson, createProject, quickCapture } from "@/features/actions";
import { quickSearch } from "@/features/search";

type PaletteMode = "command" | "capture" | "project" | "client" | "person";

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
  capture: "Quick capture",
  project: "New project",
  client: "New client",
  person: "New person",
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
  const router = useRouter();

  const openInMode = useCallback((next: PaletteMode) => {
    setMode(next);
    setSearch("");
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K toggles the palette; ⌘⇧X opens straight into quick capture.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && (e.key === "X" || e.key === "x")) {
        e.preventDefault();
        openInMode("capture");
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
  }, [openInMode]);

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
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
                    <Command.Item className="cmdk-item" onSelect={() => go("/people")}>
                      <span className="cmdk-icon">◎</span>
                      <span className="cmdk-item-main"><span>People</span></span>
                    </Command.Item>
                    <Command.Item className="cmdk-item" onSelect={() => go("/search")}>
                      <span className="cmdk-icon">⌕</span>
                      <span className="cmdk-item-main"><span>Search</span></span>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Create" className="cmdk-group-heading">
                    <Command.Item className="cmdk-item" onSelect={() => openInMode("capture")}>
                      <span className="cmdk-icon">✚</span>
                      <span className="cmdk-item-main">
                        <span>Quick capture</span>
                        <span className="cmdk-sub">⌘⇧X · a thought now, triage from Inbox</span>
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
          <CreateForm mode={mode} clients={clients} projects={projects} onBack={reset} onDone={closeAfterSubmit} />
        )}
      </Command.Dialog>
    </>
  );
}

function CreateForm({
  mode,
  clients,
  projects,
  onBack,
  onDone,
}: {
  mode: Exclude<PaletteMode, "command">;
  clients: Client[];
  projects: Project[];
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

      {mode === "capture" && (
        <form className="form" action={quickCapture} onSubmit={onDone}>
          <div className="field">
            <label htmlFor="palette-capture-title">What to capture</label>
            <input id="palette-capture-title" name="title" placeholder="Client asked about…" required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="palette-capture-project">Project (optional)</label>
            <select id="palette-capture-project" name="project_id">
              <option value="">Unsorted — triage from Inbox</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {clientName(p.clients) ? `${clientName(p.clients)} / ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="palette-capture-detail">Detail (optional)</label>
            <textarea id="palette-capture-detail" name="body_md" placeholder="Context, links, or raw text" />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Capture → Inbox
          </button>
        </form>
      )}

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
    </div>
  );
}
