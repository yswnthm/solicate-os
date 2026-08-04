import { describe, expect, it } from "vitest";

import { transactionSchema, allocationSchema } from "@/lib/validation";

const UUID = "6f0c2c0e-7b3d-4a6f-8e9c-1234567890ab";

// The edit schema treats every nullable FK/date as a required key (accepting
// string | null | undefined), so a valid input must carry them explicitly.
const baseIds = {
  transaction_date: null,
  invoice_date: null,
  invoice_sent_at: null,
  invoice_cleared_at: null,
  category_id: null,
  payment_method_id: null,
  from_person_id: null,
  from_user_id: null,
  to_person_id: null,
  to_user_id: null,
};

describe("transactionSchema", () => {
  it("parses a valid transaction with a coerced numeric amount", () => {
    const parsed = transactionSchema.parse({ type: "income", amount: "50000", ...baseIds });
    expect(parsed.type).toBe("income");
    expect(parsed.amount).toBe(50000);
    expect(parsed.currency_code).toBe("INR");
  });

  it("rejects negative, zero, and non-finite amounts", () => {
    for (const amount of [-1, 0, Infinity, NaN]) {
      expect(() => transactionSchema.parse({ type: "expense", amount, ...baseIds })).toThrow();
    }
  });

  it("rejects an unknown type", () => {
    expect(() => transactionSchema.parse({ type: "salary", amount: 10, ...baseIds })).toThrow();
  });

  it("accepts invoice_status from the lifecycle enum (type restriction is a DB check)", () => {
    expect(() =>
      transactionSchema.parse({ type: "income", amount: 10, invoice_status: "preparing", ...baseIds }),
    ).not.toThrow();
    expect(() =>
      transactionSchema.parse({ type: "expense", amount: 10, invoice_status: "preparing", ...baseIds }),
    ).not.toThrow();
    expect(() =>
      transactionSchema.parse({ type: "income", amount: 10, invoice_status: "paid", ...baseIds }),
    ).toThrow();
  });
});

describe("allocationSchema", () => {
  it("parses a valid allocation and defaults target to project", () => {
    const parsed = allocationSchema.parse({ transaction_id: UUID, project_id: UUID, phase_id: null, amount: 2500 });
    expect(parsed.target).toBe("project");
  });

  it("rejects an allocation with no money attached", () => {
    expect(() => allocationSchema.parse({ transaction_id: UUID, project_id: UUID, phase_id: null, amount: 0 })).toThrow();
  });

  it("rejects a transaction_id that is not a uuid", () => {
    expect(() => allocationSchema.parse({ transaction_id: "nope", project_id: UUID, phase_id: null, amount: 10 })).toThrow();
  });
});
