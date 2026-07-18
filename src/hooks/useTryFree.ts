/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Guest trial sign-in (when cloud) then navigate to onboarding. */
export function useTryFree() {
  const navigate = useNavigate();
  const { cloudEnabled, session, signInAsGuest } = useAuth();

  return useCallback(async () => {
    if (cloudEnabled && !session) {
      const result = await signInAsGuest();
      if (result.error) {
        console.error('Guest sign-in failed:', result.error);
        navigate('/app');
        return;
      }
    }
    navigate('/app/onboarding');
  }, [cloudEnabled, session, signInAsGuest, navigate]);
}
