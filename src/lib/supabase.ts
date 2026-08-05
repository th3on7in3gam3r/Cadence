/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig, isCloudEnabled } from './cloudConfig';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        // AuthContext exchanges ?code= explicitly to avoid hydrate races.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

export { isCloudEnabled };
