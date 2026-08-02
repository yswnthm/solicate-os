"use client";

import { useState } from "react";
import { Modal } from "./modal";
import Link from "next/link";
import { createProject } from "@/features/actions";

export function NewProjectButton({ clients }: { clients: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button" onClick={() => setIsOpen(true)}>
        + New project
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New project">
        <p className="muted" style={{ marginBottom: 16 }}>Create a bounded delivery record for an existing client.</p>
        <form className="form" action={createProject} onSubmit={() => setIsOpen(false)}>
          <div className="field">
            <label>Client</label>
            <select name="client_id" required>
              <option value="">Choose client</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Project name</label>
            <input name="name" placeholder="Website redesign" required />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Code</label>
              <input name="code" placeholder="SOL-026" />
            </div>
            <div className="field">
              <label>Target date</label>
              <input name="target_date" type="date" />
            </div>
          </div>
          <div className="field">
            <label>Working summary</label>
            <textarea name="summary" placeholder="What is being delivered and why?" />
          </div>
          <button className="button" type="submit" style={{ marginTop: 8 }}>
            Create project
          </button>
        </form>
        {clients.length === 0 && (
          <p className="notice" style={{ marginTop: 16 }}>
            No clients yet.{" "}
            <Link href="/clients" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Add a client first →
            </Link>
          </p>
        )}
      </Modal>
    </>
  );
}
