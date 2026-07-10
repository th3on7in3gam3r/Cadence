/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" aria-hidden />
        <h1 className="text-lg font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-6">{error.message}</p>
        <button
          type="button"
          onClick={() => {
            resetErrorBoundary();
            window.location.href = '/app';
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          <RefreshCw className="w-4 h-4" />
          Reload workspace
        </button>
      </div>
    </div>
  );
}

export default function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(e) => console.error('[AppErrorBoundary]', e)}>
      {children}
    </ErrorBoundary>
  );
}
