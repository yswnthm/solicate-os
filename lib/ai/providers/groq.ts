import type { GenerateParams } from "../types";

// Groq exposes an OpenAI-compatible endpoint. We call it directly so the
// provider layer stays SDK-free and swappable.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function generateGroq({
  system,
  user,
  model,
  temperature = 0.4,
  maxTokens = 2048,
  responseFormat,
}: GenerateParams): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat === "json_field" ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");
  return content;
}
