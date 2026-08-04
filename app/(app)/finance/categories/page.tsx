import { requireActiveUser } from "@/lib/auth";
import { getFinanceSettings } from "@/features/queries";
import { Section } from "@/components/shared/section";

export const metadata = {
  title: "Finance Categories — Solicate OS",
};

export default async function CategoriesPage() {
  await requireActiveUser();
  const settings = await getFinanceSettings();

  return (
    <Section title="Finance Categories">
      <div className="list">
        {settings.categories.map((c: any) => (
          <div key={c.id} className="row" style={{ alignItems: "center" }}>
            <div className="row-main">
              <div className="row-title">{c.name}</div>
              <div className="row-meta" style={{ textTransform: "capitalize" }}>{c.transaction_type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              {c.is_default && <span className="badge muted">Default</span>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
