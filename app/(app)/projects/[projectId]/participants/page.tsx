import { getProjectWorkspace } from "@/features/queries";
import { addProjectParticipant } from "@/features/actions";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditParticipantButton } from "@/components/editing/edit-buttons";
import { Section } from "@/components/shared/section";

export default async function ProjectParticipantsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const data = await getProjectWorkspace(projectId);

  return (
    <Section
      title="Participants & Terms"
      count={data.participants.length}
      action={
        <ModalTrigger buttonLabel="+ Add participant" title="Add participant" buttonClass="button ghost small">
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
                <label>Communication</label>
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
              <label>Role detail</label>
              <input name="role_label" placeholder="Referrer, operations…" />
            </div>
            <label className="checkbox">
              <input name="is_referral_source" type="checkbox" />
              Introduced this project
            </label>
            <div className="form-grid">
              <div className="field">
                <label>Financial arrangement</label>
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
              <label>Terms note</label>
              <textarea name="terms_note" placeholder="Plain-language agreement context" />
            </div>
            <input type="hidden" name="currency_code" value="INR" />
            <input type="hidden" name="payment_status" value="pending" />
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Add participant
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
                <div className="row-title">{p.people?.name}</div>
                <div className="row-meta">
                  {p.role_label || p.role}
                  {p.communication_mode ? ` · ${p.communication_mode.replace(/_/g, " ")}` : ""}
                  {p.financial_arrangement !== "none"
                    ? ` · ${p.financial_arrangement.replace(/_/g, " ")} ${p.financial_value ?? ""}`
                    : ""}
                </div>
              </div>
              <div className="row-actions-always">
                <StatusPill value={p.role} />
                <EditParticipantButton participant={p} projectId={projectId} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">No participants linked.</div>
      )}
    </Section>
  );
}
