import { notFound } from "next/navigation";
import { getProjectWorkspace, getActiveClients } from "@/features/queries";
import { addProjectParticipant } from "@/features/actions";
import { Section } from "@/components/shared/section";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditProjectButton, EditParticipantButton, EditPersonButton } from "@/components/editing/edit-buttons";

export default async function ProjectInfoPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [data, clients] = await Promise.all([getProjectWorkspace(projectId), getActiveClients()]);
  const project: any = data.project;
  if (!project) notFound();

  const clientPerson = project.people;

  const strategy = [
    { title: "Objective", body: project.objective, key: "objective", hint: "What this project is trying to achieve" },
    { title: "Success Definition", body: project.success_definition, key: "success_definition", hint: "How we know this worked" },
    { title: "Direction & Strategy", body: project.direction, key: "direction", hint: "Strategy, positioning, or guardrails" },
    { title: "Working Summary", body: project.summary, key: "summary", hint: "Executive project summary" },
  ];

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* ─── 1. Project Strategy & Direction ─── */}
      <Section
        title="Project Strategy & Direction"
        action={<EditProjectButton project={project} clients={clients} label="Edit strategy & direction" />}
      >
        <div className="strategy-grid">
          {strategy.map((block) => (
            <div className="strategy-block" key={block.key}>
              <h4 style={{ margin: "0 0 6px" }}>{block.title}</h4>
              {block.body ? (
                <div className="prose">{block.body}</div>
              ) : (
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  Not defined yet — {block.hint.toLowerCase()}.
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 2. Client & Online Presence (Brand Info & Socials) ─── */}
      <Section title="Client & Online Presence">
        <div className="stack" style={{ gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{clientPerson?.name || "Client"}</h3>
            </div>
            {clientPerson && <EditPersonButton person={clientPerson} label="Edit client info" />}
          </div>

          <div className="grid two" style={{ gap: 12 }}>
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
              <p className="metric-label" style={{ marginBottom: 4 }}>Primary Contact / Email</p>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {clientPerson?.email ? (
                  <a href={`mailto:${clientPerson.email}`} style={{ color: "var(--ink)", textDecoration: "underline" }}>
                    {clientPerson.email}
                  </a>
                ) : (
                  <span className="muted">No email recorded</span>
                )}
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
              <p className="metric-label" style={{ marginBottom: 4 }}>Phone / Contact</p>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {clientPerson?.phone ? (
                  <a href={`tel:${clientPerson.phone}`} style={{ color: "var(--ink)" }}>
                    {clientPerson.phone}
                  </a>
                ) : (
                  <span className="muted">No phone number recorded</span>
                )}
              </div>
            </div>
          </div>

          {clientPerson?.summary && (
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "var(--muted)" }}>Client Context & Social Handles</h4>
              <div className="prose">{clientPerson.summary}</div>
            </div>
          )}
        </div>
      </Section>

      {/* ─── 3. Participants & Contacts ─── */}
      <Section
        title="Participants, Contacts & Terms"
        count={data.participants.length}
        action={
          <ModalTrigger buttonLabel="+ Add participant" title="Add Participant" buttonClass="button ghost small">
            <form className="form" action={addProjectParticipant}>
              <input type="hidden" name="project_id" value={projectId} />
              <div className="field">
                <label>Person</label>
                <select name="person_id" required>
                  <option value="">Choose person</option>
                  {data.people.map((person: any) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {person.is_partner ? " (partner)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Role</label>
                  <select name="role">
                    <option value="client_contact">Client contact</option>
                    <option value="partner">Partner</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                </div>
                <div className="field">
                  <label>Communication Mode</label>
                  <select name="communication_mode">
                    <option value="">Not set</option>
                    <option value="solicate_leads">Solicate leads</option>
                    <option value="partner_leads">Partner leads</option>
                    <option value="shared">Shared</option>
                    <option value="advisory_only">Advisory only</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Role Detail / Social Handle</label>
                <input name="role_label" placeholder="Referrer, operations, Instagram handle, etc." />
              </div>
              <label className="checkbox">
                <input name="is_referral_source" type="checkbox" />
                Introduced this project
              </label>
              <div className="form-grid">
                <div className="field">
                  <label>Financial Arrangement</label>
                  <select name="financial_arrangement">
                    <option value="none">None</option>
                    <option value="referral_commission">Referral commission</option>
                    <option value="revenue_share">Revenue share</option>
                    <option value="delivery_split">Delivery split</option>
                    <option value="fixed_fee">Fixed fee</option>
                  </select>
                </div>
                <div className="field">
                  <label>Value</label>
                  <input name="financial_value" type="number" min="0" step="0.01" />
                </div>
              </div>
              <div className="field">
                <label>Terms Note & Social Links</label>
                <textarea name="terms_note" placeholder="Plain-language agreement, Instagram/X profiles, or contact details" />
              </div>
              <input type="hidden" name="currency_code" value="INR" />
              <input type="hidden" name="payment_status" value="pending" />
              <button className="button" type="submit" style={{ marginTop: 8 }}>
                Add Participant
              </button>
            </form>
          </ModalTrigger>
        }
      >
        {data.participants.length ? (
          <div className="list">
            {data.participants.map((p: any) => (
              <div className="row" key={p.person_id}>
                <div className="row-main">
                  <div className="row-title" style={{ fontWeight: 600 }}>{p.people?.name}</div>
                  <div className="row-meta">
                    {p.role_label || p.role.replace(/_/g, " ")}
                    {p.communication_mode ? ` · Comm: ${p.communication_mode.replace(/_/g, " ")}` : ""}
                    {p.financial_arrangement !== "none"
                      ? ` · ${p.financial_arrangement.replace(/_/g, " ")} ${p.financial_value ?? ""}`
                      : ""}
                  </div>
                  {p.terms_note && <div className="prose" style={{ fontSize: 13, marginTop: 4 }}>{p.terms_note}</div>}
                </div>
                <div className="row-actions-always">
                  <StatusPill value={p.role} />
                  <EditParticipantButton participant={p} projectId={projectId} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No participants linked to this project.</div>
        )}
      </Section>
    </div>
  );
}
