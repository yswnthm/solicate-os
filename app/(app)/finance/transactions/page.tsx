import { requireActiveUser } from "@/lib/auth";
import { getTransactions } from "@/features/queries";
import { TransactionLedger } from "@/components/finance/transaction-ledger";

export const metadata = {
  title: "Ledger — Solicate OS",
};

export default async function FinanceTransactionsPage() {
  await requireActiveUser();
  const transactions = await getTransactions();

  return <TransactionLedger transactions={transactions} />;
}
