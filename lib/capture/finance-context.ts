export interface FinanceContextInput {
  text: string;
  scope: string; // 'income', 'expense', 'allocation', 'invoice_update'
  options: any; // The options returned from getFinanceCaptureOptions
}

export interface FinanceContext {
  input: {
    scope: string;
    text: string;
  };
  recent_transactions: Record<string, unknown>[];
  open_invoices: Record<string, unknown>[];
  unallocated_transactions: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  phases: Record<string, unknown>[];
  people: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  payment_methods: Record<string, unknown>[];
}

export async function buildFinanceContext(input: FinanceContextInput): Promise<FinanceContext> {
  const { options } = input;

  // Compute unallocated transactions (transactions where sum of allocations < amount)
  const unallocated_transactions = (options.recentTransactions || []).filter((t: any) => {
    const allocated = (t.transaction_allocations || []).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
    return allocated < Number(t.amount);
  });

  return {
    input: {
      scope: input.scope,
      text: input.text,
    },
    recent_transactions: options.recentTransactions || [],
    open_invoices: options.openInvoices || [],
    unallocated_transactions,
    projects: options.projects || [],
    phases: options.phases || [],
    people: options.people || [],
    categories: options.categories || [],
    payment_methods: options.paymentMethods || [],
  };
}
