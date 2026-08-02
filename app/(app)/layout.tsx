import { AppShell } from "@/components/app-shell";
import { requireActiveUser } from "@/lib/auth";

export default async function InternalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await requireActiveUser();
  return <AppShell displayName={profile.display_name}>{children}</AppShell>;
}
