// Test phaseSchema parsing with realistic values
import { z } from "zod";

const req = (message) => z.string().trim().min(1, message);

const optDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null));

const phaseSchema = z
  .object({
    project_id: z.string().uuid(),
    name: req("Phase name is required."),
    description: z.string().trim(),
    position: z.coerce.number().int().min(1, "Position must be at least 1."),
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]),
    started_on: optDate,
    target_date: optDate,
  })
  .superRefine((data, ctx) => {
    if (data.started_on && data.target_date && data.target_date < data.started_on) {
      ctx.addIssue({
        code: "custom",
        path: ["target_date"],
        message: "Target date can't be before the start date.",
      });
    }
  });

// Simulating what normalize(record) returns for Phase 1 - Etsy catalog
const values = {
  project_id: "2f9e3d70-0000-4000-8000-000000000021",
  name: "Phase 1 — Etsy catalog TEST",  // User changed the name
  description: "Etsy shop consistency pass: 4 existing + 20 new listings, plus-size only, US market. ₹5,000 deal closed via Sakshi.",
  position: 1,  // Number (from normalize/useState)
  status: "active",
  started_on: "2026-07-04",
  target_date: "",  // Empty string (no target date set)
};

console.log("Input values:", JSON.stringify(values, null, 2));

const parsed = phaseSchema.safeParse(values);

if (parsed.success) {
  console.log("\n✅ Parse SUCCESS!");
  console.log("Parsed data:", JSON.stringify(parsed.data, null, 2));
} else {
  console.log("\n❌ Parse FAILED!");
  console.log("Errors:", JSON.stringify(parsed.error.issues, null, 2));
}

// Also test with empty description (if phase has no description)
console.log("\n--- Testing with empty description ---");
const values2 = { ...values, description: "", started_on: "" };
const parsed2 = phaseSchema.safeParse(values2);
if (parsed2.success) {
  console.log("✅ Empty description: Parse SUCCESS!", JSON.stringify(parsed2.data, null, 2));
} else {
  console.log("❌ Empty description: Parse FAILED!", JSON.stringify(parsed2.error.issues, null, 2));
}

// Test with position as string (from number input onChange)
console.log("\n--- Testing with position as string ---");
const values3 = { ...values, position: "1" };
const parsed3 = phaseSchema.safeParse(values3);
if (parsed3.success) {
  console.log("✅ Position as string: Parse SUCCESS!", JSON.stringify(parsed3.data, null, 2));
} else {
  console.log("❌ Position as string: Parse FAILED!", JSON.stringify(parsed3.error.issues, null, 2));
}
