/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabase } from './supabase';

/** Client token: Supabase session (cloud) or legacy CMO_API_TOKEN (local dev). */
export async function resolveAuthToken(): Promise<string | undefined> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }
  const legacy = import.meta.env.VITE_CMO_API_TOKEN as string | undefined;
  return legacy?.trim() || undefined;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await resolveAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, { ...init, headers });
}
