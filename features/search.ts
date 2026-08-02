"use server";

import { searchRecords } from "@/features/queries";

// Thin server-action wrapper so the command palette can run live searches
// from the client. Debounce calls at the call site.
export async function quickSearch(query: string) {
  return searchRecords(query);
}
