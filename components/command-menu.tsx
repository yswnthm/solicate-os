"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Avoid hydration mismatch by rendering only after mount for dialogs
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;

  return (
    <>
      {open && <div className="cmdk-overlay" onClick={() => setOpen(false)} />}
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="cmdk-dialog"
      >
        <Command.Input 
          autoFocus 
          placeholder="Type a command or search..." 
          className="cmdk-input" 
        />
        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">No results found.</Command.Empty>

          <Command.Group heading="Go to" className="cmdk-group-heading">
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/today");
                setOpen(false);
              }}
            >
              ◈ Today
            </Command.Item>
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/inbox");
                setOpen(false);
              }}
            >
              ⬡ Inbox
            </Command.Item>
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/projects");
                setOpen(false);
              }}
            >
              ◻ Projects
            </Command.Item>
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/clients");
                setOpen(false);
              }}
            >
              ◑ Clients
            </Command.Item>
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/people");
                setOpen(false);
              }}
            >
              ◎ People
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Actions" className="cmdk-group-heading">
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/search");
                setOpen(false);
              }}
            >
              ⌕ Search
            </Command.Item>
            <Command.Item
              className="cmdk-item"
              onSelect={() => {
                router.push("/settings");
                setOpen(false);
              }}
            >
              ⚙ Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
