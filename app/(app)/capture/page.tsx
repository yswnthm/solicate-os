export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCaptureFormOptions } from "@/features/queries";
import { PageHeader } from "@/components/page-header";
import { CaptureFlow } from "@/components/capture/capture-flow";

export default async function CapturePage() {
  const options = await getCaptureFormOptions();

  return (
    <>
      <PageHeader
        title="Capture"
        description="Tell the operating system what happened in plain language. It proposes every update — you review before anything is written."
      >
        <Link href="/finance/capture" className="button muted">
          Finance Capture →
        </Link>
      </PageHeader>
      <CaptureFlow options={options} />
    </>
  );
}
