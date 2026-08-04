"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { TransactionForm } from "@/components/finance/transaction-form";

export function TransactionEditButton({
  transaction,
  people,
  categories,
  paymentMethods,
}: {
  transaction: any;
  people: any[];
  categories: any[];
  paymentMethods: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button muted" onClick={() => setIsOpen(true)}>Edit Transaction</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Transaction">
        <TransactionForm
          transaction={transaction}
          people={people}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
