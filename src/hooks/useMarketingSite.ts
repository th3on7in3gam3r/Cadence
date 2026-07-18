/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTryFree } from './useTryFree';

function hasSavedWorkspace(): boolean {
  try {
    return !!localStorage.getItem('ai_cmo_brand_analysis');
  } catch {
    return false;
  }
}

export function useMarketingSite() {
  const navigate = useNavigate();
  const { cloudEnabled } = useAuth();
  const onTryFree = useTryFree();
  const hasWorkspace = hasSavedWorkspace();

  const onSignIn = useCallback(() => navigate('/app'), [navigate]);

  const onOpenWorkspace = useCallback(() => {
    const url = localStorage.getItem('ai_cmo_brand_url') || '';
    const slug =
      url
        .replace(/^https?:\/\//i, '')
        .replace(/\/$/, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .slice(0, 48)
        .toLowerCase() || 'workspace';
    navigate(`/app/brands/${slug}`);
  }, [navigate]);

  const scrollToSection = useCallback(
    (id: string) => {
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      navigate(`/#${id}`);
    },
    [navigate],
  );

  return {
    cloudEnabled,
    hasWorkspace,
    onTryFree: () => void onTryFree(),
    onSignIn,
    onOpenWorkspace,
    scrollToSection,
  };
}

export type MarketingSiteHandlers = ReturnType<typeof useMarketingSite>;
