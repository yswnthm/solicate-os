export const dynamic = "force-dynamic";

import { getAllModels } from "@/lib/ai";
import { listTemplates } from "@/lib/ai/template-store";
import { isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { isGroqConfigured } from "@/lib/ai/providers/groq";
import { isOpencodeConfigured } from "@/lib/ai/providers/opencode";
import { AiOverview } from "@/components/ai/ai-overview";
import { requireActiveUser } from "@/lib/auth";

export default async function AiSettingsOverviewPage() {
  await requireActiveUser();
  const [templates, models] = await Promise.all([listTemplates(), getAllModels()]);
  const providers = [
    { name: "Groq", key: "GROQ_API_KEY", configured: isGroqConfigured(), home: "console.groq.com" },
    { name: "Gemini", key: "GEMINI_API_KEY", configured: isGeminiConfigured(), home: "ai.google.dev" },
    { name: "Opencode Zen", key: "OPENCODE_API_KEY", configured: isOpencodeConfigured(), home: "opencode.ai/auth" },
  ];

  return <AiOverview templates={templates} models={models} providers={providers} />;
}
