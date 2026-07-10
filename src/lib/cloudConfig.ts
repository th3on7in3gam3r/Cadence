/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  ) as string | undefined;
  const anonKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) as string | undefined;
  if (!url?.trim() || !anonKey?.trim()) return null;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function isCloudEnabled(): boolean {
  return getSupabasePublicConfig() !== null;
}
