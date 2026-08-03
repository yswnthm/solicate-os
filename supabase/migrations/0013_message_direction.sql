-- 0013: Message drafter — "direction" field.
--
-- Adds a short operator-supplied direction (message flow — the order and
-- progression of points) to message drafts, and teaches the message-drafter
-- template to honor it. Idempotent: safe to run even if 0011/0012 were already
-- applied.

alter table public.message_drafts add column if not exists direction text not null default '';

-- Wire operator.direction into the message-drafter template (version 1).
update public.ai_template_versions
set
  system_prompt = replace(
    replace(
      replace(
        replace(
          system_prompt,
          '- operator: the operator''s intent, the desired length, the communication styles to use, and any additional context the operator supplied.',
          '- operator: the operator''s intent, the desired length, the communication styles to use, the flow and direction for the message, and any additional context the operator supplied.'
        ),
        '- Honor the requested length and every selected communication style. When operator.additional_context states something, treat it as ground truth.',
        '- Honor the requested length and every selected communication style. Follow operator.direction as the message flow — the order in which points appear and how the message progresses. When operator.additional_context states something, treat it as ground truth.'
      ),
      'a short direction on tone and framing',
      'the flow and direction for the message'
    ),
    'Follow operator.direction (keywords or a phrase on tone and framing) when present.',
    'Follow operator.direction as the message flow — the order in which points appear and how the message progresses.'
  ),
  enabled_variables = replace(
    enabled_variables::text,
    '"additional_context","model"',
    '"additional_context","direction","model"'
  )::jsonb
where template_id = '9a000000-0000-4000-8000-000000000001'
  and version = 1;
