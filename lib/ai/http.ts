// Shared HTTP layer for AI providers: bounded timeouts and exponential backoff
// with jitter on transient failures (network errors, 408/429/5xx). 4xx client
// errors (like a bad request) are returned immediately — a retry will not help.
//
// Providers get a consistent `HttpResult` shape so their retry logic (e.g. the
// opencode json_object fallback) stays readable.

export interface HttpResult<T = unknown> {
  ok: boolean;
  status: number;
  body?: T;
  detail?: string;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_BACKOFF_MS = 5_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with full jitter: delay ∈ [base/2, base]. */
function backoff(attempt: number): number {
  const exponential = Math.min(DEFAULT_BASE_DELAY_MS * 2 ** attempt, MAX_BACKOFF_MS);
  return exponential / 2 + Math.random() * (exponential / 2);
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

export async function fetchJsonWithRetry<T = unknown>(
  url: string,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<HttpResult<T>> {
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

      if (response.ok) {
        const body = (await response.json().catch(() => undefined)) as T | undefined;
        return { ok: true, status: response.status, body };
      }

      const detail = (await response.text().catch(() => "")).slice(0, 300);
      if (!isTransientStatus(response.status) || attempt === retries) {
        return { ok: false, status: response.status, detail };
      }
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      const detail = timedOut ? "request timed out" : cause instanceof Error ? cause.message : String(cause);
      if (attempt === retries) {
        return { ok: false, status: 0, detail };
      }
    }

    await sleep(backoff(attempt));
  }

  return { ok: false, status: 0, detail: "request failed" };
}
