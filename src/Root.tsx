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
import { ProgressProvider } from './contexts/ProgressContext';
import {
  PrivacyPage,
  TermsPage,
  SecurityPage,
  DataRetentionPage,
} from './pages/LegalPages';
import StudioHubPage from './pages/StudioHubPage';
import HelpPage from './pages/HelpPage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import HowItWorksPage from './pages/marketing/HowItWorksPage';
import ComparePage from './pages/marketing/ComparePage';
import FaqPage from './pages/marketing/FaqPage';
import GrowthStackPage from './pages/marketing/GrowthStackPage';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';

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
            <ScrollToTopOnNavigate />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/growth-stack" element={<GrowthStackPage />} />
              <Route path="/studio" element={<StudioHubPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/data-retention" element={<DataRetentionPage />} />
              <Route path="/help" element={<HelpPage variant="public" />} />
              <Route path="/app/*" element={<AppGate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ProgressProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
