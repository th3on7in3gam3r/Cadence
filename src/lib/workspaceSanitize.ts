/**
 * Keep cloud workspace payloads small enough to sync reliably.
 */

import type { AssetHistoryEntry, MarketingAssetType } from '../types';
import type { WorkspacePayload } from './workspaceApi';

const MAX_HISTORY_PER_ASSET = 8;
const MAX_STRING_LENGTH = 120_000;

function trimString(value: string): string {
  if (value.startsWith('data:image/')) return '';
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}\n\n[truncated for cloud sync]`;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return trimString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = sanitizeValue(child);
      if (cleaned !== '' && cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function trimAssetHistory(
  history: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>,
): Partial<Record<MarketingAssetType, AssetHistoryEntry[]>> {
  const trimmed: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>> = {};
  for (const [key, entries] of Object.entries(history || {})) {
    if (!entries?.length) continue;
    trimmed[key as MarketingAssetType] = entries.slice(0, MAX_HISTORY_PER_ASSET);
  }
  return trimmed;
}

export function sanitizeWorkspacePayload(payload: WorkspacePayload): WorkspacePayload {
  const cleaned = sanitizeValue({
    ...payload,
    assetHistory: trimAssetHistory(payload.assetHistory || {}),
    // Crawl/audit blobs can be huge — keep locally, omit from cloud sync
    seoCrawl: null,
    seoAudit: null,
  }) as WorkspacePayload;

  return cleaned;
}

export function estimatePayloadBytes(payload: WorkspacePayload): number {
  try {
    return new Blob([JSON.stringify(payload)]).size;
  } catch {
    return JSON.stringify(payload).length;
  }
}
