import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Service-role client: bypasses RLS, must never be imported into client components.
// Created on first use rather than at import, so building the app doesn't need
// the Supabase env vars (Next loads every route module while building; preview
// builds without them failed with "supabaseUrl is required").
export function getSupabaseAdmin(): SupabaseClient {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return client;
}

export const ATTACHMENTS_BUCKET = "attachments";
