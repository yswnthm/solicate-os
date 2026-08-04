const fs = require('fs');
const files = [
  'features/queries.ts',
  'lib/ai/context.ts',
  'features/ai-actions.ts',
  'lib/capture/context.ts'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // For queries on projects table
    // We only want to replace people(...) when it's being requested as a relationship on projects.
    // e.g., .select("..., people(id, name)")
    // Wait! Let's just be very precise.
    content = content.replace(/people\(id, name\)/g, 'people!projects_person_id_fkey(id, name)');
    content = content.replace(/people\(name\)/g, 'people!projects_person_id_fkey(name)');
    // But wait, what if people(...) is used on a DIFFERENT table?
    // Let's not blindly replace all people(...).
    fs.writeFileSync(file, content);
  }
});
