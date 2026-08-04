"use server";

import { requireActiveUser } from "@/lib/auth";
import { getTransactions, type TransactionPage } from "@/features/queries";

export interface TransactionPageQuery {
  cursor?: string | null;
  type?: string;
  status?: string;
  invoiceStatus?: string;
}

/**
 * Fetch a page of the transaction ledger. Called by the client ledger for
 * both "load more" (with a cursor) and filter changes (cursor null). Rows
 * never cross the network as a hidden full-table dump — each call is capped.
 */
export async function getTransactionPage(input: TransactionPageQuery): Promise<TransactionPage> {
  await requireActiveUser();
  return getTransactions({
    cursor: input.cursor ?? undefined,
    type: input.type ?? undefined,
    status: input.status ?? undefined,
    invoiceStatus: input.invoiceStatus ?? undefined,
  });
}
