import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase URL with multiple fallback aliases and localStorage override
export const resolveSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('celestia_supabase_url')?.trim();
    if (override) return override.replace(/\/+$/, '');
  }
  const env = (
    import.meta.env.VITE_SUPABASE_URL ||
    (import.meta.env as Record<string, string | undefined>).SUPABASE_URL ||
    (import.meta.env as Record<string, string | undefined>).VITE_SUPABASE_PROJECT_URL
  )?.trim();
  return (env || '').replace(/\/+$/, '');
};

// Retrieve Supabase Publishable / Anon Key with multiple fallback aliases and localStorage override
export const resolveSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('celestia_supabase_anon_key')?.trim();
    if (override) return override;
  }
  const env = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta.env as Record<string, string | undefined>).SUPABASE_ANON_KEY ||
    (import.meta.env as Record<string, string | undefined>).SUPABASE_PUBLISHABLE_KEY ||
    (import.meta.env as Record<string, string | undefined>).VITE_SUPABASE_KEY
  )?.trim();
  return env || '';
};

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseAnonKey();

/**
 * Checks whether Supabase credentials are provided and valid in format
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length >= 20
);

/**
 * Diagnostic status for UI/Admin settings display
 */
export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  maskedUrl: string | null;
  isLocalStorageOverride: boolean;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const currentUrl = resolveSupabaseUrl();
  const currentKey = resolveSupabaseAnonKey();
  const isLocal = typeof window !== 'undefined' && Boolean(localStorage.getItem('celestia_supabase_url'));

  return {
    isConfigured: Boolean(currentUrl && currentKey && currentUrl.startsWith('http') && currentKey.length >= 20),
    hasUrl: Boolean(currentUrl),
    hasAnonKey: Boolean(currentKey),
    maskedUrl: currentUrl ? currentUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    isLocalStorageOverride: isLocal,
  };
};

/**
 * Supabase client instance.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Update custom credentials in localStorage for instant browser connectivity
 */
export function setCustomSupabaseCredentials(url: string, key: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = key.trim();
  if (cleanUrl) {
    localStorage.setItem('celestia_supabase_url', cleanUrl);
  }
  if (cleanKey) {
    localStorage.setItem('celestia_supabase_anon_key', cleanKey);
  }
  return true;
}

/**
 * Clears custom credentials from localStorage
 */
export function clearCustomSupabaseCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('celestia_supabase_url');
  localStorage.removeItem('celestia_supabase_anon_key');
}

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
        message: `Auth response: ${error.message}`,
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
