const fs = require('fs');
let content = fs.readFileSync('features/queries.ts', 'utf8');

// Replace .from("clients") -> .from("people")
content = content.replace(/\.from\("clients"\)/g, '.from("people")');

// Replace clients(id, name) on projects with people!projects_person_id_fkey(id, name)
content = content.replace(/clients\(id, name\)/g, 'people!projects_person_id_fkey(id, name)');
content = content.replace(/clients\(name\)/g, 'people!projects_person_id_fkey(name)');

// In getActiveClientsCached:
content = content.replace(
  /\.from\("people"\)\s*\n\s*\.select\("id, name, kind, website_url, summary, relationships!relationships_client_id_fkey\(status, type\)"\)/,
  '.from("people")\n      .select("id, name, kind, website_url, summary, relationships!relationships_client_id_fkey(status, type)")\n      .is("archived_at", null)\n      .eq("relationships.type", "client")\n      .neq("relationships.status", "archived")\n      .order("name");\n    throwOnError(response.error);\n    return response.data ?? [];\n  },\n  ["get-active-clients"],\n  { revalidate: 60, tags: ["clients"] },\n);'
);

// We need to carefully revert getActiveClients() to the new people query from before:
/* 
    const response = await supabase
      .from("people")
      .select("id, name, kind, website_url, summary, relationships!relationships_client_id_fkey(status, type)")
      .is("archived_at", null)
      .eq("relationships.type", "client")
      .neq("relationships.status", "archived")
      .order("name");
*/
// Actually, I'll just write it manually later if the script gets messy.

// client_id -> person_id on projects
content = content.replace(/client_id, people!projects_person_id_fkey/g, 'person_id, people!projects_person_id_fkey');

// client: p.clients -> client: p.people
content = content.replace(/p\.clients/g, 'p.people');

// Any remaining clients(id, name, status, summary) etc.
content = content.replace(/clients\(id, name, status, summary\)/g, 'client:people!relationships_client_id_fkey(id, name, kind, website_url, summary)');
content = content.replace(/clients\(id, name, status, summary, website_url\)/g, 'client:people!relationships_client_id_fkey(id, name, kind, website_url, summary)');
content = content.replace(/clients\(id, name, status\)/g, 'client:people!relationships_client_id_fkey(id, name, kind)');

// getCaptureFormOptions:
content = content.replace(/\.from\("people"\)\.select\("id, name"\)\.neq\("status", "archived"\)/, '.from("people").select("id, name").is("archived_at", null).eq("kind", "business")');

// Replace contact:people!relationships_person_id_fkey
content = content.replace(/people\(id, name, is_partner\)/g, 'contact:people!relationships_person_id_fkey(id, name, is_partner)');
content = content.replace(/people\(id, name, email, phone, is_partner\)/g, 'contact:people!relationships_person_id_fkey(id, name, email, phone, is_partner)');

fs.writeFileSync('features/queries.ts', content);
