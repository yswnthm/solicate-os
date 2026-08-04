import { FinanceNav } from "@/components/finance/finance-nav";
import { PageHeader } from "@/components/page-header";
import { getPeople, getFinanceSettings } from "@/features/queries";
import { AddTransactionButton } from "@/components/finance/add-transaction-button";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const [people, settings] = await Promise.all([
    getPeople(),
    getFinanceSettings()
  ]);

  return (
    <div className="layout-content">
      <PageHeader
        title="Finance"
        description="Global ledger, invoice tracking, and agency-level financials."
      >
        <AddTransactionButton 
          people={people} 
          categories={settings.categories} 
          paymentMethods={settings.paymentMethods} 
        />
      </PageHeader>
      
      <FinanceNav />

      <main className="page-main">{children}</main>
    </div>
  );
}
