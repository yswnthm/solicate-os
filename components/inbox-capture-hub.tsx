"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { InboxList } from "@/components/inbox-list";
import { CaptureFlow, type CaptureFormOptions } from "@/components/capture/capture-flow";
import { TriageAllButton } from "@/components/triage-all";
import { PageHeader } from "@/components/page-header";
import { classNames } from "@/lib/utils";

import { QuickCaptureStrip } from "@/components/quick-capture-strip";

interface InboxProject {
  id: string;
  name: string;
  people?: Array<{ name: string }> | { name: string } | null;
}

export function InboxCaptureHub({
  entries,
  projects,
  captureOptions,
}: {
  entries: any[];
  projects: InboxProject[];
  captureOptions: CaptureFormOptions;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (searchParams.get("tab") as "triage" | "capture") || "triage";
  const totalUntriaged = entries.length;

  const setTab = (tab: "triage" | "capture") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Inbox & Capture"
        description={
          currentTab === "triage"
            ? "Triage incoming untriaged records. File them into project history or dismiss."
            : "Tell the operating system what happened in plain language. AI proposes updates — review before executing."
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {currentTab === "triage" && totalUntriaged > 0 && <TriageAllButton projects={projects} />}
          <Link href="/finance/capture" className="button secondary">
            Finance Capture →
          </Link>
        </div>
      </PageHeader>

      {/* Standard Solicate-OS Tabs Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <nav className="tabs" style={{ margin: 0 }} aria-label="Inbox and Capture modes">
          <button
            type="button"
            className={classNames("tab", currentTab === "triage" && "active")}
            onClick={() => setTab("triage")}
          >
            Inbox Triage
            {totalUntriaged > 0 && <span className="tab-count">({totalUntriaged})</span>}
          </button>

          <button
            type="button"
            className={classNames("tab", currentTab === "capture" && "active")}
            onClick={() => setTab("capture")}
          >
            ⚡ AI Quick Capture
          </button>
        </nav>

        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {currentTab === "triage"
            ? "Untriaged Queue → Filing / Dismissal"
            : "Plain Language Input → AI Database Extraction"}
        </div>
      </div>

      {/* Tab Panels */}
      {currentTab === "triage" ? (
        <>
          <QuickCaptureStrip projects={projects} />
          <InboxList entries={entries} projects={projects} />
        </>
      ) : (
        <CaptureFlow options={captureOptions} />
      )}
    </>
  );
}
