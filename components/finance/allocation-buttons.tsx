"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { AllocationForm } from "@/components/finance/allocation-form";

export function AllocationAddButton({
  transactionId,
  projects,
  phases,
}: {
  transactionId: string;
  projects: any[];
  phases: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button muted small" onClick={() => setIsOpen(true)}>Add Allocation</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Allocation">
        <AllocationForm
          transactionId={transactionId}
          projects={projects}
          phases={phases}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}

export function AllocationEditButton({
  transactionId,
  allocation,
  projects,
  phases,
}: {
  transactionId: string;
  allocation: any;
  projects: any[];
  phases: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button muted minimal" style={{ marginTop: "0.25rem" }} onClick={() => setIsOpen(true)}>Edit</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Allocation">
        <AllocationForm
          transactionId={transactionId}
          allocation={allocation}
          projects={projects}
          phases={phases}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
