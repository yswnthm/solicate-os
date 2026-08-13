import { createUnifiedPerson } from "@/features/actions";
import { getActiveClients, getPeople, getRelationships } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";
import { EditClientButton, EditPersonButton } from "@/components/editing/edit-buttons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const [clients, people, relationships] = await Promise.all([
    getActiveClients(),
    getPeople(),
    getRelationships(),
  ]);

  // Merge clients and people uniquely by id
  const allPeopleMap = new Map();
  for (const p of people) {
    allPeopleMap.set(p.id, { ...p, is_client: false });
  }
  for (const c of clients) {
    if (allPeopleMap.has(c.id)) {
      allPeopleMap.set(c.id, { ...allPeopleMap.get(c.id), ...c, is_client: true });
    } else {
      allPeopleMap.set(c.id, { ...c, is_client: true });
    }
  }
  
  const unifiedPeople = Array.from(allPeopleMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Directory"
        description="Your unified network of people, clients, and partners."
      >
        <ModalTrigger buttonLabel="+ Add Record" title="Add to Directory" buttonClass="button">
          <form className="form" action={createUnifiedPerson}>
            <div className="field">
              <label>Name</label>
              <input name="name" placeholder="Name or Organization" required />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Type</label>
                <select name="kind">
                  <option value="individual">Individual</option>
                  <option value="business">Business / Organization</option>
                </select>
              </div>
              <div className="field">
                <label>Website</label>
                <input name="website_url" type="url" placeholder="https://" />
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" placeholder="optional" />
              </div>
              <div className="field">
                <label>Phone</label>
                <input name="phone" placeholder="optional" />
              </div>
            </div>
            <div className="form-grid" style={{ gap: "1rem", marginTop: "0.5rem" }}>
              <label className="checkbox">
                <input name="is_client" type="checkbox" />
                This is a client
              </label>
              <label className="checkbox">
                <input name="is_partner" type="checkbox" />
                This is a partner/referrer
              </label>
            </div>
            <div className="field" style={{ marginTop: "1rem" }}>
              <label>Relationship context</label>
              <textarea
                name="summary"
                placeholder="How you know them, what they do, or referral history…"
              />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Save record
            </button>
          </form>
        </ModalTrigger>
      </PageHeader>

      <div className="list" style={{ marginTop: 24 }}>
        {unifiedPeople.map((person: any) => {
          // Find if they were referred by someone
          const clientRelationship = relationships.find((r: any) => r.client_id === person.id && r.source === "referral_partner");
          const referralText = clientRelationship?.contact?.name ? `Referred by ${clientRelationship.contact.name}` : null;
          
          // Find associated projects to use as company name
          const projectNames = person.projects?.map((p: any) => p.name).join(", ");
          const companyText = projectNames ? `${projectNames}` : null;
          
          const metaItems = [
            companyText,
            person.email, 
            person.phone,
            referralText,
          ].filter(Boolean);
          
          const metaString = metaItems.join(" · ") || person.summary || "No details provided";

          return (
            <div className="row" key={person.id}>
              <Link className="row-main" href={person.is_client || person.kind === "business" ? `/clients/${person.id}` : `/people/${person.id}`}>
                <div className="row-title">{person.name}</div>
                <div className="row-meta">
                  {metaString}
                </div>
              </Link>
              <div className="row-actions-always">
                {person.is_client && <StatusPill value="client" />}
                {person.kind === "business" && <StatusPill value="business" />}
                {person.is_partner && <StatusPill value="partner" />}
                
                {person.is_client || person.kind === "business" ? (
                  <EditClientButton client={person} />
                ) : (
                  <EditPersonButton person={person} />
                )}
              </div>
            </div>
          );
        })}
        {unifiedPeople.length === 0 && (
          <div className="empty" style={{ border: 'none', background: 'transparent', padding: '1rem 0' }}>
            No people found.
          </div>
        )}
      </div>
    </>
  );
}
