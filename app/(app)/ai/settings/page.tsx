export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/page-header";
import { ModelManagement } from "@/components/model-management";
import { requireActiveUser } from "@/lib/auth";
import { getAllModels } from "@/lib/ai";
import { isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { isGroqConfigured } from "@/lib/ai/providers/groq";
import { isOpencodeConfigured } from "@/lib/ai/providers/opencode";

export default async function AiSettingsPage() {
  await requireActiveUser();
  const models = await getAllModels();
  const providers = [
    { name: "Groq", key: "GROQ_API_KEY", configured: isGroqConfigured(), home: "console.groq.com" },
    { name: "Gemini", key: "GEMINI_API_KEY", configured: isGeminiConfigured(), home: "ai.google.dev" },
    { name: "Opencode Zen", key: "OPENCODE_API_KEY", configured: isOpencodeConfigured(), home: "opencode.ai/auth" },
  ];

  return (
    <>
      <PageHeader
        title="AI settings"
        description="Provider keys, the model catalog, and how the execution engine resolves a model at runtime."
      />
      <div className="stack">
        <section className="section">
          <div className="section-title">
            <h2>Model catalog</h2>
            <span>Active models are available as template defaults and fallbacks</span>
          </div>
          <ModelManagement models={models} />
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Provider keys</h2>
            <span>Read from server environment variables, never stored in the database</span>
          </div>
          <div className="list">
            {providers.map((p) => (
              <div className="row" key={p.name}>
                <span className={`pill ${p.configured ? "active" : ""}`}>{p.configured ? "configured" : "missing"}</span>
                <div className="row-main">
                  <div className="row-title">{p.name}</div>
                  <div className="row-meta">
                    {p.key} · {p.home}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>How to add a key</h3>
          <div className="prose" style={{ fontSize: 14 }}>
            <ol>
              <li>
                Create an API key for the provider and add it to your <code>.env.local</code> file.
              </li>
              <li>
                Restart the dev server. The key is read on the server only, so clients never see it.
              </li>
              <li>
                Add any model ID to the catalog above, then point a template&apos;s default model at it.
              </li>
            </ol>
          </div>
        </section>

        <section className="card">
          <h3>How the engine picks a model</h3>
          <p style={{ fontSize: 14 }}>
            A template declares a <code>default_model</code>. When that model isn&apos;t active in the catalog, the
            engine falls back to the first active model. Every AI feature in Solicate runs through the same pipeline:
            template → context → model → output.
          </p>
        </section>
      </div>
    </>
  );
}
