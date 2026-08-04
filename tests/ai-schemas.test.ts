import { describe, expect, it } from "vitest";

import { triageDraftSchema, batchDraftsSchema } from "@/lib/ai/schemas";

describe("triageDraftSchema", () => {
  it("accepts a valid draft with an empty project_id", () => {
    const parsed = triageDraftSchema.parse({
      title: "Client call notes",
      type: "note",
      project_id: "",
      body_md: "Discussed the new scope.",
    });
    expect(parsed.project_id).toBe("");
  });

  it("rejects a draft with no body and an unknown type", () => {
    expect(() =>
      triageDraftSchema.parse({ title: "x", type: "note", project_id: "", body_md: " " }),
    ).toThrow();
    expect(() =>
      triageDraftSchema.parse({ title: "x", type: "shopping", project_id: "", body_md: "body" }),
    ).toThrow();
  });
});

describe("batchDraftsSchema", () => {
  it("parses a batch of drafts each carrying an id", () => {
    const parsed = batchDraftsSchema.parse({
      drafts: [
        { id: "a", title: "One", type: "note", project_id: null, body_md: "body" },
        { id: "b", title: "Two", type: "update", project_id: "", body_md: "body 2" },
      ],
    });
    expect(parsed.drafts).toHaveLength(2);
  });

  it("rejects a draft missing its id in batch context", () => {
    expect(() =>
      batchDraftsSchema.parse({ drafts: [{ title: "x", type: "note", project_id: null, body_md: "body" }] }),
    ).toThrow();
  });
});
