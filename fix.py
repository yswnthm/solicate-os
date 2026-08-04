import os

def fix_lib_ai_context():
    path = "lib/ai/context.ts"
    with open(path, "r") as f: content = f.read()
    
    # 1. projects query
    content = content.replace(
        '.select("id, name, code, summary, objective, success_definition, direction, status, started_on, target_date, completed_at, clients(id, name)")',
        '.select("id, name, code, summary, objective, success_definition, direction, status, started_on, target_date, completed_at, people!projects_person_id_fkey(id, name)")'
    )
    # 2. client mapping
    content = content.replace(
        'client: (project.data?.clients as Record<string, unknown> | undefined)?.name ?? null,',
        'client: (project.data?.people as Record<string, unknown> | undefined)?.name ?? null,'
    )
    content = content.replace(
        'clientName: (workspace.project as any).clients?.name ?? null,',
        'clientName: (workspace.project as any).people?.name ?? null,'
    )
    content = content.replace('client: p.clients?.name ?? null,', 'client: p.people?.name ?? null,')
    
    with open(path, "w") as f: f.write(content)

def fix_lib_capture_context():
    path = "lib/capture/context.ts"
    with open(path, "r") as f: content = f.read()
    
    content = content.replace('.select("*, clients(id, name)")', '.select("*, people!projects_person_id_fkey(id, name)")')
    content = content.replace(
        'const { data, error } = await supabase.from("clients").select("id, name").eq("id", input.client_id).maybeSingle();',
        'const { data, error } = await supabase.from("people").select("id, name").eq("id", input.client_id).maybeSingle();'
    )
    content = content.replace('client: clientNameOf(p.clients),', 'client: clientNameOf(p.people),')
    
    with open(path, "w") as f: f.write(content)

def fix_features_ai_actions():
    path = "features/ai-actions.ts"
    with open(path, "r") as f: content = f.read()
    
    content = content.replace(
        'projects: projects.map((p: any) => ({ id: p.id, name: p.name, client: p.clients?.name ?? null })),',
        'projects: projects.map((p: any) => ({ id: p.id, name: p.name, client: p.people?.name ?? null })),'
    )
    
    with open(path, "w") as f: f.write(content)

def fix_features_queries():
    path = "features/queries.ts"
    with open(path, "r") as f: content = f.read()
    
    # getActiveClientsCached
    content = content.replace(
        'const response = await supabase\n      .from("clients")\n      .select("id, name, kind, website_url, summary, relationships!relationships_client_id_fkey(status, type)")\n      .neq("status", "archived")\n      .order("name");',
        'const response = await supabase\n      .from("people")\n      .select("id, name, kind, website_url, summary, relationships!relationships_client_id_fkey(status, type)")\n      .is("archived_at", null)\n      .eq("relationships.type", "client")\n      .neq("relationships.status", "archived")\n      .order("name");'
    )
    
    # getProjectsCached
    content = content.replace(
        '.select("id, name, code, status, target_date, updated_at, started_on, summary, objective, client_id, clients(id, name)")',
        '.select("id, name, code, status, target_date, updated_at, started_on, summary, objective, person_id, people!projects_person_id_fkey(id, name)")'
    )
    
    # getActiveProjectsForSelectCached
    content = content.replace('.select("id, name, clients(id, name)")', '.select("id, name, people!projects_person_id_fkey(id, name)")')
    
    # getTodayData
    content = content.replace('.select("id, name, status, updated_at, clients(name)")', '.select("id, name, status, updated_at, people!projects_person_id_fkey(name)")')
    content = content.replace('.select("id, name, created_at, clients(name)")', '.select("id, name, created_at, people!projects_person_id_fkey(name)")')
    
    # getProjectHeader
    content = content.replace('.select("*, clients(id, name)")', '.select("*, people!projects_person_id_fkey(id, name)")')
    
    # getProjectWorkspace / getProjectWorkspaceForAI
    content = content.replace('supabase.from("projects").select("*, clients(id, name)").eq("id", projectId).maybeSingle(),', 'supabase.from("projects").select("*, people!projects_person_id_fkey(id, name)").eq("id", projectId).maybeSingle(),')
    
    # getPhaseWorkspace
    content = content.replace(
        '.select("id, name, code, status, summary, objective, client_id, clients(id, name)")',
        '.select("id, name, code, status, summary, objective, person_id, people!projects_person_id_fkey(id, name)")'
    )
    
    # getRelationships
    content = content.replace(
        '.select("*, clients(id, name, status, summary), people(id, name, is_partner)")',
        '.select("*, client:people!relationships_client_id_fkey(id, name, kind, website_url, summary), contact:people!relationships_person_id_fkey(id, name, is_partner)")'
    )
    
    # getRelationshipDetail
    content = content.replace(
        '.select("*, clients(id, name, status, summary, website_url), people(id, name, email, phone, is_partner)")',
        '.select("*, client:people!relationships_client_id_fkey(id, name, kind, website_url, summary), contact:people!relationships_person_id_fkey(id, name, email, phone, is_partner)")'
    )
    
    # getClientDetail
    content = content.replace('supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),', 'supabase.from("people").select("*").eq("id", clientId).maybeSingle(),')
    content = content.replace(
        '.select("id, body_md, sent_at, conversation_id, conversations(title, project_id, clients(name))")',
        '.select("id, body_md, sent_at, conversation_id, conversations(title, project_id, people(name))")'
    )
    # wait, conversations(title, project_id, people(name)) -- is that right? In conversations, client_id was renamed to client_id but points to people!
    # so conversations(title, project_id, people(name)) is correct for conversations.
    content = content.replace('conversations(title, project_id, clients(name))', 'conversations(title, project_id, people(name))')
    
    content = content.replace(
        '.select("role, role_label, financial_arrangement, financial_value, currency_code, projects(id, name, status, code, clients(name))")',
        '.select("role, role_label, financial_arrangement, financial_value, currency_code, projects(id, name, status, code, people!projects_person_id_fkey(name))")'
    )
    content = content.replace('.select("role_label, is_primary, clients(id, name, status)")', '.select("id, name, kind, website_url, summary")') # Wait, this was for client_people? client_people is dropped. I'll just change getPersonDetail manually.
    
    # searchRecords
    content = content.replace(
        'supabase.from("projects").select("id, name, code, status, clients(name)").ilike("name", `%${search}%`).limit(10),',
        'supabase.from("projects").select("id, name, code, status, people!projects_person_id_fkey(name)").ilike("name", `%${search}%`).limit(10),'
    )
    
    # getCaptureFormOptions
    content = content.replace('.select("id, name, status, clients(id, name)")', '.select("id, name, status, people!projects_person_id_fkey(id, name)")')
    content = content.replace('supabase.from("clients").select("id, name").neq("status", "archived").order("name")', 'supabase.from("people").select("id, name").is("archived_at", null).eq("kind", "business").order("name")')
    content = content.replace('client: String((p.clients as { name?: unknown } | null | undefined)?.name ?? "") || null,', 'client: String((p.people as { name?: unknown } | null | undefined)?.name ?? "") || null,')
    
    # getFinanceCaptureOptions
    content = content.replace('supabase.from("projects").select("id, name, code, clients(name)").neq("status", "archived").order("name")', 'supabase.from("projects").select("id, name, code, people!projects_person_id_fkey(name)").neq("status", "archived").order("name")')
    content = content.replace('client: String((p.clients as { name?: unknown } | null | undefined)?.name ?? "") || null,', 'client: String((p.people as { name?: unknown } | null | undefined)?.name ?? "") || null,')
    
    with open(path, "w") as f: f.write(content)

fix_lib_ai_context()
fix_lib_capture_context()
fix_features_ai_actions()
fix_features_queries()
