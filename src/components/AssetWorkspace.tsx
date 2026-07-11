/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Line, Area
} from 'recharts';
import { 
  ArrowLeft, Copy, Check, MessageSquare, 
  Send, Sparkles, AlertCircle, RefreshCw, 
  CornerDownRight, Globe, TrendingUp, HelpCircle,
  Settings, Calendar, Clock, BarChart3, Target,
  Award, CheckCircle2, Search, RotateCcw,
  Eye, Edit3, Share2, Linkedin, Twitter, Facebook, Link,
  Image, SlidersHorizontal, ExternalLink, Code2, MessageSquarePlus, Package
} from 'lucide-react';
import CopywriterSidebar from './CopywriterSidebar';
import FormatMarkdown from './asset-workspace/FormatMarkdown';
import RefinePanel from './asset-workspace/RefinePanel';
import StudioImageMetaBar from './asset-workspace/StudioImageMetaBar';
import SeoChecklistPanel from './asset-workspace/SeoChecklistPanel';
import VersionCompareDiff from './asset-workspace/VersionCompareDiff';
import VersionCompareModal from './asset-workspace/VersionCompareModal';
import { computeWordDiff } from '../utils/wordDiff';
import { toWordPressBlocks } from '../utils/wordpressBlocks';
import {
  buildDefaultImagePrompt,
  getStudioLabels,
  isGeneratedImageUrl,
  loadGeneratedImageUrl,
  loadImagePrompt,
  resolveStudioImageUrl,
  saveGeneratedImageUrl,
  saveImagePrompt,
} from '../utils/imagePrompts';
import { generateStudioImage } from '../lib/studioImageApi';
import { resolveSubscribeUrl } from '../utils/newsletterSettings';
import ScrollToTopButton from './ScrollToTopButton';

import EmailMockupViewport from './EmailMockupViewport';
import { GeneratedAsset, MarketingAssetType, ChatMessage, WebsiteAnalysis, ApprovalStatus } from '../types';
import { isCloudEnabled } from '../lib/cloudConfig';
import { PRODUCT_NAME } from '../lib/brand';
import { publishToWordPress } from '../lib/workspaceApi';
import { recordPublishEvent } from '../utils/analyticsLoop';

const APPROVAL_STEPS: { id: ApprovalStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'in_review', label: 'Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'published', label: 'Published' },
];

interface AssetWorkspaceProps {
  assetType: MarketingAssetType;
  asset: GeneratedAsset;
  companyInfo: WebsiteAnalysis;
  brandUrl?: string;
  onBackToDashboard: () => void;
  onRefineAsset: (feedback: string, toneIntensity: number) => Promise<void>;
  isRefining: boolean;
  onNextStepSelect: (type: MarketingAssetType) => void;
  history: { 
    timestamp: string; 
    summary: string; 
    asset: GeneratedAsset; 
    toneIntensity?: number; 
    tags?: string[];
    isArchived?: boolean;
    createdDateStr?: string;
  }[];
  onRevertAsset: (historicalAsset: GeneratedAsset) => void;
  onUpdateHistorySummary?: (index: number, newSummary: string) => void;
  onUpdateHistoryTags?: (index: number, tags: string[]) => void;
  onUpdateHistoryArchived?: (index: number, isArchived: boolean) => void;
  onUpdateHistoryCreatedDate?: (index: number, dateStr: string) => void;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onUpdateAssetContent?: (type: MarketingAssetType, content: string) => void;
  onExportCampaignBundle?: () => void;
  isExportingBundle?: boolean;
  onUpdateApproval?: (index: number, status: ApprovalStatus, comment?: string) => void;
  assigneeName?: string;
  currentApprovalStatus?: ApprovalStatus;
}

export default function AssetWorkspace({ 
  assetType, 
  asset, 
  companyInfo,
  brandUrl = '',
  onBackToDashboard, 
  onRefineAsset, 
  isRefining,
  onNextStepSelect,
  history,
  onRevertAsset,
  onUpdateHistorySummary,
  onUpdateHistoryTags,
  onUpdateHistoryArchived,
  onUpdateHistoryCreatedDate,
  triggerToast,
  onUpdateAssetContent,
  onExportCampaignBundle,
  isExportingBundle,
  onUpdateApproval,
  assigneeName = 'Reviewer',
  currentApprovalStatus = 'draft',
}: AssetWorkspaceProps) {
  const [copied, setCopied] = useState(false);
  const [copiedWp, setCopiedWp] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [toneIntensity, setToneIntensity] = useState<number>(5);

  const [visualVibe, setVisualVibe] = useState<'tech' | 'creative' | 'business' | 'neon' | 'organic'>('tech');
  const [activeSocialTab, setActiveSocialTab] = useState<'LinkedIn' | 'Twitter' | 'Facebook'>('LinkedIn');
  const [showTitleOverlay, setShowTitleOverlay] = useState<boolean>(true);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [activeCopilotTab, setActiveCopilotTab] = useState<'cursor' | 'grok' | 'claude' | 'chatgpt'>('cursor');
  const [socialMetrics, setSocialMetrics] = useState<Record<string, { likes: number; comments: number; shares: number; liked: boolean }>>({
    LinkedIn: { likes: 142, comments: 24, shares: 12, liked: false },
    Twitter: { likes: 89, comments: 11, shares: 35, liked: false },
    Facebook: { likes: 210, comments: 38, shares: 18, liked: false }
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [editingHistoryIdx, setEditingHistoryIdx] = useState<number | null>(null);
  const [editingSummaryText, setEditingSummaryText] = useState<string>('');
  const [showSeoChecklist, setShowSeoChecklist] = useState<boolean>(false);

  // Version comparison and highlights state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareLeftIdx, setCompareLeftIdx] = useState<number>(0);
  const [compareRightIdx, setCompareRightIdx] = useState<number>(0);
  const [compareDiffViewMode, setCompareDiffViewMode] = useState<'side' | 'inline'>('side');
  const [isComparePanelOpen, setIsComparePanelOpen] = useState<boolean>(false);

  // Version categorization, tagging and archiving filtration states
  const [historyFilterTag, setHistoryFilterTag] = useState<string>('All');
  const [autoArchiveOlderThan30Days, setAutoArchiveOlderThan30Days] = useState<boolean>(true);
  const [historyTab, setHistoryTab] = useState<'active' | 'archived'>('active');
  const [tagEditorIdx, setTagEditorIdx] = useState<number | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Enhanced features: Keyword highlighter, Readability Heatmap, Live local editor and Social media connections
  const [localAssetContent, setLocalAssetContent] = useState<string>(asset.content || '');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [highlightKeywords, setHighlightKeywords] = useState<boolean>(false);
  const [enableHeatmap, setEnableHeatmap] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [connectedSocials, setConnectedSocials] = useState<string[]>(['LinkedIn']); // Simple state for connected social platforms
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [isCopywriterOpen, setIsCopywriterOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalPanel, setShowApprovalPanel] = useState(
    isCloudEnabled() && assetType === 'blog_post',
  );
  const [refineExpandToken, setRefineExpandToken] = useState(0);

  // Custom User Requested features: Visual Branding, Imagen generation, and AI Editor Integration
  const [artisticTheme, setArtisticTheme] = useState<'minimalist' | 'vibrant' | 'corporate' | 'neon' | 'organic' | 'retro' | 'cinematic'>('minimalist');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imagenSeed, setImagenSeed] = useState<number>(101);
  const [customImagePrompt, setCustomImagePrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isAiEditorOverlayOpen, setIsAiEditorOverlayOpen] = useState<boolean>(false);
  const [imageProgressPercentage, setImageProgressPercentage] = useState<number>(0);
  const [imageGenerationLog, setImageGenerationLog] = useState<string>('Ready to synthesize');

  // Per-asset image prompt (saved per marketing content type)
  useEffect(() => {
    const saved = loadImagePrompt(assetType);
    setCustomImagePrompt(
      saved || buildDefaultImagePrompt(assetType, asset, companyInfo.brandName),
    );
    setGeneratedImageUrl(loadGeneratedImageUrl(assetType));
  }, [assetType, asset.title, asset.summary, companyInfo.brandName]);

  const studioImageSrc = (promptOverride?: string) =>
    resolveStudioImageUrl({
      generatedUrl: generatedImageUrl,
      assetType,
      artisticTheme,
      imagenSeed,
      prompt: promptOverride ?? customImagePrompt,
    });

  const subscribeUrl = resolveSubscribeUrl(brandUrl);

  const buildWordPressSeoMeta = (featuredImageUrl: string) => ({
    title: asset.title,
    summary: asset.summary,
    taglineOrCTA: asset.taglineOrCTA,
    seoInstructions: asset.seoInstructions,
    featuredImageUrl: isGeneratedImageUrl(featuredImageUrl) ? undefined : featuredImageUrl,
    featuredImageAlt: customImagePrompt || asset.title || companyInfo.brandName,
    featuredImagePending: isGeneratedImageUrl(featuredImageUrl),
    brandName: companyInfo.brandName,
    subscribeUrl,
    subscribeButtonLabel: 'Subscribe',
    includeSubscribe: assetType === 'blog_post',
    productCta: asset.taglineOrCTA,
  });

  useEffect(() => {
    if (customImagePrompt.trim()) {
      saveImagePrompt(assetType, customImagePrompt);
    }
    localStorage.setItem(
      'ai_cmo_imagen_meta',
      JSON.stringify({ artisticTheme, imagenSeed, customImagePrompt }),
    );
  }, [artisticTheme, imagenSeed, customImagePrompt, assetType]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [assetType, asset.title]);

  // Synchronise content local state with parent prop updates (including reversion actions)
  useEffect(() => {
    setLocalAssetContent(asset.content || '');
  }, [asset.content]);

  // Debounced Auto-save to Local Storage
  useEffect(() => {
    // Avoid saving if content is identical to the loaded prop content and haven't saved yet
    if (localAssetContent === asset.content && lastSaved === null) {
      return;
    }

    setIsSaving(true);
    const debounceTimeout = setTimeout(() => {
      if (onUpdateAssetContent) {
        onUpdateAssetContent(assetType, localAssetContent);
      }
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(timeStr);
      setIsSaving(false);
      
      // Save full cached assets object directly to local storage for instant durability
      const saved = localStorage.getItem('ai_cmo_cached_assets');
      try {
        const parsed = saved ? JSON.parse(saved) : {};
        parsed[assetType] = { ...asset, content: localAssetContent };
        localStorage.setItem('ai_cmo_cached_assets', JSON.stringify(parsed));
      } catch (e) {
        console.error("Local storage sync error", e);
      }
    }, 1500);

    return () => clearTimeout(debounceTimeout);
  }, [localAssetContent]);

  const categoryTagsPreset = ['Draft', 'Test', 'Under Review', 'Final', 'Approved'];


  const handleTriggerImagenGeneration = async () => {
    if (!customImagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setImageProgressPercentage(5);
    setImageGenerationLog('Contacting Google Imagen...');

    try {
      setImageProgressPercentage(25);
      setImageGenerationLog('Rendering image from your design prompt...');

      const result = await generateStudioImage({
        prompt: customImagePrompt,
        assetType,
        artisticTheme,
      });

      setImageProgressPercentage(90);
      setImageGenerationLog('Applying final color grading...');

      setGeneratedImageUrl(result.imageDataUrl);
      saveGeneratedImageUrl(assetType, result.imageDataUrl);
      setImagenSeed((prev) => prev + 1);
      setImageProgressPercentage(100);
      setImageGenerationLog('Image generated successfully!');

      triggerToast?.(
        result.enhancedPrompt
          ? 'Imagen image ready. Download it for WordPress Media Library if needed.'
          : 'Imagen image generated from your prompt.',
        'success',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Image generation failed.';
      setImageGenerationLog(message);
      triggerToast?.(message, 'error');
    } finally {
      setTimeout(() => setIsGeneratingImage(false), 400);
    }
  };

  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

  const editorWordCount = localAssetContent ? localAssetContent.split(/\s+/).filter(Boolean).length : 0;
  const editorCharCount = (localAssetContent || '').length;
  const editorCharCountNoSpaces = (localAssetContent || '').replace(/\s/g, '').length;
  const estimatedReadMinutes = Math.max(1, Math.round(editorWordCount / 220));

  const socialCharLimits: Record<string, number> = {
    Twitter: 280,
    LinkedIn: 3000,
    Facebook: 63206,
  };

  const openVersionCompare = (leftIdx: number, rightIdx: number) => {
    setCompareLeftIdx(leftIdx);
    setCompareRightIdx(rightIdx);
    setCompareDiffViewMode('side');
    setIsComparePanelOpen(true);
    setIsCompareModalOpen(true);
  };

  const applyQuickPolish = (prompt: string) => {
    setFeedbackInput(prompt);
    setTimeout(() => {
      feedbackInputRef.current?.focus();
      const len = prompt.length;
      feedbackInputRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  const quickPolishPresets = [
    {
      label: 'Make it more professional',
      prompt:
        'Rewrite this draft with a polished, professional tone. Use clear, authoritative language appropriate for B2B audiences. Remove casual slang, tighten sentence structure, and maintain credibility without sounding stiff.',
    },
    {
      label: 'Increase urgency',
      prompt:
        'Increase urgency throughout this copy. Strengthen calls to action, add time-sensitive language where appropriate, and emphasize why the reader should act now—without resorting to hype or false scarcity.',
    },
    {
      label: 'Simplify language',
      prompt:
        'Simplify the language in this draft. Use shorter sentences, plain words, and active voice. Cut jargon and redundancy while preserving the core message and key selling points.',
    },
    {
      label: 'Sharpen for SEO',
      prompt:
        'Optimize this draft for search and readability: improve headline clarity, weave target keywords naturally, strengthen meta-worthy opening lines, and ensure scannable structure with clear subheadings.',
    },
    {
      label: 'More conversational',
      prompt:
        'Make this copy warmer and more conversational. Use approachable phrasing and natural rhythm while keeping it on-brand and purposeful for our audience.',
    },
  ];

  const tonePresets = [
    { 
      label: '👔 Professional', 
      value: 8, 
      feedback: 'Rewrite this copy with a highly professional, authoritative, corporate enterprise brand tone.',
      structureTooltip: 'Structure Impact: Organizes headings with analytical clarity, removes loose conversational fillers, and lists clear B2B value metrics.'
    },
    { 
      label: '☕ Casual', 
      value: 3, 
      feedback: 'Refine this copy to make it more casual, approachable, warm, and highly conversational.',
      structureTooltip: 'Structure Impact: Transforms rigid paragraph grids into flowing conversational storytelling segments with friendly personal pronoun bindings.'
    },
    { 
      label: '🔥 Urgent', 
      value: 10, 
      feedback: 'Infuse strong urgency, direct high-intent action phrases, and high conversion energy.',
      structureTooltip: 'Structure Impact: Shifts high-impact summaries immediately to the top banner and integrates bold active-verb action statements.'
    },
    { 
      label: '💡 Creative', 
      value: 6, 
      feedback: 'Inject a brilliant, story-driven, creative and clever metaphorical style into the copy.',
      structureTooltip: 'Structure Impact: Weaves original narrative analogies directly into primary subheadings and leverages vivid storytelling imagery.'
    }
  ];

  const getPerformanceMetrics = () => {
    const wordCount = localAssetContent ? localAssetContent.split(/\s+/).filter(Boolean).length : 0;
    
    switch (assetType) {
      case 'seo_keywords':
        return {
          metricName: 'Search Reach Multiplier',
          val: '2.8x',
          score: 88,
          details: [
            { label: 'Semantic keyword relevance', value: 'High (89/100)' },
            { label: 'Domain search authority lift', value: '+14.5%' },
            { label: 'Long-tail keyword volume', value: '~4,500/mo' }
          ]
        };
      case 'blog_post':
        const readTime = Math.max(1, Math.round(wordCount / 220));
        return {
          metricName: 'Avg. Reader Stay Time',
          val: `${readTime} min read`,
          score: Math.min(95, 75 + Math.round(wordCount / 100)),
          details: [
            { label: 'Estimated Click-Through (CTR)', value: '4.8% - 5.5%' },
            { label: 'Reader readability index', value: 'Premium (Flesch: 72)' },
            { label: 'Projected lead conversion factor', value: '2.1%' }
          ]
        };
      case 'social_posts':
        return {
          metricName: 'Projected Impressions',
          val: '12,500+',
          score: 92,
          details: [
            { label: 'Viral reach coefficient', value: '1.45 (Above Avg)' },
            { label: 'Optimal share audience score', value: '94/100' },
            { label: 'Estimated aggregate CTR', value: '3.6%' }
          ]
        };
      case 'email_sequence':
        return {
          metricName: 'Expected Open Rate',
          val: '22% - 26%',
          score: 87,
          details: [
            { label: 'Click-to-Open Rate (CTOR)', value: '14.2%' },
            { label: 'Spam trigger hazard index', value: 'Clean (0.02%)' },
            { label: 'Nurture pipeline dropoff risk', value: 'Low' }
          ]
        };
      case 'lead_magnet':
        return {
          metricName: 'Opt-in Conversion Gate',
          val: '8.4%',
          score: 94,
          details: [
            { label: 'Opt-in submission rate', value: '8.4% (Industry avg: 3.2%)' },
            { label: 'Valuation score of resource', value: 'Elite (96/100)' },
            { label: 'List acceleration index', value: 'High' }
          ]
        };
      default:
        return {
          metricName: 'Estimated Engagement Ratio',
          val: '74%',
          score: 85,
          details: [
            { label: 'Aesthetic layout score', value: 'High' },
            { label: 'Conversion copywriting hook', value: 'Strong' }
          ]
        };
    }
  };

  useEffect(() => {
    // Reset conversation history and clear scheduled state when a brand new asset loads
    setChatHistory([
      {
        id: 'init',
        role: 'assistant',
        text: `Hello! I've formulated this growth copy for **${companyInfo.brandName}**. Review the strategy and text draft. If you need revisions—like shifting the tone, expanding a topic, or tuning the Call To Actions—just type your instructions or select one of our quick-refinement guidelines below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsScheduled(false);
  }, [asset.title, companyInfo.brandName, assetType]);

  const handleCopy = async () => {
    const fullText = `=== ${asset.title} ===\n\n[CMO Note]: ${asset.summary}\n\n[Content]:\n${localAssetContent}\n\n[CTA]: ${asset.taglineOrCTA}\n\n[Metadata / SEO Optimization]:\n${asset.seoInstructions}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (triggerToast) {
      triggerToast('Asset templates & copy copied to clipboard!', 'success');
    }
  };

  const handleCopyWordPress = async () => {
    const featuredImageUrl = studioImageSrc();
    const wpHtml = toWordPressBlocks(localAssetContent, buildWordPressSeoMeta(featuredImageUrl));
    await navigator.clipboard.writeText(wpHtml);

    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `${assetType}-hero.png`;
      link.click();
    }

    setCopiedWp(true);
    setTimeout(() => setCopiedWp(false), 2000);
    const imageNote = isGeneratedImageUrl(featuredImageUrl)
      ? ' Hero image downloaded — set it as Featured image in WordPress sidebar.'
      : ' Generate a custom Imagen image in Campaign Studio for a matching hero.';
    triggerToast?.(
      `WordPress HTML copied.${imageNote}`,
      'success',
    );
  };

  const handlePublishWordPress = async (asDraft: boolean) => {
    if (!isCloudEnabled()) {
      triggerToast?.('Sign in and connect WordPress in Settings → Integrations.', 'info');
      return;
    }
    if (currentApprovalStatus !== 'approved' && currentApprovalStatus !== 'published' && !asDraft) {
      setShowApprovalPanel(true);
      triggerToast?.('Click the green Approved button below, then Publish again.', 'info');
      return;
    }
    setIsPublishing(true);
    try {
      const result = await publishToWordPress({
        title: asset.title || `${companyInfo.brandName} blog post`,
        content: toWordPressBlocks(localAssetContent, buildWordPressSeoMeta(studioImageSrc())) || localAssetContent,
        excerpt: asset.summary || '',
        status: asDraft ? 'draft' : 'publish',
      });
      triggerToast?.(
        asDraft ? `Draft saved on WordPress (ID ${result.postId}).` : `Published: ${result.link || result.postId}`,
        'success'
      );
      recordPublishEvent({
        assetType,
        title: asset.title || `${companyInfo.brandName} blog post`,
        url: result.link,
        platform: 'wordpress',
      });
      onUpdateApproval?.(0, 'published');
    } catch (e: unknown) {
      triggerToast?.(e instanceof Error ? e.message : 'Publish failed', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleManualSave = () => {
    if (onUpdateAssetContent) {
      onUpdateAssetContent(assetType, localAssetContent);
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(timeStr);
    
    // Save full cached assets object directly to local storage
    const saved = localStorage.getItem('ai_cmo_cached_assets');
    try {
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[assetType] = { ...asset, content: localAssetContent };
      localStorage.setItem('ai_cmo_cached_assets', JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
    
    if (triggerToast) {
      triggerToast('Deliverable state and edits saved successfully!', 'success');
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (formatType: 'bold' | 'bullet' | 'capitalize') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const origText = localAssetContent;
    const selectedText = origText.substring(start, end);

    let replacement = '';
    
    if (formatType === 'bold') {
      if (selectedText) {
        replacement = `**${selectedText}**`;
      } else {
        replacement = `****`;
      }
    } else if (formatType === 'bullet') {
      if (selectedText) {
        const lines = selectedText.split('\n');
        replacement = lines.map(l => {
          const trimmedLine = l.trim();
          if (!trimmedLine) return l;
          return trimmedLine.startsWith('- ') ? trimmedLine : `- ${trimmedLine}`;
        }).join('\n');
      } else {
        replacement = `- `;
      }
    } else if (formatType === 'capitalize') {
      const titleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        });
      };
      
      if (selectedText) {
        const lines = selectedText.split('\n');
        replacement = lines.map(line => {
          if (line.startsWith('#')) {
            const numHashes = line.match(/^#+/)?.[0]?.length || 0;
            const textPart = line.substring(numHashes).trim();
            return `${'#'.repeat(numHashes)} ${titleCase(textPart)}`;
          }
          return titleCase(line);
        }).join('\n');
      } else {
        return;
      }
    }

    const nextText = origText.substring(0, start) + replacement + origText.substring(end);
    setLocalAssetContent(nextText);
    
    // Resume cursor and focus
    setTimeout(() => {
      textarea.focus();
      const offset = replacement.length;
      textarea.setSelectionRange(start, start + offset);
    }, 50);
  };

  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string>('');

  const handleTogglePlatform = (platformName: string) => {
    if (connectedSocials.includes(platformName)) {
      setConnectedSocials(prev => prev.filter(p => p !== platformName));
    } else {
      setSelectedSocialPlatform(platformName);
      setShowSocialModal(true);
    }
  };

  const handleConfirmSocialConnect = () => {
    if (selectedSocialPlatform && !connectedSocials.includes(selectedSocialPlatform)) {
      setConnectedSocials(prev => [...prev, selectedSocialPlatform]);
    }
    setShowSocialModal(false);
  };

  const submitFeedback = async (text: string, overrideIntensity?: number) => {
    if (!text.trim() || isRefining) return;
    
    const activeIntensity = overrideIntensity !== undefined ? overrideIntensity : toneIntensity;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setFeedbackInput('');

    try {
      await onRefineAsset(text, activeIntensity);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        text: `Revised blueprint output successfully compiled! Check the updated panels above. I have adjusted the styling to Tone Level ${activeIntensity}/10 as requested. What's our next marketing check?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        text: `Apologies, we hit a processing lock: ${err.message || "Request timeout"}. Please confirm network and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    }
  };

  const quickPills = [
    { label: '⚡ Make it more witty', text: 'Please refine this draft to make the tone of voice significantly more witty, clever and punchy.' },
    { label: '✍️ Shorten & focus', text: 'Keep it highly concise and remove any fluff. Tighten up the copy and optimize for quick scanning.' },
    { label: '🎯 Stronger CTA', text: 'Ramp up the CTA. Make the call to action highly compelling and create a strong reason to act now.' },
    { label: '📌 Highlight pain points', text: 'Emphasize the core pain points of our target customer segment specifically in the early paragraphs.' }
  ];

  // Numbered Next Step Options matching the required workflow rules !
  const fetchNextOptions = () => {
    switch (assetType) {
      case 'seo_keywords':
        return [
          { index: 1, label: 'Write SEO blog article draft leveraging these exact keywords', actionType: 'blog_post' as MarketingAssetType },
          { index: 2, label: 'Formulate highly targeted email nurture follow-ups', actionType: 'email_sequence' as MarketingAssetType },
          { index: 3, label: 'Return to Executive Boardroom Strategy Matrix', actionType: 'dashboard' }
        ];
      case 'blog_post':
        return [
          { index: 1, label: 'Design landing page / Lead Magnet concept for traffic conversion', actionType: 'lead_magnet' as MarketingAssetType },
          { index: 2, label: 'Generate ready-to-publish social promotion bundle', actionType: 'social_posts' as MarketingAssetType },
          { index: 3, label: 'Back to Executive Boardroom', actionType: 'dashboard' }
        ];
      case 'social_posts':
        return [
          { index: 1, label: 'Draft conversion email newsletter campaign', actionType: 'email_sequence' as MarketingAssetType },
          { index: 2, label: 'Extract SEO semantic search keywords for additional outreach', actionType: 'seo_keywords' as MarketingAssetType },
          { index: 3, label: 'Back to Executive Boardroom', actionType: 'dashboard' }
        ];
      case 'email_sequence':
        return [
          { index: 1, label: 'Create a high-value Lead Magnet ebook concept for sign-ups', actionType: 'lead_magnet' as MarketingAssetType },
          { index: 2, label: 'Formulate organic SEO blog posts to seed standard opt-ins', actionType: 'blog_post' as MarketingAssetType },
          { index: 3, label: 'Back to Executive Boardroom', actionType: 'dashboard' }
        ];
      case 'lead_magnet':
        return [
          { index: 1, label: 'Draft welcome email sequence for lead signups', actionType: 'email_sequence' as MarketingAssetType },
          { index: 2, label: 'Generate targeted launch social campaign (X/LinkedIn)', actionType: 'social_posts' as MarketingAssetType },
          { index: 3, label: 'Back to Executive Boardroom', actionType: 'dashboard' }
        ];
    }
  };

  // Dynamically extract peak high-impact keywords from localAssetContent
  const stopWordsForKeywords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'is', 'for', 'that', 'with', 'on', 'this', 'our', 'your', 'we', 'are', 'you', 'it', 'us', 'an', 'or', 'at', 'as', 'by', 'be', 'your', 'with', 'from', 'this', 'that', 'which', 'will', 'about', 'more', 'their', 'they', 'have', 'been', 'would', 'should']);
  const kwWords = (localAssetContent || '').split(/\s+/).filter(Boolean);
  const kwFreq: Record<string, number> = {};
  kwWords.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && clean.length > 4 && !stopWordsForKeywords.has(clean)) {
      kwFreq[clean] = (kwFreq[clean] || 0) + 1;
    }
  });
  const sortedTargetKeywords = Object.entries(kwFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(x => x[0]);

  const getKeywordChartData = () => {
    const baseKeywords = sortedTargetKeywords.length > 0 
      ? sortedTargetKeywords 
      : ['digital transformation', 'enterprise optimization', 'organic conversions', 'marketing automation', 'growth strategies'];

    return baseKeywords.map((kw) => {
      let hash = 0;
      for (let i = 0; i < kw.length; i++) {
        hash = kw.charCodeAt(i) + ((hash << 5) - hash);
      }
      const val1 = Math.abs((hash % 8) + 1) * 300 + 400;
      const val2 = Math.abs((hash % 5) + 1) * 15 + 40;
      const ctr = parseFloat((Math.abs((hash % 4) + 1) * 1.5 + 2).toFixed(1));

      const capitalizedKw = kw.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      return {
        name: capitalizedKw,
        volume: val1,
        visibility: val2,
        ctr: ctr
      };
    });
  };

  const nextOptions = fetchNextOptions();

  return (
    <div className="space-y-8 pb-20 min-w-0 w-full overflow-x-hidden">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          id="back-to-boardroom-btn"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-300 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Strategy Boardroom</span>
        </button>

        <span className="text-[10px] bg-amber-950/40 text-amber-400 border border-amber-500/20 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Production Active
        </span>
      </div>

      {/* 2. Primary Asset Container — side-by-side refine panel only at xl+ to avoid clipping */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start min-w-0 w-full">
        
        {/* Left Side: Elaborated Draft display */}
        <div className="xl:col-span-8 space-y-6 min-w-0 w-full">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden min-w-0">
            {/* Asset Top Actions Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 md:px-6 flex flex-wrap justify-between items-start sm:items-center gap-3 bg-slate-900/95 sticky top-0 z-10">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                  ACTIVE DELIVERABLE
                </span>
                <h3 className="text-md font-display font-extrabold text-white">
                  {asset.title || "Copywriting Document"}
                </h3>
              </div>
              <div className="flex items-center flex-wrap gap-2 select-none">
                {/* Auto-save Status Indicator */}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 bg-slate-950/80 border border-slate-850 rounded text-[9px] font-mono text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                  <span>{isSaving ? "AUTO-SAVING..." : lastSaved ? `AUTO-SAVED AT ${lastSaved}` : "SAVED TO LOCAL STORAGE"}</span>
                </div>

                <button
                  type="button"
                  id="open-copywriter-sidebar-btn"
                  onClick={() => setIsCopywriterOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 text-white font-bold rounded text-xs cursor-pointer shadow-sm transition-all active:scale-95"
                  title="Open AI Copywriter conversation drawer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI Copywriter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRefineExpandToken((t) => t + 1);
                    document.getElementById('refine-draft-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 text-white font-bold rounded-md text-sm cursor-pointer shadow-sm transition-all active:scale-95"
                  title="Jump to refine tools below"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Refine draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApprovalPanel(!showApprovalPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-semibold cursor-pointer ${
                    showApprovalPanel
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                  title="Open review status — choose Approved before live publish"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Status: <span className="capitalize">{currentApprovalStatus.replace('_', ' ')}</span></span>
                </button>

                {onExportCampaignBundle && (
                  <button
                    type="button"
                    id="workspace-export-bundle-btn"
                    onClick={onExportCampaignBundle}
                    disabled={isExportingBundle}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-semibold rounded text-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                    title="Export full campaign ZIP"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isExportingBundle ? 'Exporting…' : 'Export ZIP'}</span>
                  </button>
                )}

                {assetType === 'blog_post' && isCloudEnabled() && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePublishWordPress(true)}
                      disabled={isPublishing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold rounded text-xs cursor-pointer disabled:opacity-50"
                      title="Save as WordPress draft"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isPublishing ? 'Publishing…' : 'WP Draft'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublishWordPress(false)}
                      disabled={isPublishing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-700 text-white font-bold rounded text-xs cursor-pointer disabled:opacity-50"
                      title="Publish to WordPress"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Publish</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleManualSave}
                  title="Manually save current changes instantly to local storage"
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 hover:border-emerald-500 text-slate-950 hover:text-slate-950 font-bold rounded text-xs cursor-pointer shadow-sm select-none transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  id="toggle-seo-checklist-btn"
                  onClick={() => setShowSeoChecklist(!showSeoChecklist)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    showSeoChecklist 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                  title="Toggle SEO Checklist Sidebar"
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>SEO Checklist</span>
                </button>
                <button
                  id="copy-asset-btn"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white rounded text-xs font-semibold cursor-pointer shadow-sm select-none transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">In Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Document</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="copy-wordpress-html-btn"
                  onClick={handleCopyWordPress}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-950/50 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 hover:text-white rounded text-xs font-semibold cursor-pointer shadow-sm select-none transition-all active:scale-95"
                  title="Copy Gutenberg block HTML for WordPress Code editor"
                >
                  {copiedWp ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-4 h-4 text-blue-300" />
                      <span className="hidden sm:inline">Copy WordPress HTML</span>
                      <span className="sm:hidden">WP HTML</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showApprovalPanel && onUpdateApproval && (
              <div className="px-4 py-4 bg-slate-950 border-b border-purple-500/20 space-y-3">
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">Review status</span> — pick{' '}
                  <span className="text-emerald-400 font-bold">Approved</span> before live WordPress publish.
                  Or use <span className="text-slate-200 font-semibold">WP Draft</span> to skip this step.
                </p>
                <div className="flex flex-wrap gap-2">
                  {APPROVAL_STEPS.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => onUpdateApproval(0, step.id, approvalComment)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border ${
                        step.id === 'approved'
                          ? currentApprovalStatus === step.id
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50'
                          : currentApprovalStatus === step.id
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder={`Comment as ${assigneeName}…`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (approvalComment.trim()) {
                        onUpdateApproval(0, currentApprovalStatus, approvalComment);
                        setApprovalComment('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Add comment
                  </button>
                </div>
              </div>
            )}

            {/* Live Copycraft Custom Controller Ribbon */}
            <div className="bg-slate-950 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 text-xs text-slate-350 select-none min-w-0">
              {/* Left Side: Layout presets / Editor mode switcher */}
              <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className={`px-3 py-1 rounded text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !editMode 
                      ? 'bg-amber-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Render HTML output preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Strategic Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className={`px-3 py-1 rounded text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    editMode 
                      ? 'bg-amber-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Open live editor and markdown customizer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Interactive Editor</span>
                </button>
              </div>

              {/* Live word & character count for SEO / social limits */}
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono border border-slate-800 bg-slate-900/80 rounded-lg px-3 py-1.5 max-w-full min-w-0 basis-full lg:basis-auto"
                title="Live counts update as you edit"
              >
                <span className="text-slate-500 uppercase font-bold tracking-wider">Length</span>
                <span className="text-slate-200">
                  <span className="text-amber-400 font-bold">{editorWordCount}</span> words
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-200">
                  <span className="text-amber-400 font-bold">{editorCharCount}</span> chars
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-slate-450 hidden sm:inline">{editorCharCountNoSpaces} no spaces</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-450">~{estimatedReadMinutes} min read</span>
                {assetType === 'social_posts' && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span
                      className={
                        editorCharCount > socialCharLimits[activeSocialTab]
                          ? 'text-rose-400 font-bold'
                          : editorCharCount > socialCharLimits[activeSocialTab] * 0.9
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }
                    >
                      {activeSocialTab}: {editorCharCount}/{socialCharLimits[activeSocialTab]}
                    </span>
                  </>
                )}
                {assetType === 'blog_post' && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className={editorWordCount >= 300 && editorWordCount <= 2500 ? 'text-emerald-400' : 'text-slate-450'}>
                      SEO body: {editorWordCount >= 300 ? '✓' : '○'} 300+ words
                    </span>
                  </>
                )}
              </div>

              {/* Right Side: Visual Overlays & Toggles */}
              <div className="flex items-center gap-4">
                {/* Keyword Highlighter Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium" title="Scan copy to highlight target keywords">
                  <input
                    type="checkbox"
                    checked={highlightKeywords}
                    onChange={(e) => setHighlightKeywords(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-amber-500/50 focus:ring-opacity-25 accent-amber-500"
                  />
                  <div className="flex items-center gap-1 text-slate-300">
                    <Sparkles className={`w-3.5 h-3.5 ${highlightKeywords ? 'text-amber-400 animate-pulse' : 'text-slate-505'}`} />
                    <span>Keyword Highlighter</span>
                  </div>
                </label>

                {/* Readability Heatmap Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium" title="Visualize paragraph complexity levels in real time font-sans">
                  <input
                    type="checkbox"
                    checked={enableHeatmap}
                    onChange={(e) => setEnableHeatmap(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-amber-500/50 focus:ring-opacity-25 accent-amber-500"
                  />
                  <div className="flex items-center gap-1 text-slate-300">
                    <BarChart3 className={`w-3.5 h-3.5 ${enableHeatmap ? 'text-emerald-450' : 'text-slate-505'}`} />
                    <span>Readability Heatmap</span>
                  </div>
                </label>
              </div>
            </div>

            {/* CMO Strategy Callout Box */}
            <div className="p-4 md:px-6 bg-slate-950/40 border-b border-slate-800">
              <div className="flex gap-2.5 items-start">
                <div className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-emerald-400 font-mono font-bold rounded shrink-0 uppercase mt-0.5 border border-slate-705">
                  Strategic rationale
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic font-sans animate-pulse-slow">
                  "{asset.summary || "This deliverable targets high-intent queries with authority, matching our core target segment points."}"
                </p>
              </div>
            </div>

            {/* Core copy block — content full width; SEO checklist stacks below (no side squeeze) */}
            <div className="flex flex-col divide-y divide-slate-800 min-w-0">
              <div className="p-6 md:p-8 bg-slate-900/10 min-h-[420px] min-w-0 overflow-x-auto">
                {editMode ? (
                  <div className="flex flex-col xl:flex-row gap-5 items-start w-full animate-fade-in">
                    {/* The Monospace Editor TextArea */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-950/60 p-2 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-450 select-none">
                        <span>📝 Markdown Input Canvas</span>
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="text-slate-400">
                            <span className="text-white font-bold">{editorWordCount}</span> words
                          </span>
                          <span className="text-slate-700">·</span>
                          <span className="text-slate-400">
                            <span className="text-white font-bold">{editorCharCount}</span> characters
                          </span>
                          {assetType === 'social_posts' && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span
                                className={
                                  editorCharCount > socialCharLimits[activeSocialTab]
                                    ? 'text-rose-400 font-bold'
                                    : 'text-emerald-400/90'
                                }
                              >
                                {activeSocialTab} limit {socialCharLimits[activeSocialTab]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <textarea
                        id="document-textarea"
                        ref={textareaRef}
                        value={localAssetContent}
                        onChange={(e) => setLocalAssetContent(e.target.value)}
                        placeholder="Write or edit marketing draft copy here..."
                        className="w-full h-[380px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 text-xs md:text-sm font-mono leading-relaxed"
                      />
                      <p className="text-[9px] text-slate-550 font-sans leading-relaxed px-0.5">
                        Counts update live. Use character limits for social posts; aim for 300+ words on long-form SEO content.
                      </p>
                    </div>

                    {/* Floating Quick Edit Toolbar Column */}
                    <div className="w-full xl:w-36 shrink-0 bg-slate-950 p-3.5 border border-slate-800 rounded-xl space-y-3 shadow-md flex flex-col justify-between self-stretch">
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block border-b border-slate-850 pb-1.5 flex items-center gap-1 select-none">
                          <Settings className="w-3 h-3 text-amber-500" />
                          Quick format
                        </span>
                        
                        <button
                          type="button"
                          id="format-bold-btn"
                          onClick={() => applyFormatting('bold')}
                          className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-[11px] text-slate-200 hover:text-white rounded font-sans font-semibold transition-all active:scale-95 cursor-pointer text-left"
                          title="Bold selected text segment"
                        >
                          <span className="flex items-center gap-2">
                            <strong className="text-white font-extrabold text-xs">B</strong>
                            <span>Bold Selected</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          id="format-bullet-btn"
                          onClick={() => applyFormatting('bullet')}
                          className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-[11px] text-slate-200 hover:text-white rounded font-sans font-semibold transition-all active:scale-95 cursor-pointer text-left"
                          title="Prefix selection lines with Bullet list points"
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-amber-500">•</span>
                            <span>Bullet List</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          id="format-capitalize-btn"
                          onClick={() => applyFormatting('capitalize')}
                          className="w-full flex items-center justify-between px-2.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-[11px] text-slate-200 hover:text-white rounded font-sans font-semibold transition-all active:scale-95 cursor-pointer text-left"
                          title="Convert selected headings or text to Title Case capitalization"
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-emerald-400">Aa</span>
                            <span>Cap Headings</span>
                          </span>
                        </button>
                      </div>

                      <div className="bg-slate-900/60 p-2 rounded border border-slate-850/45 text-[9px] text-slate-500 font-mono leading-tight select-none mt-4">
                        Highlight any text segment in the input box, then press a format tool to instantly adjust the inline copy!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 max-w-full">
                    {/* Email drip & newsletter mockup viewport */}
                    {!editMode && assetType === 'email_sequence' && (
                      <EmailMockupViewport
                        content={localAssetContent}
                        brandName={companyInfo.brandName}
                        taglineOrCTA={asset.taglineOrCTA}
                      />
                    )}

                    {/* Campaign Studio Visual Suite — all marketing content types */}
                    {!editMode && (
                      <div className="mb-8 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-xl select-none animate-fade-in">
                        
                        {/* Title and Workspace Description */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-4 mb-5">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-450 font-bold uppercase tracking-wider block">
                              🎨 Campaign Studio Visual Suite
                            </span>
                            <h4 className="text-sm font-display font-black text-white uppercase mt-0.5 tracking-tight">
                              {getStudioLabels(assetType).suite}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1">{getStudioLabels(assetType).panel}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsAiEditorOverlayOpen(true)}
                              className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[11px] text-amber-400 hover:text-amber-300 font-bold font-sans rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              <Code2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                              <span>AI Prompt Overlay</span>
                            </button>
                          </div>
                        </div>

                        <style>{`
                          .campaign-studio-grid {
                            display: flex;
                            flex-direction: column;
                            gap: 1.5rem;
                            width: 100%;
                          }
                          .studio-controls-row {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 1.25rem;
                          }
                          @media (min-width: 768px) {
                            .studio-controls-row {
                              grid-template-columns: 1fr 1fr;
                              align-items: start;
                            }
                          }
                        `}</style>

                        <div className="campaign-studio-grid">
                          {/* Full-width preview on top */}
                          <div className="w-full flex flex-col space-y-4">
                              
                              {assetType === 'blog_post' && (
                                <div className="space-y-3 w-full bg-slate-900/40 p-1 rounded-2xl border border-slate-850">
                                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] w-full shadow-inner flex items-center justify-center">
                                    <img
                                      src={studioImageSrc()}
                                      alt={customImagePrompt || "Blog cover photo"}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                                    />
                                    
                                    {/* Top Studio Metadata Badges */}
                                    <div className="absolute top-3 left-3 flex gap-1.5 select-none z-10 pointer-events-none">
                                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-widest bg-slate-950/80 border border-slate-850/60 text-slate-300 px-2 py-1 rounded shadow-md backdrop-blur">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <span>STUDIO_LIVE</span>
                                      </span>
                                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-slate-950/80 border border-slate-850/60 text-slate-400 px-2 py-1 rounded shadow-md backdrop-blur">
                                        F/1.8 FIXED
                                      </span>
                                    </div>
                                    
                                    {/* Dark overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                                    {/* Glassmorphic progress modifier when Imagen is active */}
                                    {isGeneratingImage && (
                                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-center animate-fade-in">
                                        <div className="relative w-14 h-14 flex items-center justify-center mb-3">
                                          <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin" />
                                          <span className="text-[10px] font-mono font-bold text-white">{imageProgressPercentage}%</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black animate-pulse">
                                          Imagen Engine Active
                                        </span>
                                        <p className="text-[10px] text-slate-450 font-mono mt-1.5 max-w-[240px] leading-relaxed">
                                          {imageGenerationLog}
                                        </p>
                                      </div>
                                    )}

                                    {/* Live Title Overlay (optional toggle) */}
                                    {(!isGeneratingImage && showTitleOverlay) && (
                                      <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none animate-fade-in">
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                                          {artisticTheme.toUpperCase()} COVER
                                        </span>
                                        <h2 className="text-xs md:text-sm font-display font-extrabold text-white mt-1.5 drop-shadow-md leading-tight max-w-md line-clamp-2">
                                          {customImagePrompt || "Pristine Article Concept"}
                                        </h2>
                                      </div>
                                    )}
                                  </div>

                                  {/* Aspect Ratio Specifications Tagline */}
                                  <StudioImageMetaBar
                                    assetType={assetType}
                                    generatedImageUrl={generatedImageUrl}
                                    inspectUrl={generatedImageUrl || studioImageSrc()}
                                    showTitleOverlay={showTitleOverlay}
                                    onTitleOverlayChange={setShowTitleOverlay}
                                  />
                                </div>
                              )}

                              {/* Social Graphic Cards */}
                              {assetType === 'social_posts' && (
                                <div className="space-y-4 w-full">
                                  {/* Platform Selector Hub */}
                                  <div className="flex border-b border-slate-850 gap-1 overflow-x-auto">
                                    {[
                                      { id: 'LinkedIn', label: 'LinkedIn', color: 'text-blue-400 border-blue-400', icon: <Linkedin className="w-3 h-3 text-blue-400 shrink-0" /> },
                                      { id: 'Twitter', label: 'X (Twitter)', color: 'text-slate-200 border-slate-200', icon: <Twitter className="w-3 h-3 text-white shrink-0" /> },
                                      { id: 'Facebook', label: 'Facebook', color: 'text-blue-600 border-blue-600', icon: <Facebook className="w-3 h-3 text-blue-600 shrink-0 animate-fade-in" /> }
                                    ].map((t) => (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setActiveSocialTab(t.id as any)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-[11px] font-sans font-bold transition duration-150 cursor-pointer ${
                                          activeSocialTab === t.id
                                            ? `${t.color} bg-slate-900/60 font-extrabold`
                                            : 'border-transparent text-slate-500 hover:text-slate-300'
                                        }`}
                                      >
                                        {t.icon}
                                        <span>{t.label} Layout</span>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Composite mockup rendering box */}
                                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 shadow max-h-[350px] overflow-y-auto">
                                    {/* Mock account metadata header */}
                                    <div className="flex items-center justify-between border-b border-slate-850/40 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[10px] select-none">
                                          {companyInfo.brandName?.slice(0, 2).toUpperCase() || 'YB'}
                                        </div>
                                        <div>
                                          <h5 className="text-[11px] font-bold text-white flex items-center gap-1 leading-tight">
                                            <span>{companyInfo.brandName || 'Your brand'}</span>
                                            <span className="text-[8px] font-mono bg-slate-900 text-emerald-450 px-1 py-0.2 rounded">
                                              PRO
                                            </span>
                                          </h5>
                                          <span className="text-[9px] text-slate-500 block leading-none">
                                            {PRODUCT_NAME} • 1st • Just now
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-[9px] text-slate-500 font-mono">
                                        Widescreen card Preview
                                      </span>
                                    </div>

                                    {/* Trimmed copy */}
                                    <p className="text-[11px] text-slate-450 font-sans leading-relaxed line-clamp-3">
                                      {localAssetContent.split('###').filter(c => c.toLowerCase().includes(activeSocialTab.toLowerCase()))[0] 
                                        ? localAssetContent.split('###').filter(c => c.toLowerCase().includes(activeSocialTab.toLowerCase()))[0].replace(/LinkedIn|X \(Twitter\)|Twitter|Facebook/gi, '').trim()
                                        : localAssetContent.slice(0, 240) + '... (Modify full copy inside local editor)'}
                                    </p>

                                    {/* The Dynamic Social Image Card */}
                                    <div className="relative rounded-lg overflow-hidden border border-slate-850 bg-slate-900 aspect-[1.91/1] max-h-[190px] flex items-center justify-center">
                                      <img
                                        src={studioImageSrc(`${activeSocialTab}-${customImagePrompt}`)}
                                        alt="Linked social asset preview"
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover transition-transform duration-350"
                                      />

                                      {/* Glassmorphic progressive loading overlays */}
                                      {isGeneratingImage && (
                                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 text-center animate-fade-in">
                                          <div className="relative w-10 h-10 flex items-center justify-center mb-2">
                                            <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-emerald-500 animate-spin" />
                                            <span className="text-[8px] font-mono text-white">{imageProgressPercentage}%</span>
                                          </div>
                                          <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black animate-pulse">
                                            Synthesizing Social Graphic
                                          </span>
                                        </div>
                                      )}

                                      <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur border border-slate-800 text-[8px] font-mono text-slate-400 px-1.5 py-0.5 rounded uppercase">
                                        {artisticTheme} style
                                      </div>
                                    </div>

                                    {/* Social metrics engagement */}
                                    <div className="flex items-center justify-between border-t border-slate-850/40 pt-2 text-slate-500 text-[10px] font-medium select-none">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const holds = socialMetrics[activeSocialTab];
                                          setSocialMetrics({
                                            ...socialMetrics,
                                            [activeSocialTab]: {
                                              ...holds,
                                              likes: holds.liked ? holds.likes - 1 : holds.likes + 1,
                                              liked: !holds.liked
                                            }
                                          });
                                        }}
                                        className={`flex items-center gap-1 hover:text-white cursor-pointer py-1 px-2 rounded hover:bg-slate-900 transition ${
                                          socialMetrics[activeSocialTab].liked ? 'text-emerald-400 font-bold bg-emerald-500/10' : ''
                                        }`}
                                      >
                                        <span>👍</span>
                                        <span>{socialMetrics[activeSocialTab].likes} Likes</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const holds = socialMetrics[activeSocialTab];
                                          setSocialMetrics({
                                            ...socialMetrics,
                                            [activeSocialTab]: { ...holds, comments: holds.comments + 1 }
                                          });
                                        }}
                                        className="flex items-center gap-1 hover:text-white cursor-pointer py-1 px-2 rounded hover:bg-slate-900 transition"
                                      >
                                        <span>💬</span>
                                        <span>{socialMetrics[activeSocialTab].comments} Comments</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const holds = socialMetrics[activeSocialTab];
                                          setSocialMetrics({
                                            ...socialMetrics,
                                            [activeSocialTab]: { ...holds, shares: holds.shares + 1 }
                                          });
                                        }}
                                        className="flex items-center gap-1 hover:text-white cursor-pointer py-1 px-2 rounded hover:bg-slate-900 transition"
                                      >
                                        <span>🔁</span>
                                        <span>{socialMetrics[activeSocialTab].shares} Shares</span>
                                      </button>
                                    </div>
                                  </div>

                                  <StudioImageMetaBar
                                    assetType={assetType}
                                    generatedImageUrl={generatedImageUrl}
                                    inspectUrl={generatedImageUrl || studioImageSrc(`${activeSocialTab}-${customImagePrompt}`)}
                                  />
                                </div>
                              )}

                              {(assetType === 'email_sequence' || assetType === 'lead_magnet' || assetType === 'seo_keywords') && (
                                <div className="space-y-3 w-full bg-slate-900/40 p-1 rounded-2xl border border-slate-850">
                                  <div
                                    className={`relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 w-full shadow-inner flex items-center justify-center ${
                                      assetType === 'lead_magnet' ? 'aspect-square max-w-md mx-auto' : 'aspect-[16/9]'
                                    }`}
                                  >
                                    <img
                                      src={studioImageSrc()}
                                      alt={customImagePrompt || 'Campaign visual'}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    {isGeneratingImage && (
                                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-center">
                                        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                                        <span className="text-[10px] font-mono text-emerald-400 uppercase">{imageGenerationLog}</span>
                                      </div>
                                    )}
                                    {!isGeneratingImage && showTitleOverlay && (
                                      <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none">
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                                          {artisticTheme.toUpperCase()}
                                        </span>
                                        <h2 className="text-xs md:text-sm font-display font-extrabold text-white mt-1.5 drop-shadow-md line-clamp-2">
                                          {customImagePrompt}
                                        </h2>
                                      </div>
                                    )}
                                  </div>
                                  <StudioImageMetaBar
                                    assetType={assetType}
                                    generatedImageUrl={generatedImageUrl}
                                    inspectUrl={generatedImageUrl || studioImageSrc()}
                                    showTitleOverlay={showTitleOverlay}
                                    onTitleOverlayChange={setShowTitleOverlay}
                                    className="border-0 bg-transparent px-3"
                                  />
                                </div>
                              )}
                          </div>

                          <div className="studio-controls-row">
                          <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                              <div>
                                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider block">
                                  🪄 1. DESIGN THEME SELECTION
                                </span>
                                <h5 className="text-[11px] font-bold text-white uppercase mt-0.5">
                                  Visual Branding Panel
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans text-xs">
                                  Select an artistic style theme to inject customized modifiers into the Imagen generator:
                                </p>
                              </div>

                              {/* Grid of beautiful artistic themes */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-2 gap-2.5">
                                {[
                                  { id: 'minimalist', label: '🌿 Minimalist', desc: 'Sober geometric lines', color: 'from-slate-200 to-zinc-400' },
                                  { id: 'vibrant', label: '🔥 Saturated', desc: 'Explosive rich contrast', color: 'from-orange-500 to-rose-500' },
                                  { id: 'corporate', label: '💼 Enterprise', desc: 'Sober dark-blue geometry', color: 'from-blue-600 to-indigo-800' },
                                  { id: 'neon', label: '🌌 Future Cyber', desc: 'Glow synthwave grids', color: 'from-cyan-400 to-fuchsia-500' },
                                  { id: 'organic', label: '🌱 Nature Sage', desc: 'Sustainable organic flora', color: 'from-emerald-500 to-green-700' },
                                  { id: 'retro', label: '📜 Warm Retro', desc: 'Vintage film tones', color: 'from-amber-600 to-yellow-800' },
                                  { id: 'cinematic', label: '🍿 Cinematic', desc: 'Dramatic shadows, Octane 3D', color: 'from-yellow-400 to-amber-500' }
                                ].map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setArtisticTheme(t.id as any)}
                                    className={`p-2.5 border text-left rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex flex-col gap-1.5 relative overflow-hidden select-none ${
                                      artisticTheme === t.id
                                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-400 shadow-lg shadow-amber-500/5'
                                        : 'bg-slate-950/80 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-900/60'
                                    }`}
                                    title={t.desc}
                                  >
                                    <div className="flex items-center justify-between w-full gap-1">
                                      <span className="text-[11px] font-bold font-sans leading-none">{t.label}</span>
                                      <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${t.color} shrink-0 shadow`} />
                                    </div>
                                    <span className="text-[9px] text-slate-500 line-clamp-1 leading-tight">{t.desc}</span>
                                    {artisticTheme === t.id && (
                                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-bl-md" />
                                    )}
                                  </button>
                                ))}
                              </div>
                          </div>

                          <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-4">
                            {/* Prompt customizing box */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                                <span>🎨 2. IMAGEN DESIGN PROMPT</span>
                                <span className="text-[9px] text-emerald-450 font-normal">Per content type</span>
                              </label>
                              <textarea
                                value={customImagePrompt}
                                onChange={(e) => setCustomImagePrompt(e.target.value)}
                                rows={4}
                                className="w-full text-[11px] bg-slate-950/80 border border-slate-850 rounded-xl p-2.5 text-slate-300 placeholder-slate-700 font-sans focus:outline-none focus:border-emerald-500/50 resize-y min-h-[88px] leading-normal"
                                placeholder="Describe the image you want Imagen to generate for this marketing piece…"
                              />
                              <p className="text-[9px] text-slate-500 leading-relaxed">
                                Saved per asset type — switch content and each keeps its own prompt.
                              </p>
                            </div>

                            {/* Imagen tool generator block */}
                            <div className="pt-3 border-t border-slate-850/40 space-y-1.5">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block leading-none">
                                Google Imagen — uses your design prompt
                              </span>
                              {!generatedImageUrl && (
                                <p className="text-[9px] text-amber-400/90 leading-relaxed">
                                  Preview above is a stock placeholder until you click Generate Custom Image.
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={handleTriggerImagenGeneration}
                                disabled={isGeneratingImage || !customImagePrompt}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 font-sans font-black uppercase text-xs tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-97"
                              >
                                {isGeneratingImage ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                                    <span>Rendering Art ({imageProgressPercentage}%)</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
                                    <span>Generate Custom Image</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          </div>

                        </div>

                      </div>
                    )}

                    {assetType === 'seo_keywords' && !editMode && (
                      <div className="mb-8 p-5 bg-slate-950 border border-slate-850 rounded-2xl space-y-4 shadow-xl select-none">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                              🔍 SEARCH & VISIBILITY PERFORMANCE
                            </span>
                            <h4 className="text-xs font-display font-black text-white uppercase mt-0.5">
                              Projected Search Volume & Generative Engine Visibility
                            </h4>
                          </div>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                            Active Forecast
                          </span>
                        </div>
                        
                        <div id="seo-rankings-recharts-container" className="h-[280px] min-h-[280px] w-full min-w-0 bg-slate-900/40 p-2 rounded-xl border border-slate-850/60">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                            <ComposedChart data={getKeywordChartData()} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                              <defs>
                                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={10} 
                                tickLine={false} 
                              />
                              <YAxis 
                                yAxisId="left" 
                                stroke="#10b981" 
                                fontSize={9} 
                                tickLine={false} 
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                stroke="#f59e0b" 
                                fontSize={9} 
                                tickLine={false}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                itemStyle={{ fontSize: '10px' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                              <Bar yAxisId="left" dataKey="volume" name="Search Volume/mo" fill="url(#volumeGrad)" stroke="#10b981" strokeWidth={1} radius={[4, 4, 0, 0]} />
                              <Line yAxisId="right" type="monotone" dataKey="visibility" name="Generative Visibility Score" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                          <div className="p-2 space-y-0.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">AGGREGATE MONTHLY REACH</span>
                            <span className="text-xs font-semibold text-white">
                              {getKeywordChartData().reduce((acc, k) => acc + k.volume, 0).toLocaleString()} views
                            </span>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">AVG GEO CITABILITY</span>
                            <span className="text-xs font-semibold text-amber-500">
                              {(getKeywordChartData().reduce((acc, k) => acc + k.visibility, 0) / getKeywordChartData().length).toFixed(1)}% High
                            </span>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">PROJECTED CLICK-THROUGH RATE</span>
                            <span className="text-xs font-semibold text-emerald-400">
                              {(getKeywordChartData().reduce((acc, k) => acc + k.ctr, 0) / getKeywordChartData().length).toFixed(2)}% CTR avg
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormatMarkdown 
                      text={localAssetContent} 
                      highlightKeywords={highlightKeywords} 
                      activeKeywords={sortedTargetKeywords} 
                      enableHeatmap={enableHeatmap} 
                    />

                    {/* Integrated External AI Interop & IDE Prompt Toolbox */}
                    {!editMode && (
                      <div className="mt-10 p-5 bg-slate-950 border border-slate-850 rounded-2xl space-y-4 text-left shadow-lg">
                        <div className="border-b border-slate-850 pb-3 flex justify-between items-center select-none">
                          <div>
                            <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider block">
                              🤝 Cross-Framework Interop Sandbox
                            </span>
                            <h4 className="text-xs font-display font-black text-white uppercase mt-0.5">
                              🤖 IDE & External AI Copilot Prompts (ChatGPT / Claude / Grok / Cursor)
                            </h4>
                          </div>
                          
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                            Active Sync
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans select-none">
                          Ready to extend or refactor this asset? Copy these highly contextual, prompt-engineered blocks directly into external LLMs or IDE environments to refactor, componentize or optimize this exact draft.
                        </p>

                        {/* Prompt IDE Navigation Selection Tabs */}
                        <div className="flex border-b border-slate-850 flex-wrap select-none">
                          {[
                            { id: 'cursor', label: '💻 Cursor & IDEs' },
                            { id: 'grok', label: '🐦 Grok 3 (X.com)' },
                            { id: 'claude', label: '🎭 Anthropic Claude' },
                            { id: 'chatgpt', label: '🧠 OpenAI ChatGPT' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveCopilotTab(tab.id as any);
                                setCopiedPromptId(null);
                              }}
                              className={`px-3.5 py-2 border-b-2 text-[11px] font-sans font-bold uppercase tracking-wider transition cursor-pointer ${
                                activeCopilotTab === tab.id
                                  ? 'border-amber-500 text-amber-500 font-extrabold bg-slate-900/40'
                                  : 'border-transparent text-slate-500 hover:text-slate-350'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Render Active Prompt Box */}
                        <div className="space-y-3">
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative font-mono text-xs select-all text-slate-300 leading-relaxed group max-h-[180px] overflow-y-auto whitespace-pre-wrap">
                            {/* Fetch prompt code based on tab selection */}
                            {activeCopilotTab === 'cursor' && (
`[System Instruction: You are an elite front-end developer inside a workspace IDE]
Please refactor this marketing copywriting content to act as a fully visual React component. Wrap this entire output inside an elegant React component called 'InteractiveArticle' with a responsive read-time tracker hook:

"""
${localAssetContent}
"""

Provide only the complete, typed TSX code without generic explanations.`
                            )}

                            {activeCopilotTab === 'grok' && (
`[System Instruction: You are Grok 3, highly witty, technical, and analytical]
Review this copywriting draft for enterprise enterprise tech relevance. Optimize the hooks to speak to senior executives, and convert any list format points into highly technical data metrics and tables:

"""
${localAssetContent}
"""

Inject factual industry projections and tighten the concluding call-to-action hook.`
                            )}

                            {activeCopilotTab === 'claude' && (
`[System Instruction: You are Claude 3.5 Sonnet, structured and highly articulate]
I need to convert the following marketing deliverable into a beautifully structured executive newsletter brief with clear action items and an impact-assessment table:

"""
${localAssetContent}
"""

Maintain an authoritative, elegant tone throughout.`
                            )}

                            {activeCopilotTab === 'chatgpt' && (
`[System Instruction: You are ChatGPT, a conversion copywriting expert]
Convert this campaign asset into a 5-day email launch drip marketing campaign. Each message segment should highlight a different pain point from the text below:

"""
${localAssetContent}
"""

Include personalized subject line options, preview text, and direct booking links.`
                            )}
                          </div>

                          {/* Quick Actions Footer */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-mono">
                              *Includes full live content snapshot ({localAssetContent.length} chars)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                let targetText = '';
                                if (activeCopilotTab === 'cursor') {
                                  targetText = `[System Instruction: You are an elite front-end developer inside a workspace IDE]\nPlease refactor this marketing copywriting content to act as a fully visual React component. Wrap this entire output inside an elegant React component called 'InteractiveArticle' with a responsive read-time tracker hook:\n\n"""\n${localAssetContent}\n"""\n\nProvide only the complete, typed TSX code without generic explanations.`;
                                } else if (activeCopilotTab === 'grok') {
                                  targetText = `[System Instruction: You are Grok 3, highly witty, technical, and analytical]\nReview this copywriting draft for enterprise tech relevance. Optimize the hooks to speak to senior executives, and convert any list format points into highly technical data metrics and tables:\n\n"""\n${localAssetContent}\n"""\n\nInject factual industry projections and tighten the concluding call-to-action hook.`;
                                } else if (activeCopilotTab === 'claude') {
                                  targetText = `[System Instruction: You are Claude 3.5 Sonnet, structured and highly articulate]\nI need to convert the following marketing deliverable into a beautifully structured executive newsletter brief with clear action items and an impact-assessment table:\n\n"""\n${localAssetContent}\n"""\n\nMaintain an authoritative, elegant tone throughout.`;
                                } else {
                                  targetText = `[System Instruction: You are ChatGPT, a conversion copywriting expert]\nConvert this campaign asset into a 5-day email launch drip marketing campaign. Each message segment should highlight a different pain point from the text below:\n\n"""\n${localAssetContent}\n"""\n\nInclude personalized subject line options, preview text, and direct booking links.`;
                                }
                                navigator.clipboard.writeText(targetText);
                                setCopiedPromptId(activeCopilotTab);
                                setTimeout(() => setCopiedPromptId(null), 2000);
                              }}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans text-xs rounded-lg transition-all active:scale-95 cursor-pointer shadow flex items-center gap-1.5"
                            >
                              {copiedPromptId === activeCopilotTab ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Prompt Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Copy Visual AI Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showSeoChecklist && (
                <div className="w-full bg-slate-950/40 p-6 space-y-4 transition-all duration-300 animate-fade-in border-t border-slate-800 min-w-0">
                  <div className="flex items-center justify-between border-b border-slate-805 pb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-duration-1000" />
                      SEO Copy Analyzer
                    </span>
                    <span className="text-[10px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded border border-slate-705 font-mono">
                      Live
                    </span>
                  </div>

                  {/* Calculations & Metrics */}
                  <SeoChecklistPanel localAssetContent={localAssetContent} asset={asset} />
                </div>
              )}
            </div>

            {/* Footnote direct CTA tag line */}
            <div className="p-4 md:px-6 bg-slate-950/60 border-t border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-500 uppercase font-mono text-[9px] mr-1">Primary conversion hook:</span>
                <span className="italic text-emerald-400">"{asset.taglineOrCTA}"</span>
              </div>
            </div>
          </div>

          {/* Actionable SEO / GEO discovery metadata */}
          {asset.seoInstructions && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Google Search & GEO Optimization Parameters
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-950/60 p-4 border border-slate-800 rounded-lg">
                {asset.seoInstructions}
              </p>
            </div>
          )}

          {/* New Dashboard Segment: Dynamic AI Performance Projections & Campaign Publishing Scheduler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Widget A: Dynamic Performance Projections */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    AI Copy Assessment & Projections
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    Forecast Active
                  </span>
                </div>

                {/* Main projection display */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-full">
                    {/* SVG Progress Ring */}
                    <svg className="absolute w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#1e293b"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - getPerformanceMetrics().score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs font-mono font-bold text-white">
                      {getPerformanceMetrics().score}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-wider">
                      PRIMARY FORECASTED METRIC:
                    </span>
                    <span className="text-base font-display font-extrabold text-white">
                      {getPerformanceMetrics().val}
                    </span>
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      ★ {getPerformanceMetrics().metricName}
                    </p>
                  </div>
                </div>

                {/* Sub metrics list breakdown */}
                <div className="space-y-2 mt-4 bg-slate-950/40 border border-slate-850 p-3.5 rounded-lg text-xs">
                  {getPerformanceMetrics().details.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4 border-b border-slate-900 last:border-0 pb-1.5 last:pb-0">
                      <span className="text-slate-450">{m.label}</span>
                      <span className="font-mono text-white font-semibold">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono mt-4 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-600" />
                <span>Simulated based on comparative regional metrics databases.</span>
              </div>
            </div>

            {/* Widget B: Calendar-based Scheduling Tool */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Campaign Publishing Scheduler
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                    Calendar Matcher
                  </span>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">
                      Suggested Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="publish-date-picker"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setIsScheduled(false);
                        }}
                        className="w-full text-xs bg-slate-950 text-white border border-slate-800 px-2.5 py-2 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">
                      Publish Time
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        id="publish-time-picker"
                        value={selectedTime}
                        onChange={(e) => {
                          setSelectedTime(e.target.value);
                          setIsScheduled(false);
                        }}
                        className="w-full text-xs bg-slate-950 text-white border border-slate-800 px-2.5 py-2 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Optimal recommendations details based on asset type */}
                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-xs space-y-1.5 mb-4">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                    Peak Reach Window Tip:
                  </span>
                  <p className="text-slate-305 leading-relaxed font-sans text-xs">
                    {assetType === 'blog_post' && "Optimal: Tuesday Morning (9:00 AM - 11:00 AM). Drives enterprise readers & B2B bookmarking rates."}
                    {assetType === 'social_posts' && "Optimal: Thursday Afternoon (2:00 PM - 5:00 PM). Coordinates with maximum scrolling volume cycles."}
                    {assetType === 'email_sequence' && "Optimal: Wednesday Mid-day (10:00 AM - 12:30 PM). Secures peak email click-through conversions."}
                    {assetType === 'lead_magnet' && "Optimal: Monday Morning (11:30 AM). Catches researchers downloading reference reports early."}
                    {assetType === 'seo_keywords' && "Optimal: Instant rollout. High relevance queries trigger search engine crawler indexing immediately."}
                  </p>
                </div>
              </div>

              <div>
                {!isScheduled ? (
                  <button
                    type="button"
                    id="confirm-schedule-btn"
                    onClick={() => setIsScheduled(true)}
                    className="w-full text-center py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans text-xs rounded transition-all cursor-pointer active:scale-98 shadow-md"
                  >
                    Confirm Campaign schedule
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-start gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">✓ Campaign Timeline Set!</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                        Copy scheduled for publication on <strong className="text-white font-mono">{selectedDate}</strong> at <strong className="text-white font-mono">{selectedTime}</strong>. Optimal post cues loaded.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Social publisher connections panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2 select-none">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  Social Publisher integrations
                </h4>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">Link organic brand channels to enable instant programmatic cross-posting triggers</p>
              </div>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-850 font-mono">
                {connectedSocials.length} Channel{connectedSocials.length === 1 ? '' : 's'} Linked
              </span>
            </div>

            {/* Quick connection buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { name: 'LinkedIn', icon: <Linkedin className="w-4 h-4 text-[#0A66C2]" />, color: 'hover:border-[#0A66C2]/40' },
                { name: 'X (Twitter)', icon: <Twitter className="w-4 h-4 text-white" />, color: 'hover:border-slate-500/40' },
                { name: 'Facebook', icon: <Facebook className="w-4 h-4 text-[#1877F2]" />, color: 'hover:border-[#1877F2]/40' },
                { name: 'Threads', icon: <Link className="w-4 h-4 text-pink-400" />, color: 'hover:border-pink-500/40' },
                { name: 'Direct Web API', icon: <Globe className="w-4 h-4 text-amber-400" />, color: 'hover:border-amber-500/40' }
              ].map((platform) => {
                const isConnected = connectedSocials.includes(platform.name);
                return (
                  <button
                    key={platform.name}
                    type="button"
                    onClick={() => handleTogglePlatform(platform.name)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl gap-2 transition-all cursor-pointer active:scale-95 ${platform.color} group ${
                      isConnected 
                        ? 'bg-slate-950 border-emerald-500/30 text-white' 
                        : 'bg-slate-950/40 border-slate-850 text-slate-450 hover:text-white'
                    }`}
                  >
                    <div className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg group-hover:scale-115 transition-transform">
                      {platform.icon}
                    </div>
                    <span className="text-[10px] text-center font-bold font-sans">{platform.name}</span>
                    <span className={`text-[8px] font-mono leading-none flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                      {isConnected ? 'Connected' : 'Link now'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: version history — refine panel moved full-width below */}
        <div className="xl:col-span-4 space-y-6 min-w-0 w-full">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3.5 gap-2">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                  Version History
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Track, categorize, and compare draft refinements.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="open-global-compare-btn"
                  onClick={() => {
                    if (history && history.length >= 2) {
                      openVersionCompare(0, history.length - 1);
                    }
                  }}
                  disabled={!history || history.length < 2}
                  className={`text-[10px] text-white disabled:opacity-50 border px-2.5 py-1 rounded font-bold cursor-pointer transition-all flex items-center gap-1 disabled:cursor-not-allowed ${
                    isComparePanelOpen
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-705'
                  }`}
                >
                  ⚖️ Compare Versions
                </button>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-850 px-2 py-1 rounded border border-slate-705 self-center">
                  {history?.length || 0} {history?.length === 1 ? 'version' : 'versions'}
                </span>
              </div>
            </div>

            {/* Inline side-by-side version comparison */}
            {isComparePanelOpen && history && history.length >= 2 && (
              <div className="rounded-xl border border-emerald-500/20 bg-slate-950/60 p-4 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                      Version comparison
                    </h5>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                      Pick two historical drafts to see word-level changes side by side.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCompareModalOpen(true)}
                      className="text-[9px] text-slate-300 hover:text-white border border-slate-700 px-2 py-1 rounded cursor-pointer"
                    >
                      Expand fullscreen
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsComparePanelOpen(false)}
                      className="text-[9px] text-slate-500 hover:text-white px-2 py-1 rounded cursor-pointer"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row flex-wrap items-end gap-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1 font-bold">Older / base</span>
                    <select
                      value={compareLeftIdx}
                      onChange={(e) => setCompareLeftIdx(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[260px] font-sans w-full"
                    >
                      {(history || []).map((record, idx) => (
                        <option key={idx} value={idx}>
                          v{idx + 1} · {record.timestamp} · {(record.summary || '').substring(0, 28)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-600 font-mono hidden md:inline pb-2">↔</span>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1 font-bold">Newer / compare</span>
                    <select
                      value={compareRightIdx}
                      onChange={(e) => setCompareRightIdx(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[260px] font-sans w-full"
                    >
                      {(history || []).map((record, idx) => (
                        <option key={idx} value={idx}>
                          v{idx + 1} · {record.timestamp} · {(record.summary || '').substring(0, 28)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded border border-slate-850 text-[11px] ml-auto">
                    <button
                      type="button"
                      onClick={() => setCompareDiffViewMode('side')}
                      className={`px-3 py-1 rounded transition-colors font-semibold cursor-pointer ${
                        compareDiffViewMode === 'side' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Side-by-side
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareDiffViewMode('inline')}
                      className={`px-3 py-1 rounded transition-colors font-semibold cursor-pointer ${
                        compareDiffViewMode === 'inline' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Inline diff
                    </button>
                  </div>
                </div>
                <VersionCompareDiff
                history={history}
                compareLeftIdx={compareLeftIdx}
                compareRightIdx={compareRightIdx}
                compareDiffViewMode={compareDiffViewMode}
              />
              </div>
            )}

            {/* Processing and filtrations */}
            {(() => {
              const checkIsOlderThan30Days = (rec: { timestamp: string; summary: string; createdDateStr?: string }) => {
                if (!rec.createdDateStr) return false;
                const itemDate = new Date(rec.createdDateStr);
                const currentDate = new Date('2026-06-02'); // Consistent platform date
                const diffTime = currentDate.getTime() - itemDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays > 30;
              };

              const processedItems = (history || []).map((item, originalIndex) => {
                const autoArchived = autoArchiveOlderThan30Days && checkIsOlderThan30Days(item);
                const isEffectiveArchived = item.isArchived || autoArchived;
                return {
                  ...item,
                  originalIndex,
                  isEffectiveArchived,
                  isAutoArchived: autoArchived
                };
              });

              const activeCount = processedItems.filter(h => !h.isEffectiveArchived).length;
              const archivedCount = processedItems.filter(h => h.isEffectiveArchived).length;

              const tabFiltered = processedItems.filter(item => {
                if (historyTab === 'active') {
                  return !item.isEffectiveArchived;
                } else {
                  return item.isEffectiveArchived;
                }
              });

              const finalFiltered = tabFiltered.filter(item => {
                if (historyFilterTag !== 'All' && !item.tags?.includes(historyFilterTag)) {
                  return false;
                }
                if (historySearchQuery.trim()) {
                  const query = historySearchQuery.toLowerCase().trim();
                  const summaryMatch = (item.summary || '').toLowerCase().includes(query);
                  const tagsMatch = (item.tags || []).some(t => t.toLowerCase().includes(query));
                  const timestampMatch = (item.timestamp || '').toLowerCase().includes(query);
                  return summaryMatch || tagsMatch || timestampMatch;
                }
                return true;
              });

              return (
                <div className="space-y-4">
                  {/* Real-time Version History Search Bar */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      id="history-search-input"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search by summary, tags, or timestamp..."
                      className="w-full text-xs pl-8.5 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-sans"
                    />
                    {historySearchQuery && (
                      <button
                        type="button"
                        id="clear-history-search-btn"
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white text-xs cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Tabs Selection and Auto Archive Toggle */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/30 p-2 rounded-xl border border-slate-850/60">
                    <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px] select-none">
                      <button
                        type="button"
                        id="tab-select-active-btn"
                        onClick={() => setHistoryTab('active')}
                        className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                          historyTab === 'active' 
                            ? 'bg-amber-600 text-white font-bold' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🎯 Active</span>
                        <span className="text-[9px] px-1 bg-slate-950 rounded font-bold text-slate-300">
                          {activeCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        id="tab-select-archived-btn"
                        onClick={() => setHistoryTab('archived')}
                        className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                          historyTab === 'archived' 
                            ? 'bg-amber-600 text-white font-bold' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>📁 Archived</span>
                        <span className="text-[9px] px-1 bg-slate-950 rounded font-bold text-slate-300">
                          {archivedCount}
                        </span>
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-405 select-none hover:text-white">
                      <input 
                        type="checkbox" 
                        id="toggle-auto-archive"
                        checked={autoArchiveOlderThan30Days} 
                        onChange={(e) => setAutoArchiveOlderThan30Days(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-opacity-25 accent-amber-500"
                      />
                      <span className="font-mono text-[9px] font-bold">Auto-Archive (&gt;30d)</span>
                    </label>
                  </div>

                  {/* Tag Filtering Selector Row */}
                  <div className="flex flex-wrap gap-1 items-center bg-slate-950/45 p-1.5 rounded-lg border border-slate-800/60 text-[10px]">
                    <span className="text-slate-500 font-mono uppercase font-bold mr-1 px-1">Filter Tags:</span>
                    {['All', ...categoryTagsPreset].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setHistoryFilterTag(t)}
                        className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          historyFilterTag === t
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Version List Cards */}
                  {finalFiltered.length === 0 ? (
                    <div className="text-center py-6 text-slate-550 italic text-[11px] bg-slate-950/20 border border-dashed border-slate-850 rounded-lg">
                      No draft versions match current filters.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {finalFiltered.map((record) => {
                        const isActive = record.asset.content === asset.content && record.asset.title === asset.title;
                        const recordTags = record.tags || [];
                        const oldMark = checkIsOlderThan30Days(record);

                        // Tag color mappings for highly visible categorical layout tags
                        const getTagBadgeClass = (tagStr: string) => {
                          switch (tagStr) {
                            case 'Final': return 'bg-emerald-950 text-emerald-400 border border-emerald-500/20';
                            case 'Approved': return 'bg-cyan-950 text-cyan-400 border border-cyan-500/20';
                            case 'Under Review': return 'bg-amber-950 text-amber-400 border border-amber-500/20';
                            case 'Draft': return 'bg-blue-950 text-blue-400 border border-blue-500/20';
                            case 'Test': return 'bg-sky-950 text-sky-400 border border-sky-500/20';
                            default: return 'bg-slate-850 text-slate-355 border border-slate-700/20';
                          }
                        };

                        return (
                          <div 
                            key={record.originalIndex} 
                            id={`history-card-${record.originalIndex}`}
                            className={`p-3 rounded-lg border text-xs transition-all space-y-2 relative ${
                              isActive 
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-white' 
                                : 'bg-slate-950/50 border-slate-850 text-slate-300 hover:bg-slate-900/40 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex flex-col gap-1.5">
                              {/* Top row: Timestamp label and state controls */}
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="space-y-1">
                                  <span className="font-mono text-[10px] font-bold text-slate-405 flex items-center gap-1">
                                    ⏱️ {record.timestamp} 
                                    {oldMark && (
                                      <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1 rounded border border-amber-500/20 font-bold self-center">
                                        &gt;30d Old
                                      </span>
                                    )}
                                  </span>

                                  {/* Interactive custom simulated creation date calendar text input */}
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[9px] text-slate-500 font-mono">Date:</span>
                                    <input 
                                      type="date"
                                      value={record.createdDateStr || '2026-06-02'}
                                      onChange={(e) => onUpdateHistoryCreatedDate?.(record.originalIndex, e.target.value)}
                                      className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[9px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    {!oldMark && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateHistoryCreatedDate?.(record.originalIndex, '2026-04-20')}
                                        className="text-[9px] text-amber-500 hover:text-amber-400 hover:underline font-semibold"
                                        title="Simulate 35 days in the past"
                                      >
                                        (Simulate &gt;30d Old)
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 select-none">
                                  {/* Compare with Active button */}
                                  <button
                                    type="button"
                                    id={`compare-with-active-btn-${record.originalIndex}`}
                                    onClick={() => {
                                      const activeIdx = processedItems.find(h => h.asset.content === asset.content)?.originalIndex ?? 0;
                                      openVersionCompare(record.originalIndex, activeIdx);
                                    }}
                                    className="text-[9px] text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                    title="Compare modifications in side-by-side or inline word diff"
                                  >
                                    ⚖️ Diff
                                  </button>

                                  <button
                                    type="button"
                                    id={`edit-history-summary-btn-${record.originalIndex}`}
                                    onClick={() => {
                                      setEditingHistoryIdx(record.originalIndex);
                                      setEditingSummaryText(record.summary || "Draft formulation version");
                                    }}
                                    className="text-[9px] text-slate-400 hover:text-white px-1 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-slate-905 transition-colors cursor-pointer"
                                    title="Edit summary description"
                                  >
                                    ✏️ Edit
                                  </button>

                                  {isActive ? (
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase select-none font-sans">
                                      Active
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      id={`revert-version-btn-${record.originalIndex}`}
                                      onClick={() => onRevertAsset(record.asset)}
                                      className="text-[9.5px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                    >
                                      Revert
                                    </button>
                                  )}

                                  {/* Archive / Restore Button */}
                                  {record.isEffectiveArchived ? (
                                    <button
                                      type="button"
                                      id={`restore-archive-btn-${record.originalIndex}`}
                                      onClick={() => {
                                        onUpdateHistoryArchived?.(record.originalIndex, false);
                                        if (oldMark) {
                                          onUpdateHistoryCreatedDate?.(record.originalIndex, '2026-06-02');
                                        }
                                      }}
                                      className="text-[9px] text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                                      title="Restore to Active panel view"
                                    >
                                      ↩️ Restore
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      id={`manual-archive-btn-${record.originalIndex}`}
                                      onClick={() => onUpdateHistoryArchived?.(record.originalIndex, true)}
                                      className="text-[9px] text-slate-450 hover:text-slate-200 border border-slate-800 bg-slate-900 hover:bg-slate-850 px-1.5 py-0.5 rounded transition-colors cursor-pointer font-sans"
                                      title="Archive this version"
                                    >
                                      📁 Archive
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Info text section */}
                            {editingHistoryIdx === record.originalIndex ? (
                              <div className="mt-1 space-y-1.5">
                                <textarea
                                  id={`edit-summary-input-${record.originalIndex}`}
                                  value={editingSummaryText}
                                  onChange={(e) => setEditingSummaryText(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingHistoryIdx(null)}
                                    className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    id={`save-summary-btn-${record.originalIndex}`}
                                    onClick={() => {
                                      onUpdateHistorySummary?.(record.originalIndex, editingSummaryText);
                                      setEditingHistoryIdx(null);
                                    }}
                                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded cursor-pointer transition-all active:scale-95"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300 font-sans leading-relaxed break-words font-medium">
                                {record.summary || "Draft formulation version"}
                              </p>
                            )}

                            {/* Category tags pill visualization row */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-950">
                              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold">Tags:</span>
                              {recordTags.map((t, tIdx) => (
                                <div key={tIdx} className="inline-flex items-center gap-1 bg-slate-950/40 pl-1.5 pr-1 py-0.5 rounded border border-slate-850/60 shadow-sm">
                                  <span 
                                    className={`px-1.5 py-0.2 text-[9px] rounded font-semibold ${getTagBadgeClass(t)}`}
                                  >
                                    {t}
                                  </span>
                                  <button
                                    type="button"
                                    id={`quick-revert-tag-${record.originalIndex}-${tIdx}`}
                                    onClick={() => onRevertAsset(record.asset)}
                                    className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 shadow-inner active:scale-90 ml-0.5 hover:scale-110"
                                    title={`Quick Restore Version from [${t}]`}
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Toggle tags editor popup button */}
                              <button
                                type="button"
                                id={`edit-tags-trigger-btn-${record.originalIndex}`}
                                onClick={() => setTagEditorIdx(tagEditorIdx === record.originalIndex ? null : record.originalIndex)}
                                className="text-[9px] text-slate-400 hover:text-emerald-400 px-1 rounded border border-dashed border-slate-750 hover:border-emerald-500/40 bg-slate-900/50 flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                🏷️ {recordTags.length > 0 ? 'Edit' : '+ Tag'}
                              </button>
                            </div>

                            {/* Popup editor to checkbox select tag presets */}
                            {tagEditorIdx === record.originalIndex && (
                              <div className="mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 animate-fade-in z-20 relative">
                                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Toggle Tags:</span>
                                <div className="flex flex-wrap gap-1">
                                  {categoryTagsPreset.map(presetTag => {
                                    const isSelected = recordTags.includes(presetTag);
                                    return (
                                      <button
                                        key={presetTag}
                                        type="button"
                                        id={`tag-toggle-btn-${record.originalIndex}-${presetTag}`}
                                        onClick={() => {
                                          const nextTags = isSelected 
                                            ? recordTags.filter(item => item !== presetTag)
                                            : [...recordTags, presetTag];
                                          onUpdateHistoryTags?.(record.originalIndex, nextTags);
                                        }}
                                        className={`px-2 py-0.5 text-[9px] rounded border transition-all cursor-pointer font-sans font-medium ${
                                          isSelected
                                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                                            : 'bg-slate-900 border-slate-800 text-slate-405 hover:text-white'
                                        }`}
                                      >
                                        {isSelected ? '✓ ' : ''}{presetTag}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button 
                                    type="button"
                                    onClick={() => setTagEditorIdx(null)}
                                    className="text-[9px] font-semibold text-slate-400 hover:text-white"
                                  >
                                    Close Editor
                                  </button>
                                </div>
                              </div>
                            )}

                            {record.toneIntensity !== undefined && (
                              <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                                <span>Tone Intensity Setting:</span>
                                <span className="text-emerald-450 font-bold">{record.toneIntensity}/10</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <RefinePanel
        chatHistory={chatHistory}
        isRefining={isRefining}
        toneIntensity={toneIntensity}
        setToneIntensity={setToneIntensity}
        feedbackInput={feedbackInput}
        setFeedbackInput={setFeedbackInput}
        submitFeedback={submitFeedback}
        applyQuickPolish={applyQuickPolish}
        tonePresets={tonePresets}
        quickPolishPresets={quickPolishPresets}
        quickPills={quickPills}
        expandToken={refineExpandToken}
        seoSnapshot={{
          title: asset.title,
          summary: asset.summary,
          seoInstructions: asset.seoInstructions,
          taglineOrCTA: asset.taglineOrCTA,
          wordCount: editorWordCount,
        }}
      />

      {/* 30-Day strategic numbered "Next Step Options" matching target guidelines exactly! */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6 space-y-4">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-amber-500 animate-pulse" />
            Next Step Campaign Decisions (User Approved Only)
          </h4>
          <p className="text-xs text-slate-405">Pick any of our recommended next steps based on standard sequence patterns. We execute nothing without your selection.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {nextOptions?.map((opt) => {
            const isDashboard = opt.actionType === 'dashboard';
            return (
              <button
                key={opt.index}
                id={`next-step-option-${opt.index}`}
                onClick={() => {
                  if (isDashboard) {
                    onBackToDashboard();
                  } else {
                    onNextStepSelect(opt.actionType as MarketingAssetType);
                  }
                }}
                className="text-left p-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800 bg-slate-950 transition-all cursor-pointer shadow-md relative group"
              >
                <div className="absolute top-3 right-3 text-sm font-mono font-bold text-slate-600 group-hover:text-amber-400 transition-colors">
                  #{opt.index}
                </div>
                <div className="flex items-start gap-2.5 pr-6">
                  <div className="p-1 rounded bg-slate-900 text-emerald-400 border border-slate-800 shrink-0 mt-0.5 text-xs font-bold font-mono">
                    {opt.index}
                  </div>
                  <div>
                    <span className="text-xs font-sans font-bold text-white block leading-snug group-hover:text-emerald-300 transition-colors mb-1">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tight flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3 text-slate-600" />
                      {isDashboard ? 'Return to Main Assessment' : `Generate ${opt.actionType || 'next file'}`}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <VersionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        history={history}
        compareLeftIdx={compareLeftIdx}
        compareRightIdx={compareRightIdx}
        compareDiffViewMode={compareDiffViewMode}
        setCompareLeftIdx={setCompareLeftIdx}
        setCompareRightIdx={setCompareRightIdx}
        setCompareDiffViewMode={setCompareDiffViewMode}
        onRevertAsset={onRevertAsset}
      />

      {showSocialModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>🔗</span>
                Link {selectedSocialPlatform} Account
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSocialModal(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded transition-colors text-xs cursor-pointer font-bold border border-slate-805"
              >
                ✕ Close
              </button>
            </div>

            {/* Simulated OAuth Flow Form Details */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">OAuth 2.0 Secure Channel binding</span>
                  <span className="text-[10px] text-slate-500 font-mono">Provided by secure AI Studio Sandbox IDP</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Profile handle / Channel Name Name</label>
                  <input 
                    type="text" 
                    placeholder={`e.g. @${companyInfo.brandName?.toLowerCase().replace(/\s+/g, '') || 'brand'}_corp`}
                    className="w-full text-xs bg-slate-950 text-white border border-slate-800 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 block mb-1 uppercase">Direct API Scope Grants permissions</label>
                  <div className="bg-slate-950/60 p-3 border border-slate-850 rounded-lg text-[10.5px] text-slate-305 space-y-2 leading-relaxed font-sans">
                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-500 text-xs font-mono">✓</span>
                      <span>Manage brand campaign feeds & direct publication drafts</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-500 text-xs font-mono">✓</span>
                      <span>Publish organic copy scheduled drafts automatically</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-500 text-xs font-mono">✓</span>
                      <span>Fetch aggregated engagement metrics for CMO assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowSocialModal(false)}
                className="text-slate-400 hover:text-white px-4 py-2 rounded text-xs hover:bg-slate-800 transition-all font-semibold"
              >
                Cancel Permission
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSocialConnect}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Authorize & Connect Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Editor Integration Overlay Modal */}
      {isAiEditorOverlayOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                    🤖 CROSS-FRAMEWORK PILOT
                  </span>
                  <h4 className="text-sm font-display font-black text-white uppercase mt-0.5">
                    AI Editor Integration Overlay
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiEditorOverlayOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition text-xs font-sans font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-left flex-1 select-none">
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Choose your external IDE or AI content editor below to retrieve a prompt preloaded with a live snapshot of your current campaign deliverable:
              </p>

              {/* IDE Tabs */}
              <div className="flex border-b border-slate-850 overflow-x-auto gap-1">
                {[
                  { id: 'cursor', label: '💻 Cursor & IDEs' },
                  { id: 'grok', label: '🐦 Grok 3 (X.com)' },
                  { id: 'claude', label: '🎭 Anthropic Claude' },
                  { id: 'chatgpt', label: '🧠 OpenAI ChatGPT' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCopilotTab(tab.id as any);
                      setCopiedPromptId(null);
                    }}
                    className={`px-3.5 py-2.5 border-b-2 text-[11px] font-sans font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
                      activeCopilotTab === tab.id
                        ? 'border-amber-500 text-amber-500 font-extrabold bg-slate-950/65'
                        : 'border-transparent text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Prompt Text Box */}
              <div className="space-y-2">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative font-mono text-xs select-all text-slate-300 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap shadow-inner border-l-4 border-l-amber-500">
                  {/* Fetch prompt code based on tab selection */}
                  {activeCopilotTab === 'cursor' && (
`[System Instruction: You are an elite front-end developer inside a workspace IDE]
Please refactor this marketing copywriting content into a highly visual React component with a responsive reading time tracker hook:

"""
${localAssetContent}
"""

Provide only the complete, typed TSX code without generic explanations.`
                  )}

                  {activeCopilotTab === 'grok' && (
`[System Instruction: You are Grok 3, highly witty, technical, and analytical]
Review this copywriting draft for enterprise tech relevance. Optimize the hooks to speak to senior executives, and convert any list format points into highly technical data metrics and tables:

"""
${localAssetContent}
"""

Inject factual industry projections and tighten the concluding call-to-action hook.`
                  )}

                  {activeCopilotTab === 'claude' && (
`[System Instruction: You are Claude 3.5 Sonnet, structured and highly articulate]
I need to convert the following marketing deliverable into a beautifully structured executive newsletter brief with clear action items and an impact-assessment table:

"""
${localAssetContent}
"""

Maintain an authoritative, elegant tone throughout.`
                  )}

                  {activeCopilotTab === 'chatgpt' && (
`[System Instruction: You are ChatGPT, a conversion copywriting expert]
Convert this campaign asset into a 5-day email launch drip marketing campaign. Each message segment should highlight a different pain point from the text below:

"""
${localAssetContent}
"""

Include personalized subject line options, preview text, and direct booking links.`
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-950 p-6 border-t border-slate-850 flex items-center justify-between select-none">
              <span className="text-[10px] text-slate-500 font-mono">
                *Active snapshot: {localAssetContent.length} chars
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiEditorOverlayOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-sans text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close Overlay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let targetText = '';
                    if (activeCopilotTab === 'cursor') {
                      targetText = `[System Instruction: You are an elite front-end developer inside a workspace IDE]\nPlease refactor this marketing copywriting content into a highly visual React component with a responsive reading time tracker hook:\n\n"""\n${localAssetContent}\n"""\n\nProvide only the complete, typed TSX code without generic explanations.`;
                    } else if (activeCopilotTab === 'grok') {
                      targetText = `[System Instruction: You are Grok 3, highly witty, technical, and analytical]\nReview this copywriting draft for enterprise tech relevance. Optimize the hooks to speak to senior executives, and convert any list format points into highly technical data metrics and tables:\n\n"""\n${localAssetContent}\n"""\n\nInject factual industry projections and tighten the concluding call-to-action hook.`;
                    } else if (activeCopilotTab === 'claude') {
                      targetText = `[System Instruction: You are Claude 3.5 Sonnet, structured and highly articulate]\nI need to convert the following marketing deliverable into a beautifully structured executive newsletter brief with clear action items and an impact-assessment table:\n\n"""\n${localAssetContent}\n"""\n\nMaintain an authoritative, elegant tone throughout.`;
                    } else {
                      targetText = `[System Instruction: You are ChatGPT, a conversion copywriting expert]\nConvert this campaign asset into a 5-day email launch drip marketing campaign. Each message segment should highlight a different pain point from the text below:\n\n"""\n${localAssetContent}\n"""\n\nInclude personalized subject line options, preview text, and direct booking links.`;
                    }
                    navigator.clipboard.writeText(targetText);
                    setCopiedPromptId(activeCopilotTab);
                    setTimeout(() => setCopiedPromptId(null), 2000);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-sans text-xs rounded-xl shadow transition duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {copiedPromptId === activeCopilotTab ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>Copied Fully Formatted!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CopywriterSidebar
        isOpen={isCopywriterOpen}
        onClose={() => setIsCopywriterOpen(false)}
        assetTitle={asset.title || 'Marketing asset'}
        currentContent={localAssetContent}
        isRefining={isRefining}
        onRefine={onRefineAsset}
        computeWordDiff={computeWordDiff}
      />
      <ScrollToTopButton />
    </div>
  );
}
