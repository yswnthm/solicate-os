import { Section } from "@/components/shared/section";
import { EntryList, TimelineList, type Entry, type EntryEditContext } from "@/components/entries/entry-list";

export function EntriesSection({
  title,
  entries,
  edit,
  types,
  timeline = false,
  empty = "Nothing recorded here yet.",
  defaultOpen = true,
}: {
  title: string;
  entries: Entry[];
  edit?: EntryEditContext;
  types?: string[];
  timeline?: boolean;
  empty?: string;
  defaultOpen?: boolean;
}) {
  const filtered = types ? entries.filter((e) => types.includes(e.type)) : entries;
  return (
    <Section title={title} count={filtered.length} defaultOpen={defaultOpen}>
      {filtered.length ? (
        timeline ? (
          <TimelineList entries={filtered} edit={edit} />
        ) : (
          <EntryList entries={filtered} edit={edit} />
        )
      ) : (
        <div className="empty">{empty}</div>
      )}
    </Section>
  );
}
