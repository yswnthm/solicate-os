import { describe, expect, it } from "vitest";

import { captureAnalyzeSchema, captureInputSchema } from "@/lib/capture/schemas";

describe("captureAnalyzeSchema", () => {
  it("normalizes confidence from 0-100 to 0-1", () => {
    const parsed = captureAnalyzeSchema.parse({
      title: "Payment from client",
      confidence: 85,
      understanding: "The client paid the milestone invoice.",
      clarifying_questions: [],
    });
    expect(parsed.confidence).toBe(0.85);
  });

  it("rejects confidence outside 0-100 and empty understanding", () => {
    expect(() =>
      captureAnalyzeSchema.parse({ title: "x", confidence: 150, understanding: "u", clarifying_questions: [] }),
    ).toThrow();
    expect(() =>
      captureAnalyzeSchema.parse({ title: "x", confidence: 50, understanding: "  ", clarifying_questions: [] }),
    ).toThrow();
  });

  it("caps clarifying questions at 8", () => {
    const questions = Array.from({ length: 9 }, (_, i) => ({
      id: `q${i}`,
      question: `Question ${i}?`,
      options: [],
      allow_other: true,
    }));
    expect(() =>
      captureAnalyzeSchema.parse({ title: "x", confidence: 50, understanding: "u", clarifying_questions: questions }),
    ).toThrow();
  });
});

describe("captureInputSchema", () => {
  it("rejects a capture with no text and dedupes update types", () => {
    const parsed = captureInputSchema.parse({
      scope: "projectless",
      project_id: null,
      phase_id: null,
      person_id: null,
      client_id: null,
      update_types: ["task", "task", "decision"],
      text: "We shipped v2.",
    });
    expect(parsed.update_types).toEqual(["task", "decision"]);
    expect(() => captureInputSchema.parse({ scope: "projectless", text: "   " })).toThrow();
  });
});
