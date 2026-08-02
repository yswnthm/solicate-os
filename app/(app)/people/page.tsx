export const dynamic = "force-dynamic";
import Link from "next/link";

import { createPerson } from "@/features/actions";
import { getPeople } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ModalTrigger } from "@/components/modal-trigger";

export default async function PeoplePage() {
  const people = await getPeople();
  const partners = people.filter((p: any) => p.is_partner);
  const contacts = people.filter((p: any) => !p.is_partner);

  return (
    <>
      <PageHeader
        title="People"
        description="External client contacts, partners, referrers, and collaborators. Partners are records — they do not receive login access."
      >
        <ModalTrigger buttonLabel="+ Add person" title="Add person" buttonClass="button">
          <p className="muted" style={{ marginBottom: 16 }}>
            Partners are external records. Checking the partner box does not create a login account.
          </p>
          <form className="form" action={createPerson}>
            <div className="field">
              <label>Full name</label>
              <input name="name" placeholder="Sakshi Mehta" required />
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
            <label className="checkbox">
              <input name="is_partner" type="checkbox" />
              This person is a partner or referrer
            </label>
            <div className="field">
              <label>Relationship context</label>
              <textarea
                name="summary"
                placeholder="How you know them, their specialisation, referral history…"
              />
            </div>
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              Add person
            </button>
          </form>
        </ModalTrigger>
      </PageHeader>

      <div className="stack">
        {/* Partners */}
        {partners.length > 0 && (
          <section className="section">
            <div className="section-title">
              <h2>Partners &amp; referrers</h2>
              <span>{partners.length}</span>
            </div>
            <div className="list">
              {partners.map((person: any) => (
                <Link className="row" href={`/people/${person.id}`} key={person.id}>
                  <div className="row-main">
                    <div className="row-title">{person.name}</div>
                    <div className="row-meta">
                      {[person.email, person.phone].filter(Boolean).join(" · ") ||
                        person.summary ||
                        "No contact details"}
                    </div>
                  </div>
                  <StatusPill value="partner" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Client contacts */}
        <section className="section">
          <div className="section-title">
            <h2>Client contacts</h2>
            <span>{contacts.length} recorded</span>
          </div>
          {contacts.length ? (
            <div className="list">
              {contacts.map((person: any) => (
                <Link className="row" href={`/people/${person.id}`} key={person.id}>
                  <div className="row-main">
                    <div className="row-title">{person.name}</div>
                    <div className="row-meta">
                      {[person.email, person.phone].filter(Boolean).join(" · ") ||
                        person.summary ||
                        "No contact details"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              Add Sakshi, client contacts, and collaborators here.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
