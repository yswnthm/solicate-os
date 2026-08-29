-- 0088: Update Komal / Stillness communication rule (Zero aggressive follow-ups) & passive proposal waiting state

BEGIN;

-- 1. Update Komal's relationship communication rules
UPDATE public.relationships
SET
  summary = 'Komal (Stillness Curated Retreats). Somatic anchoring retreats, sound journeys, and Hawaii wellness retreats. Communication Rule: Zero aggressive or unprompted follow-ups. Komal evaluates on her own schedule, consults her marketing team, and replies directly when ready.',
  terms_note = 'Bundled invoicing cycle every 1–2 months for minor add-ons to minimize transaction deductions. Interactive Diagnostic Quiz proposal sent (Aug 13/24); awaiting client-initiated response.'
WHERE id = '19e566b8-b2a9-4e7a-813a-a30b21da4e8a';

-- 2. Update Quiz task from active nag to passive awaiting state
UPDATE public.tasks
SET
  title = 'Awaiting Komal decision on Interactive Diagnostic Quiz proposal (no follow-up — client initiates when ready)',
  priority = 'low',
  description_md = 'Proposal sent Aug 13 (interactive-diagnostic-quiz.pdf) and add-ons sent Aug 24 (interactive-diagnostic-quiz-addons.pdf). Komal asked for a few days to evaluate. Per established client communication preference: DO NOT send follow-up reminders. Let Komal reply when ready.'
WHERE id = '1ce4a5c0-0000-4000-8000-000000003040';

-- 3. Update subtasks to passive waiting
UPDATE public.task_subtasks
SET
  title = 'Await Komal response on quiz proposal (no follow-up reminders)'
WHERE id = '1ce4a5c0-0000-4000-8000-000000008201';

COMMIT;
