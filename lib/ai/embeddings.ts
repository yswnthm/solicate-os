// Embedding provider. Gemini's text-embedding-004 is called directly over REST
// (no SDK), exactly like the chat provider in lib/ai/providers/gemini.ts.
//
// Dimension: 768 — must match the vector(768) column in semantic_chunks.

export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;

export function isEmbeddingsConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

const EMBEDDING_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Embed a batch of texts. Returns one vector per input, in order.
 * Batch size should stay ≤ 32 to stay comfortably under provider limits.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  if (texts.length === 0) return [];

  const response = await fetch(`${EMBEDDING_BASE}/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      })),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Embedding request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    embeddings?: { values?: number[] }[];
  };
  const embeddings = payload.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error("Embedding provider returned fewer vectors than requested.");
  }
  return embeddings.map((e) => e.values ?? []);
}

export function embedQuery(text: string): Promise<number[]> {
  return embedTexts([text]).then(([vector]) => vector);
}
