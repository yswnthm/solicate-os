BEGIN;

-- 1. CYCDesign: project name CYCDesign, owner Navi (2f9e3d70-0000-4000-8000-000000000011)
UPDATE projects
SET name = 'CYCDesign', person_id = '2f9e3d70-0000-4000-8000-000000000011'
WHERE id = '2f9e3d70-0000-4000-8000-000000000021';

-- 2. Stillness: project name Stillness, owner Komal (1ce4a5c0-0000-4000-8000-000000000011)
UPDATE projects
SET name = 'Stillness', person_id = '1ce4a5c0-0000-4000-8000-000000000011'
WHERE id = '1ce4a5c0-0000-4000-8000-000000000021';

-- 3. Colleen Munn: project name Colleen Munn, owner Colleen Munn (c011eec0-0000-4000-8000-000000000001)
UPDATE projects
SET name = 'Colleen Munn'
WHERE id = 'c011eec0-0000-4000-8000-000000000021';

-- 4. Sakshi is person, partner with these three projects.
UPDATE people SET is_partner = true WHERE id = '1ce4a5c0-0000-4000-8000-000000000012';

DELETE FROM project_participants WHERE person_id = '1ce4a5c0-0000-4000-8000-000000000012';

INSERT INTO project_participants (project_id, person_id, role)
VALUES 
  ('2f9e3d70-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000012', 'partner'),
  ('1ce4a5c0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000012', 'partner'),
  ('c011eec0-0000-4000-8000-000000000021', '1ce4a5c0-0000-4000-8000-000000000012', 'partner');

COMMIT;
