/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  /** Show after scrolling past this many pixels */
  threshold?: number;
}

export default function ScrollToTopButton({ threshold = 320 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border border-emerald-400/30 cursor-pointer transition-all active:scale-95"
      title="Back to top"
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
