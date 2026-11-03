import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return readSupabaseEnv() !== null;
}

/**
 * Anonymous, server-side Supabase client.
 *
 * There are no authenticated users, so no cookie/session handling is needed.
 * Access is controlled by RLS and by the two RPC functions defined in the
 * migration.
 */
export function createSupabaseServerClient() {
  const env = readSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
