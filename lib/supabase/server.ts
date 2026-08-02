import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

// Request-scoped: every query/action/auth call in a single request reuses
// one client and one cookie read instead of constructing a fresh one.
export const createSupabaseServerClient = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables.");

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot set cookies. */ }
      },
    },
  });
});

// Session access token for cache-scope queries. "unstable_cache" functions cannot
// read cookies, so callers must pull the token here (outside the cache scope) and
// pass it in as an argument.
export const getAccessToken = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

// Cookie-free client for use inside unstable_cache: auth flows through the JWT in
// the Authorization header, so RLS still scopes rows to the requesting user.
export function createSupabaseServerClientWithToken(accessToken: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  });
}
