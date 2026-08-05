export const dynamic = "force-dynamic";

import { getAllModels } from "@/lib/ai";
import { listTemplates } from "@/lib/ai/template-store";
import { isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { isGroqConfigured } from "@/lib/ai/providers/groq";
import { isOpencodeConfigured } from "@/lib/ai/providers/opencode";
import { AiSettingsPanel } from "@/components/ai-settings-section";
import { PageHeader } from "@/components/page-header";
import { requireActiveUser } from "@/lib/auth";

export default async function AiSettingsPage() {
  await requireActiveUser();
  const [models, templates] = await Promise.all([getAllModels(), listTemplates()]);
  const providers = [
    { name: "Groq", key: "GROQ_API_KEY", configured: isGroqConfigured(), home: "console.groq.com" },
    { name: "Gemini", key: "GEMINI_API_KEY", configured: isGeminiConfigured(), home: "ai.google.dev" },
    { name: "Opencode Zen", key: "OPENCODE_API_KEY", configured: isOpencodeConfigured(), home: "opencode.ai/auth" },
  ];

  return (
    <>
      <PageHeader
        title="AI"
        description="The engine behind Capture, Triage, Morning Brief, and Finance Capture — templates, models, and provider keys."
      />
      <AiSettingsPanel templates={templates} models={models} providers={providers} />
    </>
  );
}
