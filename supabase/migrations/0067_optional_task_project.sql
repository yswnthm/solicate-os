-- 0067: Allow global unassigned tasks (project_id nullable) and update activity triggers

BEGIN;

-- 1. Make tasks.project_id optional so tasks can belong to global agency backlog
ALTER TABLE public.tasks ALTER COLUMN project_id DROP NOT NULL;

-- 2. Update task creation activity trigger to guard against null project_id
CREATE OR REPLACE FUNCTION public.log_task_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.project_id IS NOT NULL THEN
    INSERT INTO public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    VALUES (new.project_id, coalesce(auth.uid(), (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1)), 'task', new.id, 'created', 'Created task: ' || new.title);
  END IF;
  RETURN new;
END;
$$;

-- 3. Update task updated activity trigger to guard against null project_id
CREATE OR REPLACE FUNCTION public.log_task_updated() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event public.activity_event_type;
  v_summary text;
  v_user uuid;
BEGIN
  IF new.project_id IS NOT NULL THEN
    IF new.status IS DISTINCT FROM old.status THEN
      v_event := CASE new.status
        WHEN 'done' THEN 'completed'::public.activity_event_type
        WHEN 'cancelled' THEN 'cancelled'::public.activity_event_type
        ELSE 'updated'::public.activity_event_type
      END;
      v_summary := 'Task ' || replace(new.status::text, '_', ' ');
    ELSE
      v_event := 'updated'::public.activity_event_type;
      v_summary := 'Updated task details';
    END IF;

    v_user := coalesce(auth.uid(), (SELECT id FROM public.app_users WHERE is_active = true ORDER BY created_at LIMIT 1));
    INSERT INTO public.activity_events (project_id, actor_id, record_type, record_id, event_type, summary)
    VALUES (new.project_id, v_user, 'task', new.id, v_event, v_summary);
  END IF;
  RETURN new;
END;
$$;

COMMIT;
