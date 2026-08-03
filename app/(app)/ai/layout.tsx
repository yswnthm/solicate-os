import { AiNav } from "@/components/ai-nav";
import { requireActiveUser } from "@/lib/auth";

export default async function AiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireActiveUser();
  return (
    <>
      <AiNav />
      <div style={{ marginTop: 20 }}>{children}</div>
    </>
  );
}
