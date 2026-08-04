"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { TransactionForm } from "./transaction-form";

export function AddTransactionButton({
  people,
  categories,
  paymentMethods,
}: {
  people: { id: string; name: string }[];
  categories: { id: string; name: string; transaction_type: string }[];
  paymentMethods: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button primary" onClick={() => setIsOpen(true)}>
        Add Transaction
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add manual transaction">
        <TransactionForm
          people={people}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
