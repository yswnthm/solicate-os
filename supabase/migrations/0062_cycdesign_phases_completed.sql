-- 0062: CYCDesign — Mark Phase 1 (Etsy catalog) and Phase 2 (WordPress trial) as completed

BEGIN;

-- Fix log_record_history to safely fall back to an active internal app_user when auth.uid() is null (e.g. migrations / direct admin executions)
create or replace function public.log_record_history() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_before jsonb;
  v_after  jsonb;
  v_diff   jsonb := '{}';
  v_key    text;
  v_old    jsonb;
  v_new    jsonb;
  v_user   uuid;
begin
  v_before := to_jsonb(old) - 'created_at' - 'updated_at' - 'created_by_id' - 'updated_by_id';
  v_after  := to_jsonb(new) - 'created_at' - 'updated_at' - 'created_by_id' - 'updated_by_id';

  for v_key in
    select k from (
      select jsonb_object_keys(v_before) as k
      union
      select jsonb_object_keys(v_after) as k
    ) keys
  loop
    v_old := v_before -> v_key;
    v_new := v_after  -> v_key;
    if v_old is distinct from v_new then
      v_diff := jsonb_set(v_diff, array[v_key], jsonb_build_object('from', v_old, 'to', v_new));
    end if;
  end loop;

  if v_diff <> '{}'::jsonb then
    v_user := coalesce(auth.uid(), (select id from public.app_users where is_active = true order by created_at limit 1));
    insert into public.record_history (entity_type, entity_id, changed_by_id, diff)
    values (TG_ARGV[0]::public.entity_type, new.id, v_user, v_diff);
  end if;

  return new;
end;
$$;

-- 1. Complete Phase 1 (Etsy catalog)
UPDATE public.phases
SET status = 'completed',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '2f9e3d70-0000-4000-8000-000000001000';

-- 2. Complete Phase 2 (WordPress trial)
UPDATE public.phases
SET status = 'completed',
    completed_at = COALESCE(completed_at, NOW())
WHERE id = '2f9e3d70-0000-4000-8000-000000001001';

-- 3. Resolve any blocking tasks related to Etsy listings and WordPress photos
UPDATE public.tasks
SET status = 'done',
    completed_at = COALESCE(completed_at, NOW())
WHERE id IN (
  '2f9e3d70-0000-4000-8000-000000008001', -- Etsy listing data incomplete
  '2f9e3d70-0000-4000-8000-000000008002'  -- WordPress products await 3-photo sets
);

-- 4. Record milestone entry
INSERT INTO public.entries (
  id, project_id, type, title, body_md, occurred_at, triage_state, created_by_id
) VALUES (
  gen_random_uuid(),
  '2f9e3d70-0000-4000-8000-000000000021',
  'milestone',
  'Phase 1 (Etsy catalog) & Phase 2 (WordPress trial) completed',
  $str$Both Phase 1 (Etsy catalog pass: 24 listings consistency pass) and Phase 2 (WordPress trial: 25 dress products uploaded with SEO descriptions, attributes, and 3-angle photos) have been marked completed.$str$,
  NOW(),
  'filed',
  (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)
);

COMMIT;
