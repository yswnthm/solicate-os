-- 0034: Deprecate finance_items_legacy (Database Handoff §5.3).
--
-- 0024 hard cut-over migrated finance_items → transactions/transaction_allocations
-- and renamed the old table to finance_items_legacy. All application write paths
-- to it are now removed (capture executor legacy branches, createFinanceItem,
-- updateFinanceItem, financeItemSchema). This renames the table to a
-- _deprecated suffix so any accidental future reference fails loudly instead
-- of silently writing to a shadow ledger.
--
-- Drop it entirely once historical validation is complete — the data lives on
-- in transactions/transaction_allocations (0024 migration).

alter table public.finance_items_legacy rename to finance_items_legacy_deprecated;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name = 'finance_items_legacy_deprecated';
-- SELECT count(*) FROM finance_items_legacy_deprecated;  -- historical rows intact
