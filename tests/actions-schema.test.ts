import { describe, expect, it } from "vitest";

import { validateActions } from "@/lib/capture/actions-schema";

const UUID = "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab";

describe("validateActions", () => {
  it("accepts a valid finance.transaction", () => {
    const { valid, invalid } = validateActions([
      {
        kind: "finance.transaction",
        label: "Log client payment",
        summary: "Received ₹50,000 advance.",
        project_id: UUID,
        payload: { type: "income", amount: 50000, transaction_date: "2026-08-04", invoice_status: "sent" },
      },
    ]);
    expect(invalid).toHaveLength(0);
    expect(valid).toHaveLength(1);
    expect(valid[0].kind).toBe("finance.transaction");
  });

  it("rejects a transaction with a negative or zero amount", () => {
    const { valid, invalid } = validateActions([
      { kind: "finance.transaction", label: "x", summary: "s", payload: { type: "income", amount: -5 } },
      { kind: "finance.transaction", label: "x", summary: "s", payload: { type: "income", amount: 0 } },
    ]);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(2);
  });

  it("rejects an unknown kind and non-array input", () => {
    const { valid, invalid } = validateActions([{ kind: "no.such.action", label: "x" }]);
    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(1);
    expect(validateActions({ not: "an array" })).toEqual({ valid: [], invalid: [] });
    expect(validateActions(undefined)).toEqual({ valid: [], invalid: [] });
  });

  it("accepts a cross-action reference (action:<localId>) as a project_id", () => {
    const { valid } = validateActions([
      { kind: "task.create", label: "Ship homepage", summary: "s", project_id: "action:newproj1", payload: { title: "Build homepage" } },
    ]);
    expect(valid).toHaveLength(1);
  });

  it("surfaces invalid items instead of dropping them", () => {
    const good = { kind: "task.create", label: "A", summary: "s", project_id: UUID, payload: { title: "Task" } };
    const bad = { kind: "task.create", label: "B", summary: "s", payload: { title: "" } };
    const { valid, invalid } = validateActions([good, bad]);
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(1);
  });
});
