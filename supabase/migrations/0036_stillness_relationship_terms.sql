-- 0036: Stillness Co — attach Sakshi commission terms to the relationship row.
--
-- 0035 guarded its relationship INSERT with `where not exists(... client_id)` so
-- a pre-existing runtime-created relationship (bare: no summary, financial
-- arrangement 'none') was left untouched. This backfills the terms onto
-- whichever relationship row exists for the client. Idempotent + portable:
-- on a fresh environment 0035 inserts the deterministic row (…801) and this
-- update is a no-op; here it enriches the runtime row.

update public.relationships
set summary = $str$Stillness Co entered via Sakshi (referral partner / graphic designer). Contract signed 10 Feb 2026. ₹10,000 commission on the ₹25,000 redesign paid & cleared — recorded in the finance ledger (transaction 1ce4a5c0-…-000608).$str$,
    communication_mode = 'shared',
    financial_arrangement = 'revenue_share',
    referral_commission = 10000.00,
    commission_currency = 'INR',
    payment_status = 'paid',
    terms_note = $str$Commission = 40% of the ₹25k redesign. Further per-phase splits decided by Solicate per work; partnership record at partnerships/Sakshi/Sakshi.md.$str$
where client_id = '1ce4a5c0-0000-4000-8000-000000000001'
  and person_id = '1ce4a5c0-0000-4000-8000-000000000012';

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT id, type, source, summary, financial_arrangement, referral_commission,
--        commission_currency, payment_status
-- FROM relationships WHERE client_id = '1ce4a5c0-0000-4000-8000-000000000001';
