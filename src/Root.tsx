/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import App from './App';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import AppErrorBoundary from './components/ErrorBoundary';
import GlobalProgressBar from './components/GlobalProgressBar';
import OfflineBanner from './components/OfflineBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isCloudEnabled } from './lib/cloudConfig';
import { ProgressProvider } from './contexts/ProgressContext';
import {
  PrivacyPage,
  TermsPage,
  SecurityPage,
  DataRetentionPage,
} from './pages/LegalPages';
import StudioHubPage from './pages/StudioHubPage';

function hasSavedWorkspace(): boolean {
  try {
    return !!localStorage.getItem('ai_cmo_brand_analysis');
  } catch {
    return false;
  }
}

function LandingPageRoute() {
  const navigate = useNavigate();
  const cloudEnabled = isCloudEnabled();
  return (
    <LandingPage
      cloudEnabled={cloudEnabled}
      hasWorkspace={hasSavedWorkspace()}
      onGetStarted={() => navigate(cloudEnabled ? '/app' : '/app/onboarding')}
      onSignIn={() => navigate('/app')}
      onOpenWorkspace={() => {
        const url = localStorage.getItem('ai_cmo_brand_url') || '';
        const slug = url
          .replace(/^https?:\/\//i, '')
          .replace(/\/$/, '')
          .replace(/[^a-z0-9]+/gi, '-')
          .slice(0, 48)
          .toLowerCase() || 'workspace';
        navigate(`/app/brands/${slug}`);
      }}
    />
  );
}

function AppGate() {
  const { cloudEnabled, session, loading } = useAuth();
  const navigate = useNavigate();

  if (cloudEnabled && loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading your workspace…
      </div>
    );
  }
  if (cloudEnabled && !session) {
    return <LoginPage />;
  }
  return <App onGoHome={() => navigate('/')} />;
}

export default function Root() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <ProgressProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <GlobalProgressBar />
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<LandingPageRoute />} />
              <Route path="/studio" element={<StudioHubPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/data-retention" element={<DataRetentionPage />} />
              <Route path="/app/*" element={<AppGate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ProgressProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
