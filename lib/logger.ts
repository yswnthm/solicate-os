import { createSupabaseServerClient } from "@/lib/supabase/server";

// Lightweight structured observability layer. Every message is written as a
// single JSON line so Vercel (or any log shipper) can parse it without custom
// parsing. Errors are additionally persisted to the error_logs table so they
// survive log rotation and are visible in-app.
//
// The logger never throws and never blocks a request: serialization and
// persistence failures are swallowed, because a logging failure must never mask
// the error being logged.

export type LogLevel = "info" | "warn" | "error";

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const line = safeJson({
    level,
    time: new Date().toISOString(),
    msg: message,
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

async function persistError(message: string, meta?: Record<string, unknown>) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("error_logs").insert({
      route: String(meta?.route ?? ""),
      message: message.slice(0, 2000),
      stack: String(meta?.stack ?? "").slice(0, 8000),
      user_id: (meta?.userId as string | undefined) ?? null,
      meta: JSON.parse(safeJson(meta ?? {})),
    });
  } catch {
    // Never let logging failure break the request.
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
    void persistError(message, meta);
  },
};
