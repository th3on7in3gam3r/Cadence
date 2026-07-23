/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

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
}): Promise<{ postId: number | string | undefined; link?: string; status?: string }> {
  const siteUrl = normalizeSignalDeskSiteUrl(input.credentials.siteUrl);
  const excerptText = (input.excerpt || '').trim();
  const description =
    (input.metaDescription || '').trim() || excerptText;
  const cover = (input.featuredMediaUrl || '').trim();
  const answer =
    (input.answerBlock || '').trim() || description || excerptText;

  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    status: input.status || 'draft',
    excerpt: excerptText,
  };
  if (cover) payload.featured_media_url = cover;
  payload.meta = {
    description,
    cover_image_url: cover || undefined,
    answer_block: answer,
    byline: input.byline?.trim() || undefined,
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
  return { postId: post.id, link: post.link, status: post.status };
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
