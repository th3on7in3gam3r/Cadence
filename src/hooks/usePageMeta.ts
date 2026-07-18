/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  DEFAULT_HOME_DESCRIPTION,
  DEFAULT_HOME_TITLE,
  type PageSeoConfig,
  buildCanonical,
} from '../lib/pageSeo';

function upsertMeta(
  key: string,
  content: string,
  attribute: 'name' | 'property' = 'name',
): HTMLMetaElement {
  const selector = `meta[${attribute}="${key}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
}

function upsertLink(rel: string, href: string): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

interface MetaSnapshot {
  title: string;
  description: string;
  canonical: string | null;
  metas: { key: string; content: string; attribute: 'name' | 'property' }[];
}

function captureSnapshot(): MetaSnapshot {
  const metas: MetaSnapshot['metas'] = [];
  const keys: { key: string; attribute: 'name' | 'property' }[] = [
    { key: 'description', attribute: 'name' },
    { key: 'og:title', attribute: 'property' },
    { key: 'og:description', attribute: 'property' },
    { key: 'og:url', attribute: 'property' },
    { key: 'og:type', attribute: 'property' },
    { key: 'twitter:card', attribute: 'name' },
    { key: 'twitter:title', attribute: 'name' },
    { key: 'twitter:description', attribute: 'name' },
  ];
  for (const { key, attribute } of keys) {
    const el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (el?.getAttribute('content')) {
      metas.push({ key, content: el.getAttribute('content')!, attribute });
    }
  }
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return {
    title: document.title,
    description:
      document.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute('content') ??
      DEFAULT_HOME_DESCRIPTION,
    canonical: canonical?.getAttribute('href') ?? null,
    metas,
  };
}

function applyMeta(config: PageSeoConfig): void {
  const canonical = buildCanonical(config.path);

  document.title = config.title;
  upsertMeta('description', config.description);
  upsertLink('canonical', canonical);

  upsertMeta('og:title', config.title, 'property');
  upsertMeta('og:description', config.description, 'property');
  upsertMeta('og:url', canonical, 'property');
  upsertMeta('og:type', 'website', 'property');

  upsertMeta('twitter:card', 'summary_large_image');
  upsertMeta('twitter:title', config.title);
  upsertMeta('twitter:description', config.description);
}

function restoreSnapshot(snapshot: MetaSnapshot): void {
  document.title = snapshot.title;
  upsertMeta('description', snapshot.description);
  if (snapshot.canonical) {
    upsertLink('canonical', snapshot.canonical);
  } else {
    document.querySelector('link[rel="canonical"]')?.remove();
  }
  for (const { key, content, attribute } of snapshot.metas) {
    upsertMeta(key, content, attribute);
  }
}

/**
 * Updates document title, description, canonical, and Open Graph / Twitter tags per route.
 * Pass `null` to skip (e.g. in-app help embedded in workspace).
 */
export function usePageMeta(config: PageSeoConfig | null): void {
  useEffect(() => {
    if (!config) return undefined;

    const snapshot = captureSnapshot();
    applyMeta(config);

    return () => {
      restoreSnapshot({
        title: DEFAULT_HOME_TITLE,
        description: DEFAULT_HOME_DESCRIPTION,
        canonical: buildCanonical('/'),
        metas: [
          { key: 'og:title', content: DEFAULT_HOME_TITLE, attribute: 'property' },
          { key: 'og:description', content: DEFAULT_HOME_DESCRIPTION, attribute: 'property' },
          { key: 'og:url', content: buildCanonical('/'), attribute: 'property' },
          { key: 'og:type', content: 'website', attribute: 'property' },
          { key: 'twitter:card', content: 'summary_large_image', attribute: 'name' },
          { key: 'twitter:title', content: DEFAULT_HOME_TITLE, attribute: 'name' },
          { key: 'twitter:description', content: DEFAULT_HOME_DESCRIPTION, attribute: 'name' },
        ],
      });
    };
  }, [config?.path, config?.title, config?.description]);
}
