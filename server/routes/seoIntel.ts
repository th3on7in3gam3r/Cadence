/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { Type } from '@google/genai';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';

const router = Router();

function getAI(req: { app: { locals: { getAI?: () => unknown } } }) {
  return (req as unknown as { app: { locals: { getAI: () => { models: { generateContent: (opts: unknown) => Promise<{ text?: string }> } } } } }).app.locals.getAI?.()
    || null;
}

// Mounted with getAI injected via closure in server.ts instead — use factory pattern

export function createSeoIntelRouter(getAI: () => { models: { generateContent: (opts: unknown) => Promise<{ text?: string }> } }) {
  const r = Router();

  r.post('/competitor-compare', async (req, res) => {
    try {
      const { yourUrl, competitorUrl, companyInfo } = req.body;
      if (!yourUrl || !competitorUrl) {
        return res.status(400).json({ error: 'yourUrl and competitorUrl are required' });
      }

      const ai = getAI();
      const prompt = `Compare these two websites for SEO and positioning competitive intelligence.

Your site: ${yourUrl}
Competitor: ${competitorUrl}
${companyInfo ? `Brand context: ${companyInfo.brandName}, ${companyInfo.inferredBrandVoice}` : ''}

Return JSON with competitor strengths, weaknesses, keyword overlap themes, and opportunities for your brand.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          competitorUrl: { type: Type.STRING },
          competitorName: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywordOverlap: { type: Type.ARRAY, items: { type: Type.STRING } },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['competitorUrl', 'competitorName', 'strengths', 'weaknesses', 'keywordOverlap', 'opportunities'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });

      const text = response.text?.trim() || '{}';
      res.json(JSON.parse(text));
    } catch (e: unknown) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Competitor compare failed' });
    }
  });

  r.post('/keyword-clusters', async (req, res) => {
    try {
      const { keywordGaps, topQueries, companyInfo } = req.body;
      if (!keywordGaps?.length && !topQueries?.length) {
        return res.status(400).json({ error: 'keywordGaps or topQueries required' });
      }

      const ai = getAI();
      const prompt = `Cluster these keywords into 3-6 thematic groups with content briefs for a B2B/SaaS marketing team.

Keyword gaps: ${JSON.stringify(keywordGaps || [])}
GSC top queries: ${JSON.stringify(topQueries || [])}
Brand: ${companyInfo?.brandName || 'Unknown'}

For each cluster provide: name, keywords array, intent, contentBrief (2-3 sentences), suggestedAssetType (seo_keywords|blog_post|social_posts|email_sequence|lead_magnet).`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          clusters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                intent: { type: Type.STRING },
                contentBrief: { type: Type.STRING },
                suggestedAssetType: { type: Type.STRING },
              },
              required: ['name', 'keywords', 'intent', 'contentBrief'],
            },
          },
        },
        required: ['clusters'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });

      const parsed = JSON.parse(response.text?.trim() || '{"clusters":[]}');
      res.json(parsed);
    } catch (e: unknown) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Clustering failed' });
    }
  });

  return r;
}

export default router;
