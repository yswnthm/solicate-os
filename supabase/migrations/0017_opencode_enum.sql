-- 0017: Extend the ai_provider enum with the 'opencode' provider.
-- Split from the seed (0018) because Postgres forbids using a newly-added
-- enum value within the same transaction that adds it.

alter type public.ai_provider add value if not exists 'opencode';
