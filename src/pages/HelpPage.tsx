/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Map,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PRODUCT_NAME } from '../lib/brand';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_SEO } from '../lib/pageSeo';
import {
  HELP_SECTIONS,
  isHelpSectionId,
  type HelpSectionId,
} from '../lib/helpSections';

interface HelpPageProps {
  variant?: 'app' | 'public';
  onBack?: () => void;
}

function HelpProse({ children }: { children: React.ReactNode }) {
  return <div className="prose-legal space-y-4 text-sm leading-relaxed text-slate-300">{children}</div>;
}

function SectionOverview() {
  return (
    <HelpProse>
      <p>
        Plain-English help for {PRODUCT_NAME} — strategy, SEO, content, and publishing. Pick a topic on the left
        (or below on mobile).
      </p>
      <h2 className="text-base font-bold text-white pt-2">Quick answers</h2>
      <div className="space-y-3 not-prose">
        {[
          {
            q: 'I just want to publish a blog post.',
            a: 'Open How to post → Method A (copy/paste) works on every plan.',
            section: 'post' as HelpSectionId,
          },
          {
            q: 'Where do saved audits live?',
            a: 'Campaign History in the top nav — not the brand dropdown.',
            section: 'map' as HelpSectionId,
          },
          {
            q: 'How do I switch client sites?',
            a: 'Top-right brand dropdown (building icon). Each URL is its own workspace.',
            section: 'map' as HelpSectionId,
          },
          {
            q: 'Newsletter signup on my blog?',
            a: 'Settings → General → Kit URL, then export a blog post (not SEO playbook).',
            section: 'post' as HelpSectionId,
          },
        ].map((item) => (
          <button
            key={item.q}
            type="button"
            className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer"
            data-section={item.section}
          >
            <p className="text-xs font-bold text-white">{item.q}</p>
            <p className="text-xs text-slate-400 mt-1">{item.a}</p>
          </button>
        ))}
      </div>
    </HelpProse>
  );
}

function SectionStart() {
  return (
    <HelpProse>
      <h2 className="text-base font-bold text-white">The 3-step workflow</h2>
      <ol className="list-decimal pl-5 space-y-3">
        <li>
          <strong className="text-white">Run your first audit</strong> — paste your site URL, choose goals, wait for the
          dashboard.
        </li>
        <li>
          <strong className="text-white">Fix SEO (recommended)</strong> — open SEO Agent, run a crawl, review technical
          issues, meta tags, and the content plan.
        </li>
        <li>
          <strong className="text-white">Create content</strong> — on the dashboard, generate keywords, a blog post,
          social posts, emails, or a lead magnet.
        </li>
      </ol>
      <h2 className="text-base font-bold text-white pt-4">After you generate something</h2>
      <p>Campaign Studio lets you edit, refine with AI, generate hero images, copy WordPress HTML, or publish directly.</p>
      <h2 className="text-base font-bold text-white pt-4">New audit vs new brand site</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong className="text-white">+ New audit</strong> — re-analyze a URL; saves to Campaign History.
        </li>
        <li>
          <strong className="text-white">Add brand site</strong> — new client workspace in the brand dropdown.
        </li>
      </ul>
    </HelpProse>
  );
}

function SectionPost() {
  return (
    <HelpProse>
      <p className="text-emerald-400/90 font-medium">
        Most common question: how do I get a blog from Cadence onto WordPress?
      </p>

      <h2 className="text-base font-bold text-white pt-2">Method A — Copy &amp; paste (all plans)</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Dashboard → <strong className="text-white">Blog post</strong> → Generate.</li>
        <li>Edit in Campaign Studio. Optional: <strong className="text-white">Generate image</strong> → Download.</li>
        <li>Click <strong className="text-white">Copy WordPress HTML</strong> (hero image downloads too).</li>
        <li>WordPress → Posts → Add New → <strong className="text-white">Code editor</strong> → paste.</li>
        <li>Upload hero to Media Library → set <strong className="text-white">Featured image</strong> in the sidebar.</li>
        <li>Copy meta description / slug from the SEO reference block (if included) into Yoast or Rank Math.</li>
        <li>Remove helper blocks you don&apos;t want visible → Publish.</li>
      </ol>

      <h2 className="text-base font-bold text-white pt-4">Method B — Direct publish (cloud)</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Settings → Integrations → connect WordPress (application password).</li>
        <li>In Campaign Studio, set approval to <strong className="text-white">Approved</strong>.</li>
        <li>Click <strong className="text-white">Save draft</strong> or <strong className="text-white">Publish</strong>.</li>
      </ol>

      <h2 className="text-base font-bold text-white pt-4">Subscribe button</h2>
      <p>
        Only <strong className="text-white">blog post</strong> exports include Subscribe. Add your Kit URL in Settings →
        General first.
      </p>

      <h2 className="text-base font-bold text-white pt-4">Other content types</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Social → copy into Kerygma or your scheduler</li>
        <li>Email → copy into Kit / Mailchimp</li>
        <li>Keywords → use while writing; not a WordPress export</li>
      </ul>

      <h2 className="text-base font-bold text-white pt-4">Before you publish checklist</h2>
      <ul className="list-disc pl-5 space-y-1 text-slate-400">
        <li>Proofread in Campaign Studio</li>
        <li>Featured image set in WordPress</li>
        <li>Meta description filled in</li>
        <li>Mobile preview looks good</li>
      </ul>
    </HelpProse>
  );
}

function SectionMap() {
  return (
    <HelpProse>
      <h2 className="text-base font-bold text-white">Top navigation</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong className="text-white">+ New audit</strong> — fresh URL analysis</li>
        <li><strong className="text-white">Brand dropdown</strong> — switch client sites</li>
        <li><strong className="text-white">Campaign History</strong> — saved audit runs</li>
        <li><strong className="text-white">SEO Agent</strong> — crawl, meta tags, content plan</li>
        <li><strong className="text-white">Settings</strong> — Kit URL, WordPress, billing, team</li>
      </ul>

      <h2 className="text-base font-bold text-white pt-4">Often confused</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-xs border border-slate-800 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-900 text-slate-400">
              <th className="text-left p-2 border-b border-slate-800"> </th>
              <th className="text-left p-2 border-b border-slate-800">Brand dropdown</th>
              <th className="text-left p-2 border-b border-slate-800">Campaign History</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="p-2 border-b border-slate-800 font-medium">Purpose</td>
              <td className="p-2 border-b border-slate-800">Switch client sites</td>
              <td className="p-2 border-b border-slate-800">Browse saved audits</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pt-2">
        <strong className="text-white">Content plan</strong> (SEO Agent) = topic ideas.{' '}
        <strong className="text-white">Blog post</strong> (Dashboard) = full article to publish.
      </p>

      <h2 className="text-base font-bold text-white pt-4">Typical week</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Dashboard — check strategy</li>
        <li>SEO Agent — refresh audit</li>
        <li>Pick a topic from Content plan</li>
        <li>Generate blog → Copy WordPress HTML → publish</li>
        <li>Kerygma (optional) — social distribution</li>
      </ol>
    </HelpProse>
  );
}

const SECTION_CONTENT: Record<HelpSectionId, React.FC> = {
  overview: SectionOverview,
  start: SectionStart,
  post: SectionPost,
  map: SectionMap,
};

const SECTION_ICONS: Record<HelpSectionId, React.ReactNode> = {
  overview: <BookOpen className="w-4 h-4" />,
  start: <Sparkles className="w-4 h-4" />,
  post: <FileText className="w-4 h-4" />,
  map: <Map className="w-4 h-4" />,
};

export default function HelpPage({ variant = 'app', onBack }: HelpPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  usePageMeta(variant === 'public' ? PAGE_SEO['/help'] : null);

  const paramSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<HelpSectionId>(
    isHelpSectionId(paramSection) ? paramSection : 'overview',
  );

  useEffect(() => {
    if (isHelpSectionId(paramSection)) setActiveSection(paramSection);
  }, [paramSection]);

  const selectSection = (id: HelpSectionId) => {
    setActiveSection(id);
    setSearchParams({ section: id }, { replace: true });
  };

  useEffect(() => {
    const onOverviewClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-section]');
      if (!target) return;
      const section = target.getAttribute('data-section');
      if (isHelpSectionId(section)) selectSection(section);
    };
    document.addEventListener('click', onOverviewClick);
    return () => document.removeEventListener('click', onOverviewClick);
  }, []);

  const ActiveContent = SECTION_CONTENT[activeSection];
  const activeMeta = HELP_SECTIONS.find((s) => s.id === activeSection)!;

  const shell = (
    <div className={variant === 'public' ? 'min-h-screen bg-slate-950 text-slate-200' : ''}>
      {variant === 'public' && (
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 rounded-lg text-slate-400 hover:text-white"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-lg font-display font-bold text-white">User guide</h1>
            </div>
            <Link
              to="/app"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Open {PRODUCT_NAME}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      )}

      <div className={`max-w-5xl mx-auto px-4 py-8 ${variant === 'app' ? 'pb-16' : 'py-10'}`}>
        {variant === 'app' && (
          <div className="flex items-start justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Help &amp; guides
              </h2>
              <p className="text-sm text-slate-400 mt-1">How to use {PRODUCT_NAME} — especially publishing.</p>
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <nav
            className="lg:w-56 shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none"
            aria-label="Help topics"
          >
            {HELP_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold whitespace-nowrap lg:whitespace-normal cursor-pointer transition-colors ${
                  activeSection === section.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                {SECTION_ICONS[section.id]}
                <span>
                  <span className="block">{section.label}</span>
                  <span className="hidden lg:block text-[10px] font-normal text-slate-500 mt-0.5">
                    {section.description}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          <article className="flex-1 min-w-0 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 md:p-6">
            <h3 className="text-lg font-display font-bold text-white mb-4">{activeMeta.label}</h3>
            <ActiveContent />
            {activeSection !== 'post' && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => selectSection('post')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  Need to publish a blog? Read How to post
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </article>
        </div>

        {variant === 'public' && (
          <p className="text-center text-xs text-slate-500 mt-10">
            Full docs also on{' '}
            <a
              href="https://github.com/th3on7in3gam3r/Cadence/tree/main/docs/user-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white inline-flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>
    </div>
  );

  return shell;
}
