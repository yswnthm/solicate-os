import { AiNav } from "@/components/ai/ai-nav";
import { PageHeader } from "@/components/page-header";

export default async function AiSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="AI"
        description="The engine behind Capture, Triage, Morning Brief, and Finance Capture — templates, models, and provider keys."
      />
      <AiNav />
      {children}
    </>
  );
}
