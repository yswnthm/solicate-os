import { AppShell } from "@/components/app-shell";
import { requireActiveUser } from "@/lib/auth";
import { getInboxCount } from "@/features/queries";

export default async function InternalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireActiveUser();
  const inboxCount = await getInboxCount();
  return (
    <AppShell displayName={profile.display_name} inboxCount={inboxCount}>
      {children}
    </AppShell>
  );
}
