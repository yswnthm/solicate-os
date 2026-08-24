-- 0076: CYCDesign - Update Sakshi partner commission for Phase 3 to 1,500 INR

BEGIN;

-- 1. Update Sakshi transaction amount to 1,500 INR
UPDATE public.transactions
SET amount = 1500.00,
    notes = 'Sakshi partner referral share for Phase 3 Accessories deal (1,500 INR).'
WHERE id = '2f9e3d70-0000-4000-8000-000000000602';

-- 2. Update transaction allocation to 1,500 INR
UPDATE public.transaction_allocations
SET amount = 1500.00,
    notes = 'Sakshi referral partner commission for Phase 3 Accessories'
WHERE id = '2f9e3d70-0000-4000-8000-000000000612';

-- 3. Update milestone entry
UPDATE public.entries
SET title = 'Phase 3 Approved & Activated - Accessories & Bags (9,500 INR / 1,500 INR Sakshi Share)',
    body_md = '**Phase 3 Deal Closed & Activated on 24 Aug 2026:**\n\n* **Commercial Value:** 9,500 INR (~$150 CAD) booked to revenue pipeline.\n* **Partner Allocation:** 1,500 INR referral share allocated to Sakshi.\n* **Scope:** 15 listings across Etsy and WordPress (Purses, Clutches, Envelopes, Elephant motifs).\n* **Execution Model:** Solicate leads SEO research, copywriting, master sheet, 2 live benchmarks, and training; Metta assists with data entry uploads.'
WHERE id = '2f9e3d70-0000-4000-8000-000000006036';

COMMIT;
