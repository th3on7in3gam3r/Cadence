/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, AlertCircle, RefreshCw, 
  Settings, ShieldCheck, HelpCircle, 
  Laptop, CheckCircle2, ChevronRight, CornerDownRight,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebsiteAnalysis, MarketingAssetType, GeneratedAsset } from './types';
import { apiFetch } from './lib/api';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AssetWorkspace from './components/AssetWorkspace';
import CmoCard from './components/CmoCard';
import UserProfile from './components/UserProfile';
import SettingsView from './components/Settings';
import HistoryScans from './components/HistoryScans';
import CampaignHistoryBoard from './components/CampaignHistoryBoard';
import SeoAgent from './components/SeoAgent';
import NewRunModal from './components/NewRunModal';
import CampaignCalendar from './components/CampaignCalendar';
import AppHeader from './components/AppHeader';
import StudioDashboard from './pages/StudioDashboard';
import { PRODUCT_NAME } from './lib/brand';
import { ensureDefaultBrand } from './utils/brands';
import { normalizeBrandUrl } from './utils/websiteUrl';
import {
  shouldShowOnboarding,
  syncUserSetupFromMetadata,
} from './utils/userSetup';
import { loadBrandKit } from './utils/brandKit';
import { useAppNavigation } from './hooks/useAppNavigation';
import type { AppView } from './lib/appPaths';
import { buildAppPath, slugifyBrandId } from './lib/appPaths';
import { useNavigate } from 'react-router-dom';
import {
  buildRunSnapshot,
  addCampaignRun,
  deleteCampaignRun,
  loadCampaignRuns,
  applyCampaignRun,
  clearSeoStorage,
} from './utils/campaignRuns';
import { CampaignRun } from './types';
import type { ApprovalStatus } from './types';
import { useAuth } from './contexts/AuthContext';
import {
  buildPayloadFromLocal,
  fetchCloudWorkspace,
  hydrateLocalFromPayload,
  saveCloudWorkspace,
  type WorkspacePayload,
} from './lib/workspaceApi';
import {
  buildCampaignBundleZip,
  downloadCampaignBundle,
  buildDefaultCampaignImages,
} from './utils/exportCampaignBundle';

interface AppProps {
  onGoHome?: () => void;
}

export default function App({ onGoHome }: AppProps) {
  const { cloudEnabled, session, signOut, user } = useAuth();
  const [cloudHydrated, setCloudHydrated] = useState(!cloudEnabled);
  const [hostedAi, setHostedAi] = useState(false);
  const [activeView, setActiveView] = useState<AppView>(() => {
    const saved = localStorage.getItem('ai_cmo_active_view') as string | null;
    const hasBrand = !!localStorage.getItem('ai_cmo_brand_analysis');
    if (hasBrand && (!saved || saved === 'onboarding')) return 'dashboard';
    return (saved as any) || 'onboarding';
  });
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Marketing Brand variables
  const [brandUrl, setBrandUrl] = useState(() => {
    const saved = localStorage.getItem('ai_cmo_brand_url') || '';
    return saved ? normalizeBrandUrl(saved) : '';
  });
  const [growthGoal, setGrowthGoal] = useState(() => localStorage.getItem('ai_cmo_growth_goal') || '');
  const [brandVoice, setBrandVoice] = useState(() => localStorage.getItem('ai_cmo_brand_voice') || '');
  const [customChallenge, setCustomChallenge] = useState(() => localStorage.getItem('ai_cmo_custom_challenge') || '');
  
  // Results
  const [brandAnalysis, setBrandAnalysis] = useState<WebsiteAnalysis | null>(() => {
    const saved = localStorage.getItem('ai_cmo_brand_analysis');
    try { return saved ? JSON.parse(saved) : null; } catch(e) { return null; }
  });
  const [activeAssetType, setActiveAssetType] = useState<MarketingAssetType | null>(() => {
    return (localStorage.getItem('ai_cmo_active_asset_type') as any) || null;
  });
  const [cachedAssets, setCachedAssets] = useState<Partial<Record<MarketingAssetType, GeneratedAsset>>>(() => {
    const saved = localStorage.getItem('ai_cmo_cached_assets');
    try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
  });
  const [assetHistory, setAssetHistory] = useState<Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number }[]>>(() => {
    const saved = localStorage.getItem('ai_cmo_asset_history');
    try { return saved ? JSON.parse(saved) : {}; } catch(e) { return {}; }
  });
  const [generatingAssetType, setGeneratingAssetType] = useState<MarketingAssetType | null>(null);
  const [isRefiningAsset, setIsRefiningAsset] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState('sarah');
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [campaignRuns, setCampaignRuns] = useState<CampaignRun[]>(() => loadCampaignRuns());
  const [seoSessionKey, setSeoSessionKey] = useState(0);

  const { navigateTo } = useAppNavigation(brandUrl, setActiveView, setActiveAssetType);
  const navigate = useNavigate();

  const goTo = (
    view: AppView,
    opts?: { assetType?: MarketingAssetType; replace?: boolean }
  ) => {
    navigateTo(view, opts);
    if (view === 'workspace') {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  };

  const workspaceSnapshotRef = useRef({
    brandUrl,
    growthGoal,
    brandVoice,
    customChallenge,
    brandAnalysis,
    cachedAssets,
    assetHistory,
    campaignRuns,
    activeView,
    activeAssetType,
  });

  useEffect(() => {
    workspaceSnapshotRef.current = {
      brandUrl,
      growthGoal,
      brandVoice,
      customChallenge,
      brandAnalysis,
      cachedAssets,
      assetHistory,
      campaignRuns,
      activeView,
      activeAssetType,
    };
  }, [
    brandUrl,
    growthGoal,
    brandVoice,
    customChallenge,
    brandAnalysis,
    cachedAssets,
    assetHistory,
    campaignRuns,
    activeView,
    activeAssetType,
  ]);

  const persistCloudWorkspace = useCallback(
    async (overrides?: Partial<WorkspacePayload>) => {
      if (!cloudEnabled || !session || !cloudHydrated) return;
      const base = workspaceSnapshotRef.current;
      const payload: WorkspacePayload = {
        brandUrl: base.brandUrl,
        growthGoal: base.growthGoal,
        brandVoice: base.brandVoice,
        customChallenge: base.customChallenge,
        brandAnalysis: base.brandAnalysis,
        cachedAssets: base.cachedAssets,
        assetHistory: base.assetHistory,
        campaignRuns: base.campaignRuns,
        activeView: base.activeView,
        activeAssetType: base.activeAssetType,
        ...overrides,
      };
      await saveCloudWorkspace(payload).catch(() => undefined);
    },
    [cloudEnabled, session, cloudHydrated],
  );

  // Cloud: load workspace on sign-in
  useEffect(() => {
    if (!cloudEnabled || !session) {
      setCloudHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      syncUserSetupFromMetadata(session.user);
      const payload = await fetchCloudWorkspace();
      if (cancelled) return;
      if (payload) {
        hydrateLocalFromPayload(payload);
        if (payload.brandAnalysis) setBrandAnalysis(payload.brandAnalysis);
        if (payload.brandUrl) setBrandUrl(normalizeBrandUrl(payload.brandUrl));
        if (payload.growthGoal) setGrowthGoal(payload.growthGoal);
        if (payload.brandVoice) setBrandVoice(payload.brandVoice);
        if (payload.customChallenge) setCustomChallenge(payload.customChallenge);
        if (payload.cachedAssets) setCachedAssets(payload.cachedAssets);
        if (payload.assetHistory) setAssetHistory(payload.assetHistory as typeof assetHistory);
        if (payload.campaignRuns) setCampaignRuns(payload.campaignRuns);
        if (payload.brandAnalysis) {
          localStorage.setItem('ai_cmo_user_setup_complete', 'true');
          const bid = slugifyBrandId(payload.brandUrl || '');
          setActiveView('dashboard');
          navigate(buildAppPath('dashboard', bid), { replace: true });
        } else if (payload.activeView && payload.activeView !== 'onboarding') {
          setActiveView(payload.activeView as typeof activeView);
        }
      }
      setCloudHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [cloudEnabled, session?.user?.id]);

  useEffect(() => {
    if (!cloudHydrated) return;
    if (brandAnalysis && activeView === 'onboarding') {
      goTo('dashboard', { replace: true });
      return;
    }
    if (shouldShowOnboarding(user, !!brandAnalysis) && activeView !== 'onboarding') {
      goTo('onboarding');
    }
  }, [cloudHydrated, user, activeView, brandAnalysis]);

  // Cloud: auto-save workspace (debounced)
  useEffect(() => {
    if (!cloudEnabled || !session || !cloudHydrated) return;
    const timer = setTimeout(() => {
      const payload = buildPayloadFromLocal();
      payload.brandAnalysis = brandAnalysis;
      payload.brandUrl = brandUrl;
      payload.growthGoal = growthGoal;
      payload.brandVoice = brandVoice;
      payload.customChallenge = customChallenge;
      payload.cachedAssets = cachedAssets;
      payload.assetHistory = assetHistory;
      payload.campaignRuns = campaignRuns;
      payload.activeView = activeView;
      payload.activeAssetType = activeAssetType;
      saveCloudWorkspace(payload).catch(() => undefined);
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    cloudEnabled,
    session,
    cloudHydrated,
    brandAnalysis,
    brandUrl,
    growthGoal,
    brandVoice,
    customChallenge,
    cachedAssets,
    assetHistory,
    campaignRuns,
    activeView,
    activeAssetType,
  ]);

  useEffect(() => {
    if (!cloudEnabled || !session || !cloudHydrated) return;
    const flush = () => {
      void persistCloudWorkspace();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [cloudEnabled, session, cloudHydrated, persistCloudWorkspace]);

  // OAuth return from Google integrations — handled after triggerToast is defined below

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    if (integration === 'connected') {
      goTo('settings');
      triggerToast('Google integration connected.', 'success');
      window.history.replaceState({}, '', '/app');
    } else if (integration === 'error') {
      triggerToast('Integration connection failed. Try again in Settings.', 'error');
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  const handleExportCampaignBundle = async () => {
    if (!brandAnalysis || Object.keys(cachedAssets).length === 0) {
      triggerToast('Generate at least one asset before exporting.', 'info');
      return;
    }
    setIsExportingBundle(true);
    try {
      let imagenMeta = { artisticTheme: 'minimalist', imagenSeed: 101, customImagePrompt: '' };
      try {
        const saved = localStorage.getItem('ai_cmo_imagen_meta');
        if (saved) imagenMeta = { ...imagenMeta, ...JSON.parse(saved) };
      } catch { /* use defaults */ }

      const images = buildDefaultCampaignImages(
        cachedAssets,
        imagenMeta.artisticTheme,
        imagenMeta.imagenSeed,
        imagenMeta.customImagePrompt
      );

      const blob = await buildCampaignBundleZip({
        brandAnalysis,
        cachedAssets,
        assetHistory,
        images,
      });
      downloadCampaignBundle(blob, brandAnalysis.brandName);
      triggerToast('Campaign bundle ZIP downloaded — ready for your assets folder.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      triggerToast(msg, 'error');
    } finally {
      setIsExportingBundle(false);
    }
  };

  const handleUpdateAssetContent = (type: MarketingAssetType, content: string) => {
    setCachedAssets(prev => {
      const existing = prev[type];
      if (!existing) return prev;
      return {
        ...prev,
        [type]: {
          ...existing,
          content
        }
      };
    });
  };

  useEffect(() => {
    localStorage.setItem('ai_cmo_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_brand_url', brandUrl);
  }, [brandUrl]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_growth_goal', growthGoal);
  }, [growthGoal]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_brand_voice', brandVoice);
  }, [brandVoice]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_custom_challenge', customChallenge);
  }, [customChallenge]);

  useEffect(() => {
    if (brandAnalysis) {
      localStorage.setItem('ai_cmo_brand_analysis', JSON.stringify(brandAnalysis));
    } else {
      localStorage.removeItem('ai_cmo_brand_analysis');
    }
  }, [brandAnalysis]);

  useEffect(() => {
    if (activeAssetType) {
      localStorage.setItem('ai_cmo_active_asset_type', activeAssetType);
    } else {
      localStorage.removeItem('ai_cmo_active_asset_type');
    }
  }, [activeAssetType]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_cached_assets', JSON.stringify(cachedAssets));
  }, [cachedAssets]);

  useEffect(() => {
    localStorage.setItem('ai_cmo_asset_history', JSON.stringify(assetHistory));
  }, [assetHistory]);

  // Verify server health and credentials configuration upon loading
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiFetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setApiKeyConfigured(!!data.geminiConfigured);
          setHostedAi(!!data.hostedAi);
        }
      } catch (err) {
        console.warn('Is server running yet? Will retry upon analytics actions.');
      }
    }
    checkHealth();
  }, [activeView]);

  // Handler 1: Trigger Web research and Strategy Formulation
  const handleUrlAnalysis = async (config: {
    url: string;
    goal: string;
    brandVoice: string;
    customChallenge: string;
  }) => {
    const normalizedUrl = normalizeBrandUrl(config.url);
    setIsLoading(true);
    setStatusError(null);
    setBrandUrl(normalizedUrl);
    setGrowthGoal(config.goal);
    setBrandVoice(config.brandVoice);
    setCustomChallenge(config.customChallenge);

    try {
      const response = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, url: normalizedUrl, brandKit: loadBrandKit() }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `HTTP Network check failed: status ${response.status}`);
      }

      const data: WebsiteAnalysis = await response.json();
      setBrandAnalysis(data);
      ensureDefaultBrand(data.brandName, normalizedUrl, {
        brandUrl: normalizedUrl,
        growthGoal: data.inferredGrowthGoal || config.goal,
        brandVoice: data.inferredBrandVoice || config.brandVoice,
        customChallenge: config.customChallenge,
        brandAnalysis: data,
        cachedAssets: {},
        assetHistory: {},
      });
      
      // Automatically update the primary growth objective and brand voice to values inferred from website Analysis
      if (data.inferredBrandVoice) {
        setBrandVoice(data.inferredBrandVoice);
      }
      if (data.inferredGrowthGoal) {
        setGrowthGoal(data.inferredGrowthGoal);
      }
      
      // Select appropriate initial specialist briefing based on inferred or chosen goal
      const resolvedGoal = data.inferredGrowthGoal || config.goal;
      if (resolvedGoal.includes('SEO') || resolvedGoal.includes('Traffic')) {
        setSelectedSpecialist('kofi');
      } else if (resolvedGoal.includes('Conversion') || resolvedGoal.includes('E-commerce')) {
        setSelectedSpecialist('maya');
      } else {
        setSelectedSpecialist('sarah');
      }
      
      navigate(buildAppPath('dashboard', slugifyBrandId(config.url)));
      goTo('dashboard');
      triggerToast('Brand analysis completed! Opening your dashboard.', 'success');
    } catch (error: any) {
      console.error(error);
      setStatusError(error.message || 'An unexpected analysis block was reported.');
      triggerToast(error.message || 'Analysis error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler 2: Build a specific deliverable copy
  const handleGenerateAsset = async (type: MarketingAssetType) => {
    // If we already compiled this draft previously, reuse from cache to support fluid workspace navigating
    if (cachedAssets[type]) {
      setActiveAssetType(type);
      goTo('workspace', { assetType: type });
      return;
    }

    setGeneratingAssetType(type);
    setStatusError(null);

    try {
      const response = await apiFetch('/api/generate-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: type,
          companyInfo: brandAnalysis,
          customRequirements: customChallenge,
          brandKit: loadBrandKit(),
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `Failed to generate asset type ${type}.`);
      }

      const data = await response.json();
      
      const newCached = { ...cachedAssets, [type]: data };
      const newHistory = {
        ...assetHistory,
        [type]: [{
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          summary: "Original AI draft generation",
          asset: data
        }],
      };

      setCachedAssets(newCached);
      setAssetHistory(newHistory);
      void persistCloudWorkspace({ cachedAssets: newCached, assetHistory: newHistory });

      // Focus appropriate workspace specialist
      if (type === 'seo_keywords') setSelectedSpecialist('kofi');
      else if (type === 'lead_magnet') setSelectedSpecialist('maya');
      else if (type === 'blog_post' || type === 'social_posts' || type === 'email_sequence') setSelectedSpecialist('devon');

      setActiveAssetType(type);
      goTo('workspace', { assetType: type });
      triggerToast(`Marketing asset '${type.replace('_', ' ').toUpperCase()}' generated successfully!`, 'success');
    } catch (error: any) {
      console.error(error);
      setStatusError(`Generation error: ${error.message || error}`);
      triggerToast(`Generation failed: ${error.message || error}`, 'error');
    } finally {
      setGeneratingAssetType(null);
    }
  };

  // Handler 3: Peer-Review & Live refinement edits
  const handleRefineAsset = async (feedbackText: string, toneIntensity: number) => {
    if (!activeAssetType || !cachedAssets[activeAssetType]) return;
    
    setIsRefiningAsset(true);
    setStatusError(null);

    try {
      const response = await apiFetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: activeAssetType,
          companyInfo: brandAnalysis,
          lastDraft: cachedAssets[activeAssetType],
          userFeedback: feedbackText,
          toneIntensity,
          brandKit: loadBrandKit(),
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || 'Failed to polish copy.');
      }

      const data = await response.json();
      
      const newCached = { ...cachedAssets, [activeAssetType]: data };
      const newHistory = {
        ...assetHistory,
        [activeAssetType]: [
          ...(assetHistory[activeAssetType] || []),
          {
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            summary: data.summary || `Refined: "${feedbackText.slice(0, 35)}${feedbackText.length > 35 ? '...' : ''}"`,
            asset: data,
            toneIntensity
          }
        ],
      };

      setCachedAssets(newCached);
      setAssetHistory(newHistory);
      void persistCloudWorkspace({ cachedAssets: newCached, assetHistory: newHistory });
      triggerToast('AI Copy refinement successfully compiled!', 'success');
    } catch (error: any) {
      console.error(error);
      setStatusError(`Polish issue: ${error.message || error}`);
      triggerToast(`Refinement issue: ${error.message || error}`, 'error');
      throw error;
    } finally {
      setIsRefiningAsset(false);
    }
  };

  // Handler 4: Revert to previous asset version
  const handleRevertAsset = (type: MarketingAssetType, historicalAsset: GeneratedAsset) => {
    setCachedAssets(prev => ({
      ...prev,
      [type]: historicalAsset
    }));
  };

  // Handler 5: Update historical summary in live asset history list
  const handleUpdateHistorySummary = (type: MarketingAssetType, idx: number, newSummary: string) => {
    setAssetHistory(prev => ({
      ...prev,
      [type]: (prev[type] || []).map((item, i) => (i === idx ? { ...item, summary: newSummary } : item))
    }));
  };

  const handleUpdateHistoryTags = (type: MarketingAssetType, idx: number, newTags: string[]) => {
    setAssetHistory(prev => ({
      ...prev,
      [type]: (prev[type] || []).map((item, i) => (i === idx ? { ...item, tags: newTags } : item))
    }));
  };

  const handleUpdateHistoryArchived = (type: MarketingAssetType, idx: number, isArchived: boolean) => {
    setAssetHistory(prev => ({
      ...prev,
      [type]: (prev[type] || []).map((item, i) => (i === idx ? { ...item, isArchived } : item))
    }));
  };

  const handleUpdateHistoryCreatedDate = (type: MarketingAssetType, idx: number, createdDateStr: string) => {
    setAssetHistory(prev => ({
      ...prev,
      [type]: (prev[type] || []).map((item, i) => (i === idx ? { ...item, createdDateStr } : item))
    }));
  };

  const [profileName, setProfileName] = useState('You');
  const [profileColor, setProfileColor] = useState('from-emerald-500 to-teal-600');

  const handleUpdateApproval = (
    type: MarketingAssetType,
    idx: number,
    status: ApprovalStatus,
    commentText?: string
  ) => {
    setAssetHistory((prev) => ({
      ...prev,
      [type]: (prev[type] || []).map((item, i) => {
        if (i !== idx) return item;
        const comments = [...(item.comments || [])];
        if (commentText?.trim()) {
          comments.push({
            id: crypto.randomUUID(),
            author: profileName,
            text: commentText.trim(),
            createdAt: new Date().toISOString(),
          });
        }
        return { ...item, approvalStatus: status, comments };
      }),
    }));
    if (status === 'approved') {
      triggerToast('Asset approved — ready to publish.', 'success');
    }
  };

  useEffect(() => {
    const updateProfile = () => {
      const saved = localStorage.getItem('ai_cmo_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) setProfileName(parsed.fullName);
          if (parsed.avatarColor) setProfileColor(parsed.avatarColor);
        } catch (e) {
          console.error(e);
        }
      } else if (user?.email) {
        const fromMeta = user.user_metadata?.full_name as string | undefined;
        setProfileName(fromMeta || user.email.split('@')[0] || 'You');
      }
    };
    updateProfile();
    window.addEventListener('user_profile_updated', updateProfile);
    return () => window.removeEventListener('user_profile_updated', updateProfile);
  }, [user?.email, user?.user_metadata?.full_name]);

  const handleResetWorkspace = () => {
    setBrandAnalysis(null);
    setActiveAssetType(null);
    setCachedAssets({});
    setAssetHistory({} as Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number }[]>);
    clearSeoStorage();
    setSeoSessionKey((k) => k + 1);
    goTo('onboarding');
  };

  const handleStartBrandAudit = async (url: string, saveCurrent: boolean) => {
    if (saveCurrent && brandAnalysis) {
      const snapshot = buildRunSnapshot({
        brandUrl,
        growthGoal,
        brandVoice,
        customChallenge,
        brandAnalysis,
        cachedAssets,
        assetHistory,
      });
      setCampaignRuns(addCampaignRun(snapshot));
      triggerToast(`Saved "${snapshot.label}" to your runs library.`, 'info');
    }
    clearSeoStorage();
    setSeoSessionKey((k) => k + 1);
    setActiveAssetType(null);
    setCachedAssets({});
    setAssetHistory({} as Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number }[]>);
    await handleUrlAnalysis({
      url,
      goal: growthGoal,
      brandVoice,
      customChallenge,
    });
    setShowNewRunModal(false);
  };

  const handleRestoreRun = (runId: string) => {
    const run = campaignRuns.find((r) => r.id === runId);
    if (!run) return;
    applyCampaignRun(run);
    setBrandUrl(run.brandUrl);
    setGrowthGoal(run.growthGoal);
    setBrandVoice(run.brandVoice);
    setCustomChallenge(run.customChallenge);
    setBrandAnalysis(run.brandAnalysis);
    setCachedAssets(run.cachedAssets);
    setAssetHistory((run.assetHistory || {}) as Record<MarketingAssetType, { timestamp: string; summary: string; asset: GeneratedAsset; toneIntensity?: number }[]>);
    setActiveAssetType(null);
    setSeoSessionKey((k) => k + 1);
    goTo('dashboard');
    setShowNewRunModal(false);
    triggerToast(`Opened saved run: ${run.label}`, 'success');
  };

  const handleDeleteRun = (runId: string) => {
    setCampaignRuns(deleteCampaignRun(runId));
    triggerToast('Saved run deleted.', 'info');
  };

  if (cloudEnabled && !cloudHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Syncing your cloud workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans transition-colors antialiased text-slate-200">
      <AppHeader
        activeView={activeView}
        brandAnalysis={brandAnalysis}
        profileName={profileName}
        profileColor={profileColor}
        cloudEnabled={cloudEnabled}
        user={user}
        onGoHome={onGoHome}
        onLogoClick={() => {
          if (onGoHome) onGoHome();
          else if (brandAnalysis) goTo('dashboard');
        }}
        onSignOut={async () => {
          await signOut();
          onGoHome?.();
        }}
        onNewAudit={() => setShowNewRunModal(true)}
        goTo={goTo}
      />

      {/* 2. Global Strategy Errors Handler block */}
      {statusError && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-4 w-full">
          <div className="p-4 bg-red-950/40 border border-red-800/60 text-red-200 rounded-xl flex items-start gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm flex-1">
              <span className="font-bold">Analysis error:</span> {statusError}
              <div className="mt-2 flex gap-2">
                <button
                  id="error-dismiss-btn"
                  onClick={() => setStatusError(null)}
                  className="bg-red-900/60 hover:bg-red-800/80 text-white font-semibold px-2.5 py-1 rounded text-[11px] border border-red-700"
                >
                  Dismiss Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Core Workspace View Manager */}
      <main id="main-content" className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {activeView === 'onboarding' ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Onboarding 
                onAnalyze={handleUrlAnalysis} 
                isLoading={isLoading} 
                apiKeyConfigured={hostedAi || apiKeyConfigured}
                hostedAi={hostedAi}
              />
            </motion.div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 min-w-0 overflow-x-hidden">
              {brandAnalysis && (
                <>
                  {activeView === 'dashboard' && (
                    <CmoCard 
                      analysis={brandAnalysis} 
                      selectedSpecialistId={selectedSpecialist}
                      onSelectSpecialist={setSelectedSpecialist}
                    />
                  )}

                  {activeView === 'dashboard' ? (
                    <Dashboard 
                      analysis={brandAnalysis}
                      brandUrl={brandUrl}
                      onGenerateAsset={handleGenerateAsset}
                      generatingType={generatingAssetType}
                      assetHistory={assetHistory}
                      onNavigateToHistory={() => goTo('campaign-history')}
                      onNavigateToSeoAgent={() => goTo('seo-agent')}
                      onNavigateToCalendar={() => goTo('calendar')}
                      onNewAudit={() => setShowNewRunModal(true)}
                      savedRunsCount={campaignRuns.length}
                      onExportCampaignBundle={handleExportCampaignBundle}
                      isExportingBundle={isExportingBundle}
                      hasCachedAssets={Object.keys(cachedAssets).length > 0}
                    />
                  ) : activeView === 'workspace' && activeAssetType && cachedAssets[activeAssetType] ? (
                    <AssetWorkspace 
                      assetType={activeAssetType}
                      asset={cachedAssets[activeAssetType]!}
                      companyInfo={brandAnalysis}
                      onBackToDashboard={() => goTo('dashboard')}
                      onRefineAsset={handleRefineAsset}
                      isRefining={isRefiningAsset}
                      onNextStepSelect={handleGenerateAsset}
                      history={assetHistory[activeAssetType] || []}
                      onRevertAsset={(historicalAsset) => handleRevertAsset(activeAssetType, historicalAsset)}
                      onUpdateHistorySummary={(idx, text) => handleUpdateHistorySummary(activeAssetType, idx, text)}
                      onUpdateHistoryTags={(idx, tags) => handleUpdateHistoryTags(activeAssetType, idx, tags)}
                      onUpdateHistoryArchived={(idx, arch) => handleUpdateHistoryArchived(activeAssetType, idx, arch)}
                      onUpdateHistoryCreatedDate={(idx, dt) => handleUpdateHistoryCreatedDate(activeAssetType, idx, dt)}
                      onUpdateApproval={(idx, status, comment) =>
                        handleUpdateApproval(activeAssetType, idx, status, comment)
                      }
                      assigneeName={profileName}
                      currentApprovalStatus={
                        assetHistory[activeAssetType]?.[0]?.approvalStatus || 'draft'
                      }
                      triggerToast={triggerToast}
                      onUpdateAssetContent={handleUpdateAssetContent}
                      onExportCampaignBundle={handleExportCampaignBundle}
                      isExportingBundle={isExportingBundle}
                    />
                  ) : activeView === 'calendar' ? (
                    <CampaignCalendar
                      analysis={brandAnalysis}
                      onBack={() => goTo('dashboard')}
                      onOpenAsset={(type) => handleGenerateAsset(type)}
                      hasAsset={(type) => !!cachedAssets[type]}
                    />
                  ) : activeView === 'seo-agent' ? (
                    <div key={seoSessionKey}>
                    <SeoAgent
                      brandUrl={brandUrl}
                      companyInfo={brandAnalysis}
                      onBackToDashboard={() => goTo('dashboard')}
                      triggerToast={triggerToast}
                      onGenerateSeoKeywords={() => handleGenerateAsset('seo_keywords')}
                      isGeneratingKeywords={generatingAssetType === 'seo_keywords'}
                      onNewBrandAudit={() => setShowNewRunModal(true)}
                      onOpenBilling={() => goTo('settings')}
                    />
                    </div>
                  ) : activeView === 'campaign-history' ? (
                    <CampaignHistoryBoard
                      onBackToDashboard={() => goTo('dashboard')}
                      cachedAssets={cachedAssets}
                      assetHistory={assetHistory}
                      onSelectAsset={(type) => {
                        setActiveAssetType(type);
                        goTo('workspace', { assetType: type });
                      }}
                      onExportBundle={handleExportCampaignBundle}
                      isExporting={isExportingBundle}
                    />
                  ) : activeView === 'profile' ? (
                    <UserProfile 
                      onBackToDashboard={() => goTo('dashboard')}
                      currentUserEmail={user?.email ?? ''}
                    />
                  ) : activeView === 'settings' ? (
                    <SettingsView 
                      brandName={brandAnalysis.brandName}
                      brandUrl={brandUrl}
                      onResetWorkspace={handleResetWorkspace}
                    />
                  ) : activeView === 'studio' ? (
                    <StudioDashboard onBackToDashboard={() => goTo('dashboard')} />
                  ) : activeView === 'history-scans' ? (
                    <HistoryScans 
                      onBackToDashboard={() => goTo('dashboard')}
                      cachedAssets={cachedAssets}
                      assetHistory={assetHistory}
                      onRevertAsset={handleRevertAsset}
                      onSelectAssetView={(type) => {
                        setActiveAssetType(type);
                        goTo('workspace', { assetType: type });
                      }}
                    />
                  ) : null}
                </>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Elegant Universal Footer block */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{PRODUCT_NAME} © {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              API Status: Online
            </span>
          </div>
        </div>
      </footer>

      <NewRunModal
        open={showNewRunModal}
        onClose={() => setShowNewRunModal(false)}
        runs={campaignRuns}
        currentBrandName={brandAnalysis?.brandName}
        defaultUrl={brandUrl}
        isLoading={isLoading}
        onStartBrandAudit={handleStartBrandAudit}
        onRestoreRun={handleRestoreRun}
        onDeleteRun={handleDeleteRun}
      />

      {/* Toasts floating layout container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`p-3.5 rounded-xl border shadow-2xl flex items-center gap-3 pointer-events-auto shrink-0 backdrop-blur ${
                t.type === 'error'
                  ? 'bg-red-950/90 border-red-800 text-red-200'
                  : t.type === 'info'
                  ? 'bg-slate-905/90 border-slate-700 text-slate-300'
                  : 'bg-emerald-955/90 border-emerald-800 text-emerald-250'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : t.type === 'info' ? (
                <History className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div className="flex-1 text-xs font-medium">
                {t.message}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="hover:text-white text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1 shrink-0"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
