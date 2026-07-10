/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorTheme {
  primary: string;
  accent: string;
  bgStyle: string;
}

export interface AudienceSegment {
  segmentName: string;
  persona: string;
  painPoints: string[];
  leveragePoints: string[];
}

export interface WeeklyPlanItem {
  week: string;
  focus: string;
  tasks: string[];
  expectedOutcome: string;
}

export interface ChannelRecommendation {
  channel: string;
  priority: string; // "High" | "Medium" | "Low"
  strategy: string;
}

export interface WebsiteAnalysis {
  brandName: string;
  tagline: string;
  inferredBrandVoice: string;
  inferredGrowthGoal?: string;
  colors: ColorTheme;
  strategicSummary: string;
  targetAudience: AudienceSegment[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  positioningText: string;
  thirtyDayActionPlan: WeeklyPlanItem[];
  recommendedChannels: ChannelRecommendation[];
}

export type MarketingAssetType = 'seo_keywords' | 'blog_post' | 'social_posts' | 'email_sequence' | 'lead_magnet';

export interface GeneratedAsset {
  title: string;
  summary: string;
  content: string;
  taglineOrCTA: string;
  seoInstructions: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export type CopywriterPersonaId =
  | 'conversion_specialist'
  | 'saas_growth'
  | 'seo_guru'
  | 'brand_storyteller';

export interface CopywriterPersona {
  id: CopywriterPersonaId;
  name: string;
  title: string;
  accentColor: string;
  systemPrompt: string;
  greeting: string;
}

export interface EmailDraft {
  id: string;
  label: string;
  subject: string;
  previewText: string;
  body: string;
  cta: string;
}

export interface AssetHistoryEntry {
  timestamp: string;
  summary: string;
  asset: GeneratedAsset;
  toneIntensity?: number;
  tags?: string[];
  isArchived?: boolean;
  createdDateStr?: string;
  approvalStatus?: ApprovalStatus;
  assignee?: string;
  comments?: ApprovalComment[];
}

export type ApprovalStatus = 'draft' | 'in_review' | 'approved' | 'published';

export interface ApprovalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type CampaignTimelineEventType = 'generated' | 'refined' | 'reverted' | 'saved';

export interface CampaignTimelineEvent {
  id: string;
  assetType: MarketingAssetType;
  eventType: CampaignTimelineEventType;
  timestamp: string;
  sortKey: number;
  summary: string;
  title: string;
  wordCount: number;
  toneIntensity?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface CampaignImageExportMeta {
  assetType: MarketingAssetType;
  label: string;
  url: string;
  artisticTheme: string;
  prompt: string;
}

export type SeoIssueSeverity = 'critical' | 'warning' | 'info';

export interface TechnicalSeoIssue {
  severity: SeoIssueSeverity;
  code: string;
  message: string;
  fix: string;
}

export interface CrawledPageSummary {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1: string[];
  wordCount: number;
  depth?: number;
  modules?: PageModuleSummary[];
  issues: TechnicalSeoIssue[];
  loadError?: string;
}

export interface PageModuleSummary {
  id: string;
  label: string;
  wordCount: number;
  linkCount: number;
  hasHeading: boolean;
}

export interface LinkGraphNode {
  url: string;
  depth: number;
  internalLinks: number;
}

export interface LinkGraphEdge {
  from: string;
  to: string;
}

export interface SiteCrawlResult {
  baseUrl: string;
  crawledAt: string;
  crawlMode?: 'quick' | 'deep';
  pagesCrawled: number;
  pagesDiscovered?: number;
  pages: CrawledPageSummary[];
  siteWideIssues: TechnicalSeoIssue[];
  linkGraph?: {
    nodes: LinkGraphNode[];
    edges: LinkGraphEdge[];
    orphanPages: string[];
  };
  crawlLimits?: {
    mode: 'quick' | 'deep';
    maxPages: number;
    deepCrawlPagesUsed?: number;
    deepCrawlPagesLimit?: number;
  };
}

export interface SeoKeywordGap {
  keyword: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  difficulty: 'low' | 'medium' | 'high';
  opportunityScore: number;
  currentRanking: string;
  recommendedAction: string;
  targetPage: string;
}

export interface MetaTagRewrite {
  url: string;
  currentTitle: string;
  suggestedTitle: string;
  currentMetaDescription: string;
  suggestedMetaDescription: string;
  rationale: string;
}

export interface SeoOptimizationTask {
  phase: number;
  title: string;
  tasks: string[];
  impact: 'high' | 'medium' | 'low';
  estimatedLiftPercent: number;
}

export interface SeoAgentAuditResult {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  keywordScore: number;
  executiveSummary: string;
  keywordGaps: SeoKeywordGap[];
  priorityKeywords: { keyword: string; volumeTier: string; rationale: string }[];
  metaTagRewrites: MetaTagRewrite[];
  optimizationRoadmap: SeoOptimizationTask[];
  contentPlan: { topic: string; format: string; targetKeyword: string; priority: string }[];
  integratedInsights?: string;
  keywordClusters?: KeywordCluster[];
  competitorComparison?: CompetitorComparison | null;
}

export interface KeywordCluster {
  name: string;
  keywords: string[];
  intent: string;
  contentBrief: string;
  suggestedAssetType?: MarketingAssetType;
}

export interface CompetitorComparison {
  competitorUrl: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  keywordOverlap: string[];
  opportunities: string[];
}

export interface SeoScoreSnapshot {
  date: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  keywordScore: number;
  runId?: string;
  label?: string;
}

export interface PublishEvent {
  id: string;
  assetType: MarketingAssetType;
  title: string;
  url?: string;
  publishedAt: string;
  platform: 'wordpress' | 'manual';
}

export interface PageUplift {
  url: string;
  title?: string;
  baselineClicks: number;
  currentClicks: number;
  baselinePosition: number;
  currentPosition: number;
  baselineSessions?: number;
  currentSessions?: number;
}

export type CalendarTaskStatus = 'pending' | 'in_progress' | 'done';

export interface CalendarTask {
  id: string;
  weekLabel: string;
  focus: string;
  title: string;
  expectedOutcome?: string;
  scheduledDate: string;
  dayIndex: number;
  status: CalendarTaskStatus;
  linkedAssetType?: MarketingAssetType;
}

export interface BrandKit {
  voiceRules: string;
  bannedPhrases: string[];
  boilerplateCta: string;
  legalFooter: string;
  logoColors: { primary: string; accent: string; secondary?: string };
}

export interface NotificationPreferences {
  slackWebhookUrl?: string;
  email?: string;
  onAuditComplete: boolean;
  onScoreDrop: boolean;
  weeklyDigest: boolean;
}

export interface AppNotification {
  id: string;
  type: 'audit_complete' | 'score_drop' | 'weekly_digest' | 'info';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface SeoStackIntegrations {
  googleSearchConsole: {
    connected: boolean;
    propertyUrl?: string;
    topQueries?: { query: string; clicks: number; impressions: number; position: number }[];
  };
  ga4: {
    connected: boolean;
    propertyId?: string;
    topPages?: { path: string; sessions: number; bounceRate?: number }[];
  };
  keywordTool: {
    connected: boolean;
    provider?: string;
    seedKeywords?: string[];
  };
}

/** Saved brand + SEO workspace snapshot */
export interface CampaignRun {
  id: string;
  label: string;
  brandUrl: string;
  createdAt: string;
  updatedAt: string;
  growthGoal: string;
  brandVoice: string;
  customChallenge: string;
  brandAnalysis: WebsiteAnalysis;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>;
  seoCrawl?: SiteCrawlResult | null;
  seoAudit?: SeoAgentAuditResult | null;
  seoScoreHistory?: SeoScoreSnapshot[];
}
