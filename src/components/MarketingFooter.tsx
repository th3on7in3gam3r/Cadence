/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ExternalLink, Layers } from 'lucide-react';
import { BIBLEFUNLAND_STUDIOS_URL, GROWTH_STACK_PRODUCTS, kerygmaHomeUrl, kerygmaPricingUrl, postwickHomeUrl } from '../lib/growthStack';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE, STUDIO_PARENT, showGrowthStackUi } from '../lib/brand';

type FooterVariant = 'landing' | 'studio';

interface MarketingFooterProps {
  variant?: FooterVariant;
  onScrollTo?: (id: string) => void;
  onGetStarted?: () => void;
}

interface FooterLink {
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  to?: string;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-mono font-semibold uppercase tracking-widest text-slate-500 mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.onClick ? (
              <button
                type="button"
                onClick={link.onClick}
                className="text-sm text-slate-400 hover:text-white transition cursor-pointer text-left"
              >
                {link.label}
              </button>
            ) : link.to ? (
              <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition">
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-sm text-slate-400 hover:text-white transition inline-flex items-center gap-1"
              >
                {link.label}
                {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MarketingFooter({
  variant = 'landing',
  onScrollTo,
  onGetStarted,
}: MarketingFooterProps) {
  const stackUi = showGrowthStackUi();
  const scrollLink = (id: string, label: string): FooterLink => ({
    label,
    onClick: () => {
      if (onScrollTo) {
        onScrollTo(id);
        return;
      }
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/') {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = `/#${id}`;
        }
      }
    },
  });

  const productLinks: FooterLink[] =
    variant === 'studio'
      ? [
          scrollLink('pricing', 'Bundle pricing'),
          scrollLink('products', 'All products'),
          scrollLink('persona', 'Find your fit'),
          { label: `Open ${PRODUCT_NAME}`, to: '/app' },
        ]
      : [
          scrollLink('features', 'Features'),
          scrollLink('how-it-works', 'How it works'),
          { label: 'Pricing', to: '/pricing' },
          scrollLink('growth-stack', stackUi ? 'App bundles' : 'Growth Stack'),
          ...(stackUi ? [{ label: 'Studio apps', to: '/studio' }] : []),
          scrollLink('compare', 'Compare tools'),
          scrollLink('faq', 'FAQ'),
          { label: 'User guide', to: '/help' },
          ...(onGetStarted
            ? [{ label: 'Open workspace', onClick: onGetStarted }]
            : [{ label: 'Open workspace', to: '/app' }]),
        ];

  const studioLinks: FooterLink[] = [
    { label: 'Studio apps', to: '/studio' },
    { label: 'Manage billing', to: '/app/settings?tab=billing' },
    { label: 'Connect products', to: '/app/settings?tab=studio' },
    {
      label: 'Bible Funland Studios',
      href: BIBLEFUNLAND_STUDIOS_URL,
      external: true,
    },
  ];

  const stackLinks: FooterLink[] = [
    {
      label: GROWTH_STACK_PRODUCTS.citePilot.name,
      href: GROWTH_STACK_PRODUCTS.citePilot.url,
      external: true,
    },
    {
      label: GROWTH_STACK_PRODUCTS.kerygma.name,
      href: kerygmaHomeUrl('footer-stack'),
      external: true,
    },
    {
      label: GROWTH_STACK_PRODUCTS.postwick.name,
      href: postwickHomeUrl('footer-stack'),
      external: true,
    },
    {
      label: GROWTH_STACK_PRODUCTS.aegis.name,
      href: GROWTH_STACK_PRODUCTS.aegis.url,
      external: true,
    },
    {
      label: 'CitePilot pricing',
      href: `${GROWTH_STACK_PRODUCTS.citePilot.url}/pricing`,
      external: true,
    },
    {
      label: 'Kerygma pricing',
      href: kerygmaPricingUrl('footer-pricing'),
      external: true,
    },
  ];

  const legalLinks: FooterLink[] = [
    { label: 'User guide', to: '/help' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Security', to: '/security' },
  ];

  const BrandIcon = variant === 'studio' ? Layers : BrainCircuit;
  const brandAccent = variant === 'studio' ? 'text-amber-400' : 'text-emerald-400';
  const brandName = variant === 'studio' ? STUDIO_PARENT : PRODUCT_NAME;
  const brandTagline =
    variant === 'studio'
      ? 'Growth stack bundles — strategy, citations, social, and security in one family.'
      : stackUi
        ? `${PRODUCT_SUBTITLE} — part of ${STUDIO_PARENT}.`
        : PRODUCT_SUBTITLE;

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              to={variant === 'studio' ? '/studio' : '/'}
              className="inline-flex items-center gap-2.5 group"
            >
              <div
                className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${brandAccent} group-hover:border-slate-700 transition`}
              >
                <BrandIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-white text-sm block leading-tight">
                  {brandName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  {variant === 'studio' ? 'Growth stack hub' : PRODUCT_TAGLINE}
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-sm">{brandTagline}</p>
            {variant === 'landing' && onGetStarted && (
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                Get started free →
              </button>
            )}
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Product" links={productLinks} />
          </div>
          {stackUi && (
            <>
              <div className="lg:col-span-2">
                <FooterColumn title="Studio" links={studioLinks} />
              </div>
              <div className="lg:col-span-2">
                <FooterColumn title="Growth stack" links={stackLinks} />
              </div>
            </>
          )}
          <div className="lg:col-span-2">
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
          <p>
            © {new Date().getFullYear()} {stackUi ? `Bible Funland Studios. ${PRODUCT_NAME} is part of the growth stack.` : PRODUCT_NAME}
          </p>
          <p className="font-mono text-[10px] text-slate-600">
            {stackUi ? 'Strategy · SEO · Content · Studio bundles' : 'Strategy · SEO · Content'}
          </p>
        </div>
      </div>
    </footer>
  );
}
