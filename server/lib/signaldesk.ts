/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const META_MIN = 40;
const ANSWER_MIN = 40;

export type SignalDeskCredentials = {
  siteUrl: string;
  apiKey: string;
  webhookSecret?: string;
};

export function normalizeSignalDeskSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function generateWebhookSecret(): string {
  return `sd_wh_${randomBytes(24).toString('base64url')}`;
}

/** Absolute http(s) cover only — data: / blob / relative are not usable for live publish. */
export function isUsableSignalDeskCoverUrl(url: string | undefined | null): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed || /^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ensureMinLength(value: string, min: number, padWith: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= min) return trimmed;
  const pad = padWith.trim() || 'Signal Desk dispatch.';
  if (!trimmed) {
    return pad.length >= min ? pad : `${pad}${'.'.repeat(min - pad.length)}`;
  }
  const filler = ` ${pad}`;
  let out = trimmed;
  while (out.length < min) out += filler;
  return out.slice(0, Math.max(min, trimmed.length));
}

export async function testSignalDeskConnection(
  credentials: SignalDeskCredentials,
): Promise<{ displayName: string; siteUrl: string }> {
  const siteUrl = normalizeSignalDeskSiteUrl(credentials.siteUrl);
  const res = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
    headers: {
      Authorization: `Bearer ${credentials.apiKey.trim()}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  let body: { name?: string; message?: string } | null = null;
  try {
    body = text ? (JSON.parse(text) as { name?: string; message?: string }) : null;
  } catch {
    throw new Error(
      'Signal Desk returned an invalid response. Confirm the site URL is your deployed Signal Desk origin.',
    );
  }
  if (!res.ok) {
    throw new Error(body?.message || `Signal Desk auth failed (${res.status})`);
  }
  return {
    displayName: body?.name?.trim() || 'Signal Desk',
    siteUrl,
  };
}

export async function publishToSignalDeskApi(input: {
  credentials: SignalDeskCredentials;
  title: string;
  content: string;
  status?: string;
  excerpt?: string;
  featuredMediaUrl?: string;
  metaDescription?: string;
  answerBlock?: string;
  byline?: string;
  slug?: string;
}): Promise<{ postId: number | string | undefined; link?: string; status?: string }> {
  const siteUrl = normalizeSignalDeskSiteUrl(input.credentials.siteUrl);
  const title = input.title.trim() || 'Untitled dispatch';
  const excerptBase =
    (input.excerpt || '').trim() ||
    (input.metaDescription || '').trim() ||
    title;
  const excerptText = ensureMinLength(excerptBase, META_MIN, title);
  const description = ensureMinLength(
    (input.metaDescription || '').trim() || excerptBase,
    META_MIN,
    title,
  );
  const coverRaw = (input.featuredMediaUrl || '').trim();
  const cover = isUsableSignalDeskCoverUrl(coverRaw) ? coverRaw : '';
  const answer = ensureMinLength(
    (input.answerBlock || '').trim() || description || excerptText,
    ANSWER_MIN,
    title,
  );

  const requestedStatus = (input.status || 'draft').trim().toLowerCase();
  let status = requestedStatus || 'draft';
  // Live publish requires an absolute cover URL — mirror CitePilot (downgrade to review).
  if ((status === 'publish' || status === 'scheduled') && !cover) {
    status = 'review';
  }

  const slugHint =
    (input.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || undefined;
  const canonical =
    status === 'publish' || status === 'scheduled'
      ? `${siteUrl}/posts/${slugHint || 'post'}`
      : undefined;

  const payload: Record<string, unknown> = {
    title,
    content: input.content,
    status,
    excerpt: excerptText,
  };
  if (slugHint) payload.slug = slugHint;
  if (cover) payload.featured_media_url = cover;
  payload.meta = {
    description,
    ...(cover ? { cover_image_url: cover } : {}),
    answer_block: answer,
    byline: input.byline?.trim() || undefined,
    ...(canonical ? { canonical_url: canonical } : {}),
  };

  const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.credentials.apiKey.trim()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Signal Desk API error: ${res.status} ${errText.slice(0, 280)}`,
    );
  }

  const post = (await res.json()) as {
    id?: number | string;
    link?: string;
    status?: string;
  };
  return {
    postId: post.id,
    link: post.link,
    status: post.status || status,
  };
}

export function verifySignalDeskWebhookSignature(
  rawBody: string,
  header: string | undefined,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
