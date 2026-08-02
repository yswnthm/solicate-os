"use client";

import { useState } from "react";
import { Modal } from "./modal";

export function ModalTrigger({
  buttonLabel,
  title,
  children,
  buttonClass = "button small",
}: {
  buttonLabel: string | React.ReactNode;
  title: string;
  children: React.ReactNode;
  buttonClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={buttonClass} onClick={() => setIsOpen(true)}>
        {buttonLabel}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {/* Capture submit at the container level so it works regardless of form nesting */}
        <div
          onSubmit={() => {
            // Close modal slightly after submit so the Server Action fires first
            setTimeout(() => setIsOpen(false), 80);
          }}
        >
          {children}
        </div>
      </Modal>
    </>
  );
}
