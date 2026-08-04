// Keyset cursor pagination for the transaction ledger.
//
// Rows are ordered (transaction_date DESC, created_at DESC, id DESC). The
// cursor is a base64-encoded snapshot of the last row's keys, and the next page
// is fetched with the standard keyset predicate:
//
//   (d < d0) OR (d = d0 AND c < c0) OR (d = d0 AND c = c0 AND i < i0)
//
// This is stable under concurrent inserts (unlike OFFSET) and O(index) per page.

export interface Keyset {
  d: string; // transaction_date — date string "YYYY-MM-DD"
  c: string; // created_at — ISO 8601 (normalized UTC, Z suffix)
  i: string; // id — uuid tiebreaker
}

const SEPARATOR = "|";

export function encodeCursor(keys: Keyset): string {
  return Buffer.from([keys.d, keys.c, keys.i].join(SEPARATOR), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): Keyset | null {
  if (!cursor) return null;
  try {
    const [d, c, i] = Buffer.from(cursor, "base64url").toString("utf8").split(SEPARATOR);
    if (!d || !c || !i) return null;
    return { d, c, i };
  } catch {
    return null;
  }
}

/** Keyset filter string for supabase's `.or()`. */
export function keysetFilter(keys: Keyset): string {
  return [
    `and(transaction_date.lt.${keys.d})`,
    `and(transaction_date.eq.${keys.d},created_at.lt.${keys.c})`,
    `and(transaction_date.eq.${keys.d},created_at.eq.${keys.c},id.lt.${keys.i})`,
  ].join(",");
}

/** Normalize a row's raw date/timestamp columns into a stable keyset. */
export function toKeyset(row: { transaction_date: unknown; created_at: unknown; id: unknown }): Keyset {
  const rawCreated = row.created_at;
  const created = rawCreated instanceof Date ? rawCreated.toISOString() : new Date(String(rawCreated)).toISOString();
  return { d: String(row.transaction_date), c: created, i: String(row.id) };
}
