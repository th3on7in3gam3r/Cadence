/**
 * Newsletter / Kit subscribe URL used in blog WordPress exports.
 */

const SETTINGS_KEY = 'ai_cmo_system_settings';

export function loadNewsletterSubscribeUrl(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return '';
    const settings = JSON.parse(raw) as { newsletterSubscribeUrl?: string };
    return settings.newsletterSubscribeUrl?.trim() || '';
  } catch {
    return '';
  }
}

export function resolveSubscribeUrl(brandUrl?: string): string {
  const kitUrl = loadNewsletterSubscribeUrl();
  if (kitUrl) return kitUrl;

  const base = brandUrl?.trim() || localStorage.getItem('ai_cmo_brand_url')?.trim() || '';
  if (!base) return '#subscribe';
  const normalized = base.startsWith('http') ? base : `https://${base}`;
  return `${normalized.replace(/\/$/, '')}/#subscribe`;
}
