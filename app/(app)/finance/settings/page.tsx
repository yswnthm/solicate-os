import { requireActiveUser } from "@/lib/auth";
import { getFinanceSettings } from "@/features/queries";
import { Section } from "@/components/shared/section";

export const metadata = {
  title: "Payment Methods — Solicate OS",
};

export default async function SettingsPage() {
  await requireActiveUser();
  const settings = await getFinanceSettings();

  return (
    <Section title="Payment Methods">
      <div className="list">
        {settings.paymentMethods.map((pm: any) => (
          <div key={pm.id} className="row" style={{ alignItems: "center" }}>
            <div className="row-main">
              <div className="row-title">{pm.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {pm.is_default && <span className="badge muted">Default</span>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
