/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    Pulse?: {
      track: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

/**
 * pulse.js records the first pageview. React Router navigations that use
 * history.replaceState are not hooked by the pixel, so fire Pulse.track here
 * after the initial load.
 */
export default function PulseSpaPageviews() {
  const location = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    window.Pulse?.track('pageview');
  }, [location.pathname, location.search]);

  return null;
}
