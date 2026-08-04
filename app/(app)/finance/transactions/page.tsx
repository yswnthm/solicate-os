import { requireActiveUser } from "@/lib/auth";
import { getTransactions } from "@/features/queries";
import { getTransactionPage } from "@/features/finance-actions";
import { TransactionLedger } from "@/components/finance/transaction-ledger";

export const metadata = {
  title: "Ledger — Solicate OS",
};

export default async function FinanceTransactionsPage() {
  await requireActiveUser();
  const initial = await getTransactions();

  return (
    <TransactionLedger
      initialRows={initial.rows}
      initialNextCursor={initial.nextCursor}
      initialHasMore={initial.hasMore}
      loadPage={getTransactionPage}
    />
  );
}
