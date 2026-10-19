import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseSchema } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

/**
 * Fetch remote state from Supabase if configured.
 * Returns null if not configured or table does not exist yet.
 */
export async function fetchRemoteState(): Promise<DatabaseSchema | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('app_state')
      .select('data')
      .eq('key', 'memorise_db')
      .maybeSingle();

    if (error || !data || !data.data) {
      return null;
    }

    return data.data as DatabaseSchema;
  } catch (err) {
    console.warn('Supabase fetchRemoteState warning:', err);
    return null;
  }
}

/**
 * Save state to Supabase in the background.
 */
export async function persistRemoteState(db: DatabaseSchema): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from('app_state')
      .upsert({
        key: 'memorise_db',
        data: db,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.warn('Supabase persistRemoteState error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase persistRemoteState warning:', err);
    return false;
  }
}
