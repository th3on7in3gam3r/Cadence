/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MarketingFooter from '../components/MarketingFooter';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_SEO } from '../lib/pageSeo';
import { PRODUCT_NAME } from '../lib/brand';

interface LegalPageProps {
  title: string;
  seoPath: keyof typeof PAGE_SEO;
  children: React.ReactNode;
}

export function LegalLayout({ title, seoPath, children }: LegalPageProps) {
  usePageMeta(PAGE_SEO[seoPath]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <a href="#legal-main" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-lg text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-display font-bold text-white">{title}</h1>
        </div>
      </header>
      <main id="legal-main" className="max-w-3xl mx-auto px-4 py-10 prose-legal space-y-6 text-sm leading-relaxed text-slate-300">
        {children}
        <p className="text-xs text-slate-500 pt-8 border-t border-slate-800">
          Last updated: June 2026 · Questions? Contact your workspace administrator.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" seoPath="/privacy">
      <p>
        {PRODUCT_NAME} (&quot;we&quot;, &quot;the service&quot;) processes website URLs, marketing content you generate,
        and optional integration data (Google Search Console, GA4, WordPress) to provide strategy and SEO tools.
      </p>
      <h2 className="text-base font-bold text-white pt-4">What we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account email when you sign in (Supabase auth)</li>
        <li>Workspace data: brand analysis, generated assets, SEO audits</li>
        <li>OAuth tokens for integrations you connect (stored encrypted server-side)</li>
        <li>Usage metrics: feature usage counts, API errors (no content in logs)</li>
      </ul>
      <h2 className="text-base font-bold text-white pt-4">How we use it</h2>
      <p>
        To run AI analysis, sync your workspace across devices, pull live SEO metrics, and publish content
        to CMS platforms you authorize. We do not sell your data.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Third parties</h2>
      <p>
        Google (Gemini API, OAuth), Supabase (auth & database), and CMS providers you connect.
        Each has their own privacy policy.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Your rights</h2>
      <p>
        Export your campaign ZIP, delete saved runs, disconnect integrations, or delete your account
        via Supabase. Contact us for data export requests.
      </p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" seoPath="/terms">
      <p>
        By using {PRODUCT_NAME} you agree to these terms. The service is provided &quot;as is&quot; for marketing
        and SEO assistance. You are responsible for reviewing all AI-generated content before publishing.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Acceptable use</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Do not use the service for spam, illegal content, or scraping without permission</li>
        <li>Comply with Google API and OAuth terms when connecting Search Console or Analytics</li>
        <li>Maintain your own API keys and secrets securely in self-hosted deployments</li>
      </ul>
      <h2 className="text-base font-bold text-white pt-4">AI output</h2>
      <p>
        Generated copy and SEO recommendations are suggestions, not legal or professional advice.
        You retain ownership of content you create; you grant us a license to process it to provide the service.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Limitation of liability</h2>
      <p>
        We are not liable for ranking changes, publishing errors, or business outcomes from use of the product.
      </p>
    </LegalLayout>
  );
}

export function SecurityPage() {
  return (
    <LegalLayout title="Security" seoPath="/security">
      <p>
        We design {PRODUCT_NAME} for professional teams connecting OAuth integrations and storing marketing assets.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Infrastructure</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>HTTPS required in production; API routes protected by bearer tokens or Supabase JWT</li>
        <li>Rate limiting on AI endpoints (default 40 requests / 15 min per IP)</li>
        <li>Row-level security on Supabase tables; integration tokens via service role only</li>
      </ul>
      <h2 className="text-base font-bold text-white pt-4">Secrets</h2>
      <p>
        Never commit <code className="bg-slate-800 px-1 rounded">.env.local</code>. Gemini and OAuth secrets
        stay server-side in hosted mode. Rotate <code className="bg-slate-800 px-1 rounded">CMO_API_TOKEN</code> if exposed.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Reporting</h2>
      <p>
        Report vulnerabilities to your workspace administrator. We aim to acknowledge reports within 5 business days.
      </p>
    </LegalLayout>
  );
}

export function DataRetentionPage() {
  return (
    <LegalLayout title="Data Retention" seoPath="/data-retention">
      <h2 className="text-base font-bold text-white">Workspace data</h2>
      <p>
        Active workspaces persist until you delete them or your account is removed. Cloud sync stores
        a JSON payload per user in Postgres.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Campaign runs</h2>
      <p>Up to 25 saved runs per workspace (local or cloud). Older runs are pruned on new saves.</p>
      <h2 className="text-base font-bold text-white pt-4">Integration tokens</h2>
      <p>
        OAuth tokens remain until you disconnect in Settings. Disconnecting removes tokens and stops live data pulls.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Logs & metrics</h2>
      <p>
        Structured server logs retain request metadata (path, status, duration) for ~30 days.
        Error tracking may retain stack traces for 90 days when Sentry is enabled.
      </p>
      <h2 className="text-base font-bold text-white pt-4">Local-only mode</h2>
      <p>
        Data in browser localStorage persists until you clear site data or use Reset workspace in Settings.
      </p>
    </LegalLayout>
  );
}
