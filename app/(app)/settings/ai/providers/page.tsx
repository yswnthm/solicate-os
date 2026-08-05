export const dynamic = "force-dynamic";

import Link from "next/link";
import { isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { isGroqConfigured } from "@/lib/ai/providers/groq";
import { isOpencodeConfigured } from "@/lib/ai/providers/opencode";
import { requireActiveUser } from "@/lib/auth";

export default async function AiProvidersPage() {
  await requireActiveUser();
  const providers = [
    { name: "Groq", key: "GROQ_API_KEY", configured: isGroqConfigured(), home: "console.groq.com" },
    { name: "Gemini", key: "GEMINI_API_KEY", configured: isGeminiConfigured(), home: "ai.google.dev" },
    { name: "Opencode Zen", key: "OPENCODE_API_KEY", configured: isOpencodeConfigured(), home: "opencode.ai/auth" },
  ];

  return (
    <section className="card">
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
            <Link
              className="button ghost small"
              href={p.configured ? p.home : `https://${p.home}`}
              target="_blank"
              rel="noreferrer"
            >
              {p.configured ? "Manage" : "Get key"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
