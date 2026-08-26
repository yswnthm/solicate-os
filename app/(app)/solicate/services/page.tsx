import { getSolicateServices } from "@/features/solicate";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { AddSolicateServiceButton, EditSolicateServiceButton } from "@/components/editing/solicate-edit-modals";

export const metadata = {
  title: "Agency Services | Solicate OS",
};

export default async function SolicateServicesPage() {
  const services = await getSolicateServices();

  return (
    <div className="stack" style={{ gap: 24 }}>
      <Section
        title="Active Service Lines & Capabilities"
        count={services.length}
        action={<AddSolicateServiceButton />}
      >
        {services.length ? (
          <div className="list">
            {services.map((s: any) => (
              <div className="row" key={s.id}>
                <div className="row-main">
                  <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                    <span>{s.name}</span>
                    <span className="pill" style={{ fontSize: 11, background: "var(--surface-3)", color: "var(--muted)" }}>
                      {s.model ? s.model.replace(/_/g, " ") : "phase based"}
                    </span>
                  </div>
                  <div className="row-meta" style={{ marginTop: 2 }}>
                    {s.pricing_from ? (
                      <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                        {s.pricing_currency === "INR" ? "₹" : s.pricing_currency + " "}
                        {Number(s.pricing_from).toLocaleString()} from
                      </span>
                    ) : (
                      "Custom pricing"
                    )}
                    {s.slug ? ` · key: ${s.slug}` : ""}
                  </div>
                  {s.description && (
                    <div className="prose" style={{ fontSize: 13, marginTop: 6 }}>
                      {s.description}
                    </div>
                  )}
                  {s.notes && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                      Note: {s.notes}
                    </div>
                  )}
                </div>
                <div className="row-actions-always" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusPill value={s.status} />
                  <EditSolicateServiceButton service={s} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No services configured yet.</div>
        )}
      </Section>
    </div>
  );
}
