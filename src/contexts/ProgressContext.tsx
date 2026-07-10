/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

interface ProgressState {
  active: boolean;
  label: string;
  percent: number;
}

interface ProgressContextValue {
  progress: ProgressState;
  startProgress: (label: string) => void;
  setProgress: (percent: number, label?: string) => void;
  endProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<ProgressState>({
    active: false,
    label: '',
    percent: 0,
  });

  const startProgress = useCallback((label: string) => {
    setProgressState({ active: true, label, percent: 5 });
  }, []);

  const setProgress = useCallback((percent: number, label?: string) => {
    setProgressState((p) => ({
      active: true,
      percent: Math.min(100, Math.max(0, percent)),
      label: label ?? p.label,
    }));
  }, []);

  const endProgress = useCallback(() => {
    setProgressState({ active: false, label: '', percent: 0 });
  }, []);

  return (
    <ProgressContext.Provider value={{ progress, startProgress, setProgress, endProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
