import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Vite client apps
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

/**
 * Checks whether Supabase environment variables are properly provided.
 * Does not check connectivity, only credential format and presence.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

/**
 * Diagnostic status for UI/Admin settings display
 */
export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  maskedUrl: string | null;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    maskedUrl: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
  };
};

/**
 * Supabase client instance.
 * If credentials are missing or invalid, this is null.
 * Application logic checks `supabase` or `isSupabaseConfigured` before calling Supabase APIs,
 * falling back gracefully to offline local storage / mock state without throwing runtime errors.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Safe helper to obtain the client or throw a readable error if unconfigured.
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }
  return supabase;
}

/**
 * Diagnostic helper to verify whether the client can communicate with Supabase.
 * Performs a lightweight auth session check (no database table required yet).
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  url: string | null;
}> {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client is not configured.',
      url: null,
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        success: false,
        message: `Auth endpoint response: ${error.message}`,
        url: supabaseUrl || null,
      };
    }
    return {
      success: true,
      message: 'Successfully connected to Supabase project.',
      url: supabaseUrl || null,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      url: supabaseUrl || null,
    };
  }
}
