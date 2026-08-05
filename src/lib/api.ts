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

async function refreshAuthToken(): Promise<string | undefined> {
  const sb = getSupabase();
  if (!sb) return undefined;
  const { data, error } = await sb.auth.refreshSession();
  if (error || !data.session?.access_token) return undefined;
  return data.session.access_token;
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

  let res = await fetch(input, { ...init, headers });

  // After OAuth / tab sleep, the access token can be stale while refresh still works.
  if ((res.status === 401 || res.status === 403) && token && getSupabase()) {
    const refreshed = await refreshAuthToken();
    if (refreshed && refreshed !== token) {
      headers.set('Authorization', `Bearer ${refreshed}`);
      res = await fetch(input, { ...init, headers });
    }
  }

  return res;
}
