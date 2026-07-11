import { describe, it, expect } from 'vitest';
import { sanitizeWorkspacePayload } from './workspaceSanitize';
import type { WorkspacePayload } from './workspaceApi';

describe('sanitizeWorkspacePayload', () => {
  it('strips data URLs and omits heavy seo blobs from cloud sync', () => {
    const payload: WorkspacePayload = {
      brandUrl: 'https://example.com',
      growthGoal: '',
      brandVoice: '',
      customChallenge: '',
      brandAnalysis: null,
      cachedAssets: {
        blog_post: {
          title: 'Test',
          summary: 'Summary',
          content: 'Hello',
          taglineOrCTA: 'CTA',
          seoInstructions: 'data:image/png;base64,' + 'a'.repeat(2000),
        },
      },
      assetHistory: {},
      seoCrawl: { url: 'https://example.com' } as unknown as WorkspacePayload['seoCrawl'],
      seoAudit: { overallScore: 80 } as unknown as WorkspacePayload['seoAudit'],
    };

    const safe = sanitizeWorkspacePayload(payload);
    expect(safe.seoCrawl).toBeNull();
    expect(safe.seoAudit).toBeNull();
    expect(safe.cachedAssets.blog_post?.seoInstructions).toBeFalsy();
  });
});
