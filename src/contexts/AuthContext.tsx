/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { isCloudEnabled } from '../lib/cloudConfig';

interface AuthContextValue {
  cloudEnabled: boolean;
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  signInAsGuest: () => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cloudEnabled = isCloudEnabled();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(cloudEnabled);

  useEffect(() => {
    if (!cloudEnabled) {
      setLoading(false);
      return;
    }
    const sb = getSupabase()!;
    let cancelled = false;

    const init = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await sb.auth.setSession({ access_token, refresh_token });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      const { data } = await sb.auth.getSession();
      if (!cancelled) {
        setSession(data.session);
        setLoading(false);
      }
    };

    void init();

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [cloudEnabled]);

  const signInAsGuest = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return { error: 'Cloud not configured' };
    const { data: existing } = await sb.auth.getSession();
    if (existing.session) return {};
    const { error } = await sb.auth.signInAnonymously();
    return { error: error?.message };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const redirectTo = `${window.location.origin}/app`;
    const { data: userData } = await sb.auth.getUser();
    if (userData.user?.is_anonymous) {
      await sb.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo },
      });
      return;
    }
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { error: 'Cloud not configured' };
    const { data: userData } = await sb.auth.getUser();
    if (userData.user?.is_anonymous) {
      const { error } = await sb.auth.updateUser({ email });
      if (error) return { error: error.message };
      const { error: otpError } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });
      return { error: otpError?.message };
    }
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  }, []);

  const user = session?.user ?? null;
  const isGuest = user?.is_anonymous === true;

  const value = useMemo(
    () => ({
      cloudEnabled,
      session,
      user,
      isGuest,
      loading,
      signInAsGuest,
      signInWithGoogle,
      signInWithEmail,
      signOut,
    }),
    [cloudEnabled, session, user, isGuest, loading, signInAsGuest, signInWithGoogle, signInWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
