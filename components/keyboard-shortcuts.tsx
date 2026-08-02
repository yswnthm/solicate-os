"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Linear-style G-then-letter navigation plus "/" to open search.
// Ignored while typing in inputs/textareas/selects.
const GO_TO: Record<string, string> = {
  t: "/today",
  i: "/inbox",
  p: "/projects",
  c: "/clients",
  u: "/people",
  s: "/search",
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const [pendingG, setPendingG] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      );
    };

    const openSearch = () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        openSearch();
        return;
      }

      if (e.key === "g") {
        e.preventDefault();
        setPendingG(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setPendingG(false), 800);
        return;
      }

      if (pendingG && GO_TO[e.key.toLowerCase()]) {
        e.preventDefault();
        setPendingG(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        router.push(GO_TO[e.key.toLowerCase()]);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router, pendingG]);

  return null;
}
