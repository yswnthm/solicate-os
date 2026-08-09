-- 0044: Stillness Co — drop redundant GBP subtask superseded in 0043.
--
-- 0043 split "Claim + complete Google Business Profile" into two planned items
-- (confirm claim/ownership + complete profile) but left the original combined
-- row in place, creating a duplicate at position 1 on task …3027. This removes
-- the superseded row.

delete from public.task_subtasks
where id = '50be067f-7d39-4a8c-9f95-95a0148208ee';
