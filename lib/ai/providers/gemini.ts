import type { GenerateParams } from "../types";
import { fetchJsonWithRetry } from "@/lib/ai/http";

// Google's Generative Language API, called directly (no SDK).
// Docs: https://ai.google.dev/api/generate-content

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGemini({
  system,
  user,
  model,
  temperature = 0.4,
  maxTokens = 2048,
  responseFormat,
}: GenerateParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const url = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const result = await fetchJsonWithRetry<{
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(user) }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: responseFormat === "json_field" ? "application/json" : undefined,
      },
    }),
    cache: "no-store",
  });

  if (!result.ok) {
    throw new Error(`Gemini request failed (${result.status}): ${(result.detail ?? "").slice(0, 300)}`);
  }

  const content = (result.body?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!content) throw new Error("Gemini returned an empty response.");
  return content;
}
