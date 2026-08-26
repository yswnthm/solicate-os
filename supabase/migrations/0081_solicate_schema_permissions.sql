-- 0081: Grant permissions to solicate schema and expose to PostgREST

BEGIN;

-- 1. Add solicate to pgrst.db_schemas (Supabase PostgREST)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, solicate';

-- 2. Grant usage and access
GRANT USAGE ON SCHEMA solicate TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA solicate TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA solicate TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA solicate TO anon, authenticated, service_role;

-- 3. Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';

COMMIT;
