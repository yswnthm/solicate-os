import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedTexts, embedQuery, isEmbeddingsConfigured, EMBEDDING_DIMENSIONS } from "@/lib/ai/embeddings";

// Semantic memory layer over semantic_chunks (migration 0021).
// Records are chunked → embedded → upserted; searches embed a query and run the
// match_semantic_chunks RPC. Every entry point degrades gracefully: when no
// embedding provider is configured, index/search no-op instead of throwing.

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export type SemanticSourceType = "entry" | "message" | "task" | "issue";

const CHUNK_MAX = 800;
const CHUNK_OVERLAP = 120;
const EMBED_BATCH = 32;

/** Split a long text into overlapping chunks, prefixing each with a label. */
export function chunkText(label: string, text: string): string[] {
  const prefix = label.trim() ? `${label.trim()}\n` : "";
  const body = text.trim();
  if (!body) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < body.length) {
    let end = Math.min(start + CHUNK_MAX, body.length);
    if (end < body.length) {
      const breakAt = body.lastIndexOf("\n", end);
      const spaceAt = body.lastIndexOf(" ", end);
      const cut = Math.max(breakAt, spaceAt);
      if (cut > start + CHUNK_MAX / 2) end = cut;
    }
    chunks.push(`${prefix}${body.slice(start, end).trim()}`);
    if (end >= body.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return chunks;
}

/**
 * Chunk + embed a single source record and upsert its rows into semantic_chunks.
 * Old chunks for the same source are replaced atomically.
 */
export async function indexSemanticSource(
  sourceType: SemanticSourceType,
  sourceId: string,
  projectId: string | null,
  label: string,
  text: string,
): Promise<void> {
  if (!isEmbeddingsConfigured()) return;
  const supabase = await createSupabaseServerClient();

  const chunks = chunkText(label, text);
  if (chunks.length === 0) return;

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const slice = chunks.slice(i, i + EMBED_BATCH);
    const vectors = await embedTexts(slice);
    const rows = vectors.map((vector, j) => ({
      source_type: sourceType,
      source_id: sourceId,
      project_id: projectId,
      chunk_index: i + j,
      chunk_text: slice[j],
      embedding: vector.length === EMBEDDING_DIMENSIONS ? vector : null,
    }));

    const { error: delError } = await supabase
      .from("semantic_chunks")
      .delete()
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .gte("chunk_index", i)
      .lt("chunk_index", i + slice.length);
    throwOnError(delError);

    const { error } = await supabase.from("semantic_chunks").insert(rows);
    throwOnError(error);
  }
}

/** Remove every stored chunk for a source (e.g. when the record is deleted). */
export async function clearSemanticIndex(sourceType: SemanticSourceType, sourceId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("semantic_chunks")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
  throwOnError(error);
}

export interface SemanticMatch {
  id: string;
  source_type: SemanticSourceType;
  source_id: string;
  project_id: string | null;
  chunk_text: string;
  similarity: number;
}

/**
 * Retrieve the records most semantically similar to `query` from the archive.
 * Scoped to a project when matchProjectId is set; otherwise global.
 * Returns [] when embeddings are not configured or the search fails.
 */
export async function semanticSearch(
  query: string,
  matchProjectId?: string | null,
  matchCount = 8,
): Promise<SemanticMatch[]> {
  if (!isEmbeddingsConfigured() || !query.trim()) return [];
  const supabase = await createSupabaseServerClient();

  let vector: number[];
  try {
    vector = await embedQuery(query);
  } catch {
    return [];
  }

  const { data, error } = await supabase.rpc("match_semantic_chunks", {
    query_embedding: vector,
    match_count: matchCount,
    match_project_id: matchProjectId ?? null,
  });
  if (error) return [];
  return (data ?? []) as unknown as SemanticMatch[];
}
