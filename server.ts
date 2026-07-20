import express from "express";
import { existsSync } from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  getSecurityStatus,
  rateLimitExpensiveApis,
  requireApiAccess,
  blockGuestPremium,
  type ApiAuthedRequest,
} from "./server/middleware/security";
import { crawlWebsite } from "./server/seo/crawler";
import type { CrawlMode } from "./server/lib/plans";
import { canRunDeepCrawl, recordDeepCrawl } from "./server/lib/usage";
import workspaceRouter from "./server/routes/workspace";
import integrationsRouter from "./server/routes/integrations";
import growthStackRouter from "./server/routes/growthStack";
import publishRouter from "./server/routes/publish";
import { createSeoIntelRouter } from "./server/routes/seoIntel";
import notificationsRouter from "./server/routes/notifications";
import billingRouter, { handleStripeWebhook } from "./server/routes/billing";
import teamsRouter from "./server/routes/teams";
import studioRouter from "./server/routes/studio";
import pulseRouter from "./server/routes/pulse";
import partnerPulseRouter from "./server/routes/partnerPulse";
import growthStackKeysRouter from "./server/routes/growthStackKeys";
import reportsRouter from "./server/routes/reports";
import { canRunSeoAudit, recordUsageEvent } from "./server/lib/usage";
import { canGuestAnalyze, recordGuestAnalyze, guestLimitResponse } from "./server/lib/guestTrial";
import { emitStudioOpsEvent } from "./server/lib/studioOps";
import { getSupabaseAdmin } from "./server/db/supabaseAdmin";
import type { AuthedRequest } from "./server/middleware/requireUser";
import { formatBrandKitBlock } from "./server/lib/brandKitPrompt";
import { campaignLandingUrl, campaignSlugForAssetType } from "./server/lib/utm";
import { generateStudioImage } from "./server/lib/imagen";
import { isSupabaseConfigured, isHostedAiMode } from "./server/lib/config";
import { requestLogger, metricsHandler } from "./server/lib/metrics";
import { initSentry, logger } from "./server/lib/logger";
import { buildRobotsTxt, buildSitemapXml } from "./server/lib/sitemap";

// Load .env, then .env.local (overrides) — matches README and Vite conventions
const envDir = process.cwd();
const envLocalPath = path.join(envDir, ".env.local");
const envPath = path.join(envDir, ".env");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
} else if (!existsSync(envPath)) {
  dotenv.config();
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

initSentry();
app.use(requestLogger);

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      if (!sig) return res.status(400).send("Missing stripe-signature");
      await handleStripeWebhook(req.body as Buffer, sig);
      res.json({ received: true });
    } catch (e: unknown) {
      logger.error("stripe_webhook_failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      res.status(400).send(`Webhook Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }
);

app.use(express.json({ limit: '2mb' }));

// Initialize Gemini API client lazily to avoid crashing on start if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Simple HTML text extractor for website URLs to avoid CORS blockages
async function fetchWebsiteText(urlStr: string): Promise<string> {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return "";
    const formattedUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    
    const res = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Cadence-Bot/1.0 (Growth Marketing Agent)",
      },
      signal: AbortSignal.timeout(6000), // 6s timeout
    });

    if (!res.ok) {
      return `[Failed to retrieve website. Output HTTP status: ${res.status}]`;
    }

    const html = await res.text();
    // Quick and clean text extraction
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 15000); // Grab up to 15,000 characters
  } catch (error: any) {
    return `[Failed to parse website HTML context. Details: ${error.message || error}]`;
  }
}

// Robust helper to strip markdown formatting, footnote linkages, or ellipses that break JSON parsing
function cleanAndParseJson(rawText: string): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  
  // Strip markdown code block wrappers if present (e.g. ```json ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (initialError: any) {
    console.warn("Standard JSON parse failed, attempting soft cleanup and repair...", initialError.message);
    
    // Attempt 1: Strip Google Search Footnotes/annotations like [1], [2] at the end of key/value structures
    let repaired = cleaned.replace(/\[\d+\]/g, "");
    
    // Attempt 2: If the model generated ellipsis-style laziness truncations like "...", "painPoints": ... ,
    // convert them to valid empty arrays or strings so the brackets line up correctly.
    repaired = repaired.replace(/:\s*\.\.\.\s*([,}\]])/g, ": []$1");
    repaired = repaired.replace(/:\s*\.\.\.\s*$/g, ": []");
    repaired = repaired.replace(/,\s*\.\.\.\s*\]/g, "]");
    repaired = repaired.replace(/\[\s*\.\.\.\s*\]/g, "[]");
    // Lone dots or truncated values (e.g. "keywordGaps":.)
    repaired = repaired.replace(/:\s*\.\s*([,}\]])/g, ": null$1");
    repaired = repaired.replace(/:\s*,/g, ": null,");
    repaired = repaired.replace(/,\s*}/g, "}");
    repaired = repaired.replace(/,\s*]/g, "]");
    
    try {
      return JSON.parse(repaired);
    } catch (secondError: any) {
      console.warn("Cleanup repair failed, attempting JSON block extraction...", secondError.message);
      
      // Attempt 3: Regex extract the outermost JSON object if there's any surrounding conversational noise
      const match = repaired.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (thirdError: any) {
          console.error("Outermost brace extraction failed:", thirdError.message);
          throw initialError;
        }
      }
      throw initialError;
    }
  }
}

/** Call Gemini with JSON schema; retries once if the model returns unparseable JSON. */
async function generateGeminiJson(
  ai: GoogleGenAI,
  opts: {
    model: string;
    contents: string;
    systemInstruction: string;
    responseSchema: object;
    useSearch?: boolean;
  }
): Promise<any> {
  const config: Record<string, unknown> = {
    systemInstruction: opts.systemInstruction,
    responseMimeType: "application/json",
    responseSchema: opts.responseSchema,
  };
  if (opts.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: opts.model,
        contents: attempt === 0 ? opts.contents : `${opts.contents}\n\nIMPORTANT: Return complete, valid JSON only. No truncation. No placeholder dots.`,
        config,
      });
      const text = response.text?.trim();
      if (!text) {
        throw new Error("AI returned an empty response. Check GEMINI_API_KEY and try again.");
      }
      return cleanAndParseJson(text);
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini JSON attempt ${attempt + 1} failed:`, err.message);
    }
  }
  throw lastError || new Error("AI response could not be parsed.");
}

const protectedApi = [requireApiAccess, rateLimitExpensiveApis];
const protectedPremiumApi = [requireApiAccess, blockGuestPremium, rateLimitExpensiveApis];

// 1. Health and Setup Check API (no auth — status only, never exposes secrets)
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    geminiConfigured: hasKey,
    hostedAi: isHostedAiMode(),
    cloudEnabled: isSupabaseConfigured(),
    security: getSecurityStatus(),
  });
});

app.get("/api/metrics", metricsHandler);

// Cloud workspace & integrations (Supabase auth required)
app.use("/api/workspace", workspaceRouter);
app.use("/api/pulse", pulseRouter);
app.use("/api/partner", partnerPulseRouter);
app.use("/api/growth-stack", growthStackKeysRouter);
app.use("/api/integrations/growth-stack", requireApiAccess, growthStackRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/publish", publishRouter);
app.use("/api/seo-intel", requireApiAccess, rateLimitExpensiveApis, createSeoIntelRouter(getAI));
app.use("/api/notifications", requireApiAccess, notificationsRouter);
app.use("/api/billing", requireApiAccess, billingRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/studio", studioRouter);
app.use("/api/reports", reportsRouter);

// 2. Website Analysis API
app.post("/api/analyze", ...protectedApi, async (req, res) => {
  try {
    const userId = (req as ApiAuthedRequest).userId;
    if (userId) {
      const guestCheck = await canGuestAnalyze(userId);
      if (!guestCheck.allowed) {
        return guestLimitResponse(res, guestCheck.reason || "Guest trial limit reached.");
      }
    }

    const { url, goal, brandVoice, customChallenge, brandKit } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Website URL is required." });
    }

    // Attempt to scrape
    const scrapedText = await fetchWebsiteText(url);
    const ai = getAI();

    // Prepare system instructions for AI CMO analysis
    const systemInstruction = `You are Cadence, an elite growth-marketing agency team rolled into a single artificial intelligence.
Your role is to deeply analyze websites, understand user goals, and draft professional, practical, and results-oriented growth marketing materials.
Always respect the client's agency and maintain complete strategic control. Customize advice strictly based on their content, offerings, tone, and strategic positioning.
If the scraped website content indicates page loading failures or placeholder text (like example.com), creatively build a high-caliber strategic marketing campaign for the brand name inferred from the domain or url.

You must respond EXACTLY with a JSON object conforming to the schema.
IMPORTANT JSON SAFETY RULES:
1. Never abbreviate fields or use ellipses (like "...") under any circumstances. In particular, for arrays like "painPoints", "leveragePoints", etc., generate actual list entries and fill every list item completely.
2. Do NOT insert any citations, footnotes, or link annotations (e.g., [1], [2], 【1】, or markdown link brackets) anywhere in the JSON keys or values, as this breaks the schema validation and client parser.`;

    const prompt = `Analyze the business website: ${url}
Loaded Homepage Content/HTML preview:
"""
${scrapedText}
"""

Target growth-marketing goal: ${goal || "General Growth & Conversion"}
Preferred brand voice: ${brandVoice || "Inferred from website content"}
Custom challenges/notes: ${customChallenge || "None provided"}
${formatBrandKitBlock(brandKit)}

Task: Produce a complete, detailed growth strategy summary. If the scrap text was empty, use your knowledge and web tools to research what ${url} is, or build a comprehensive strategic campaign based on that brand's expected service model (e.g. if it is example.com, present a beautiful sample tech platform campaign, but name the brand clearly based on domain text). Make the action plans actionable, realistic and direct. Include a strategic assessment, comprehensive audience persona definition, weaknesses/strengths analysis, and a detailed 30-day tactical marketing calendar.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        brandName: { type: Type.STRING },
        tagline: { type: Type.STRING },
        inferredBrandVoice: { type: Type.STRING, description: "Detailed, colorful description of brand voice (e.g. 'Witty, Intellectual & Sharp')" },
        inferredGrowthGoal: { type: Type.STRING, description: "One of the primary growth objectives: '10x Organic Lead Capture & Conversions', 'Inbound SEO Ranking & Traffic', 'Social Media Authority Building', 'Product Pitch & Launch Strategy', 'E-commerce Conversion Tuning'" },
        colors: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING, description: "Suggested Tailwind primary color class, e.g., 'indigo-600', 'blue-600', 'violet-600', 'zinc-900', 'amber-600'" },
            accent: { type: Type.STRING, description: "Suggested Tailwind accent color class, e.g., 'amber-500', 'rose-500', 'emerald-500', 'cyan-500'" },
            bgStyle: { type: Type.STRING, description: "Background description, e.g. 'slate-50', 'zinc-900', 'neutral-50', 'zinc-950'" }
          },
          required: ["primary", "accent", "bgStyle"]
        },
        strategicSummary: { type: Type.STRING },
        targetAudience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              segmentName: { type: Type.STRING },
              persona: { type: Type.STRING },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              leveragePoints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["segmentName", "persona", "painPoints", "leveragePoints"]
          }
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        positioningText: { type: Type.STRING },
        thirtyDayActionPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.STRING, description: "e.g., 'Week 1', 'Week 2'" },
              focus: { type: Type.STRING },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              expectedOutcome: { type: Type.STRING }
            },
            required: ["week", "focus", "tasks", "expectedOutcome"]
          }
        },
        recommendedChannels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channel: { type: Type.STRING },
              priority: { type: Type.STRING },
              strategy: { type: Type.STRING }
            },
            required: ["channel", "priority", "strategy"]
          }
        }
      },
      required: [
        "brandName",
        "tagline",
        "inferredBrandVoice",
        "inferredGrowthGoal",
        "colors",
        "strategicSummary",
        "targetAudience",
        "strengths",
        "weaknesses",
        "opportunities",
        "positioningText",
        "thirtyDayActionPlan",
        "recommendedChannels"
      ]
    };

    // Call Gemini with search grounding in case they placed a real public URL
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        tools: [{ googleSearch: {} }],
      },
    });

    const parsedData = cleanAndParseJson(response.text?.trim() || "{}");
    if (userId) await recordGuestAnalyze(userId);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Analysis failed:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during analysis." });
  }
});

// 3. Generate Deliverable API
app.post("/api/generate-asset", ...protectedPremiumApi, async (req, res) => {
  try {
    const { assetType, companyInfo, customRequirements, brandKit, brandUrl } = req.body;
    if (!assetType || !companyInfo) {
      return res.status(400).json({ error: "Missing assetType or companyInfo mapping." });
    }

    const ai = getAI();

    let assetPrompt = "";
    switch (assetType) {
      case "seo_keywords":
        assetPrompt = `Create an exhaustive, professional SEO & GEO (Generative Engine Optimization) Strategy report.
GEO stands for Generative Engine Optimization, focused on getting referenced in answers on ChatGPT, Gemini, and search queries on Perplexity.
Provide a list of High-Intent search keywords, content pillars, and specific GEO implementation tips (e.g., structured markup, citation optimization, answering direct customer questions).`;
        break;
      case "blog_post":
        assetPrompt = `Write a comprehensive, professional, search-optimized blog post related to the business's industry, core offering, or pain points.
Include a catchy, SEO-friendly headline (H1), table of contents, introduction, detailed headings (H2/H3), subtopics, an actionable conclusion, and clean formatting.
Optimize for keywords that would rank high and get selected as a citation by generative AI search models.`;
        break;
      case "social_posts":
        assetPrompt = `Create a high-impact social media campaign bundle:
1. X/Twitter Campaign: A 5-tweet micro-thread providing industry value + a final CTA with high-engagement formatting.
2. LinkedIn Campaign: A high-authority story-first update highlighting key data or a case-study narrative.
3. Hook Variations: 3 scroll-stopping variations for posts.
Use spacers, emojis sparingly, and clear visual formatting to keep readers on page.`;
        break;
      case "email_sequence":
        assetPrompt = `Draft a high-conversion 3-stage email marketing sequence for leads/subscribers:
- Email 1 (Warm Welcome & High Value Hook): Introduce value immediately without hard selling. Provide a downloadable freebie context.
- Email 2 (Problem & Solution Narrative): Introduce a relatable customer barrier and show how we solve it. Include subtle client review/testimony placeholders.
- Email 3 (Urgent Call-to-Action / Offer): Clear direct conversion message. Add soft scarcity or limited promotional bonus incentives.
Provide distinct Subject Lines, Preview Texts, body paragraphs, and explicit button CTA tags for all 3 emails.`;
        break;
      case "lead_magnet":
        assetPrompt = `Design a comprehensive, highly-valuable Lead Magnet blueprint and its landing page assets.
Include:
1. Lead Magnet Structure: Title, high-value ebook/spreadsheet index, outline of the introductory training chapters, or actual useful checklists.
2. Landing Page Copy: A high-converting Headline, descriptive Subheadline, 4 high-value bullet benefits, clear action button text, and custom form inputs.`;
        break;
      default:
        return res.status(400).json({ error: `Unsupported assetType: ${assetType}` });
    }

    const systemInstruction = `You are the Lead Copywriter and SEO Director reporting directly to Cadence.
You produce elite-grade copy that immediately increases conversions, builds authorities, and secures direct-to-customer organic reach.
Always review the company brand background, industry category, and inferred voice. Stay inside their visual and language guidelines.

You must respond EXACTLY with a JSON object matching the defined schema structure.`;

    const fullPrompt = `${assetPrompt}
    
Company Strategy Background:
- Name: ${companyInfo.brandName}
- Tagline: ${companyInfo.tagline}
- Strategic Summary: ${companyInfo.strategicSummary}
- Positioning: ${companyInfo.positioningText}
- Core Audience Segment: ${companyInfo.targetAudience?.[0]?.segmentName || "General Customers"}
- Voice Guideline: ${companyInfo.inferredBrandVoice}

User requirements or custom context: ${customRequirements || "Strictly leverage company strategy and brand tone."}
${formatBrandKitBlock(brandKit)}${
      brandUrl &&
      (assetType === "social_posts" ||
        assetType === "email_sequence" ||
        assetType === "blog_post" ||
        assetType === "lead_magnet")
        ? `

Campaign landing URL — use this exact link for every CTA, button, and "learn more" in the asset (do not shorten or change query params):
${campaignLandingUrl(String(brandUrl), {
  campaign: campaignSlugForAssetType(assetType),
  source: "cadence",
  medium:
    assetType === "email_sequence"
      ? "email"
      : assetType === "social_posts"
        ? "social"
        : "referral",
  force: true,
})}`
        : ""
    }`;

    const assetSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING, description: "Strategic CMO note detailing why this asset is optimized specifically for this brand's growth goal." },
        content: { type: Type.STRING, description: "The core content drafted, nicely structured using spacing and Markdown headers (H2, H3, bold text, lists)." },
        taglineOrCTA: { type: Type.STRING, description: "The primary call to action, hook line, or campaign trigger." },
        seoInstructions: { type: Type.STRING, description: "Actionable search engine/generative discovery metadata (suggested URL slugs, keywords, meta descriptions, or prompt optimization hints)." }
      },
      required: ["title", "summary", "content", "taglineOrCTA", "seoInstructions"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: assetSchema,
      }
    });

    const parsedAsset = cleanAndParseJson(response.text?.trim() || "{}");
    res.json(parsedAsset);
  } catch (error: any) {
    console.error("Asset generation failed:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during deliverable generation." });
  }
});

// 4. Refinement / Editing Conversation API
app.post("/api/refine", ...protectedPremiumApi, async (req, res) => {
  try {
    const { assetType, companyInfo, lastDraft, discussionHistory, userFeedback, toneIntensity, brandKit } = req.body;
    if (!assetType || !lastDraft || !userFeedback) {
      return res.status(400).json({ error: "Missing required parameters for refinement." });
    }

    const ai = getAI();

    let toneInstruction = "";
    if (toneIntensity !== undefined) {
      const score = Number(toneIntensity);
      if (score <= 3) {
        toneInstruction = `Tone Adjustment Intensity Level: LOW (${score}/10). The client wants VERY subtle, light, minimal voice and styling modifications. Maintain almost all of the existing framing and content, and only do extremely light smoothing or tiny revisions.`;
      } else if (score <= 7) {
        toneInstruction = `Tone Adjustment Intensity Level: MODERATE (${score}/10). Perform typical balanced brand voice edits. Combine the existing content flow with the user's feedback, implementing smooth, logical styling updates.`;
      } else {
        toneInstruction = `Tone Adjustment Intensity Level: HIGH (${score}/10). The client wants EXTREME, highly intense, and dramatic rewrites. Embody the requested style feedback aggressively, reshaping, extending, or transforming the draft's tone and headings heavily to maximize the specified vibe!`;
      }
    }

    const systemInstruction = `You are Cadence, collaborating with the user to refine marketing drafts.
Your objective is to revise the previous draft based on feedback, detailing your strategic rationale in the summary.
Deliver the updated assets with elite polish. You must respond with a JSON object matching the defined schema structure.`;

    const chatPayload = `You are revising the draft of type "${assetType}".
Company Strategy Background:
- Brand Name: ${companyInfo.brandName}
- Positioning: ${companyInfo.positioningText}
- Voice Tone: ${companyInfo.inferredBrandVoice}
${formatBrandKitBlock(brandKit)}

${toneInstruction ? `${toneInstruction}\n` : ""}

Previous Draft:
=========================================
Title: ${lastDraft.title}
Strategic Note: ${lastDraft.summary}
Content Body:
${lastDraft.content}
CTA: ${lastDraft.taglineOrCTA}
SEO/GEO Guidelines: ${lastDraft.seoInstructions}
=========================================

User Feedback & Corrections:
"${userFeedback}"

${discussionHistory && discussionHistory.length ? `Historical context:\n${discussionHistory.map((h: any) => `${h.role}: ${h.text}`).join("\n")}` : ""}

Task: Provide a fully revised and optimized draft. Implement the user's suggestions precisely while maintaining marketing professionalism and conversion effectiveness.`;

    const refineSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING, description: "A message from Cadence detailing the specific changes, voice tweaks, and strategic adjustments made to accommodate the feedback." },
        content: { type: Type.STRING, description: "The completely updated, fully compiled content piece with neat headings and formatting." },
        taglineOrCTA: { type: Type.STRING },
        seoInstructions: { type: Type.STRING }
      },
      required: ["title", "summary", "content", "taglineOrCTA", "seoInstructions"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatPayload,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: refineSchema,
      }
    });

    const parsedRefinement = cleanAndParseJson(response.text?.trim() || "{}");
    res.json(parsedRefinement);
  } catch (error: any) {
    console.error("Refinement failed:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during refinement." });
  }
});

// 5. SEO Agent — multi-page crawl
app.post("/api/seo-agent/crawl", ...protectedPremiumApi, async (req, res) => {
  try {
    const { url, mode = 'quick' } = req.body as { url: string; mode?: CrawlMode };
    if (!url) return res.status(400).json({ error: "Website URL is required." });

    const crawlMode: CrawlMode = mode === 'deep' ? 'deep' : 'quick';
    const userId = (req as AuthedRequest).userId;
    const gate = await canRunDeepCrawl(userId, crawlMode);
    if (!gate.allowed) {
      return res.status(403).json({
        error: gate.reason,
        plan: gate.plan,
        upgradeRequired: crawlMode === 'deep',
        usage: { deepCrawlPages: gate.usedPages, deepCrawlLimit: gate.pageLimit },
      });
    }

    const result = await crawlWebsite(url, gate.maxPages, { mode: crawlMode });

    if (userId && crawlMode === 'deep') {
      await recordDeepCrawl(userId, result.pagesCrawled, url);
    }

    res.json({
      ...result,
      plan: gate.plan,
      crawlLimits: {
        mode: crawlMode,
        maxPages: gate.maxPages,
        deepCrawlPagesUsed: gate.usedPages + (crawlMode === 'deep' ? result.pagesCrawled : 0),
        deepCrawlPagesLimit: gate.pageLimit,
      },
    });
  } catch (error: any) {
    console.error("SEO crawl failed:", error);
    res.status(500).json({ error: error.message || "Crawl failed." });
  }
});

// 6. SEO Agent — AI strategy, keyword gaps, meta rewrites, 100% roadmap
app.post("/api/seo-agent/audit", ...protectedPremiumApi, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    if (userId) {
      const gate = await canRunSeoAudit(userId);
      if (!gate.allowed) {
        return res.status(403).json({
          error: gate.reason,
          plan: gate.plan,
          usage: { used: gate.used, limit: gate.limit },
        });
      }
    }

    const { url, crawlResult, companyInfo, integrations } = req.body;
    if (!url || !crawlResult) {
      return res.status(400).json({ error: "url and crawlResult are required." });
    }

    const ai = getAI();
    const pageSummaries = (crawlResult.pages || [])
      .slice(0, 15)
      .map((p: any) => ({
        url: p.url,
        title: p.title,
        meta: p.metaDescription,
        h1: p.h1,
        words: p.wordCount,
        issues: (p.issues || []).map((i: any) => i.code).join(", "),
      }));

    const integrationBlock = integrations
      ? `\nConnected SEO stack data:\n${JSON.stringify(integrations, null, 2)}`
      : "";

    const brandContext = companyInfo
      ? `Brand: ${companyInfo.brandName}. Voice: ${companyInfo.inferredBrandVoice}. Summary: ${companyInfo.strategicSummary}`
      : "";

    const prompt = `You are an elite SEO strategist AI agent. Analyze this website crawl and produce a complete SEO audit strategy.

Website: ${url}
${brandContext}

Crawled ${crawlResult.pagesCrawled} pages. Site-wide issues: ${JSON.stringify(crawlResult.siteWideIssues || [])}
Page data: ${JSON.stringify(pageSummaries)}
${integrationBlock}

Tasks:
1. Score overall SEO health (0-100), technical, content, and keyword dimensions.
2. Identify detailed keyword gaps vs likely competitors in this niche (include commercial "money" keywords for B2B if applicable).
3. Suggest priority target keywords with volume tier estimates.
4. Rewrite meta titles and descriptions for up to 8 most important pages (optimized lengths).
5. Build a phased optimization roadmap to reach ~100% site health (3-5 phases with % lift estimates).
6. Create a content plan tying topics to target keywords.
7. If integration data provided, weave GSC/GA4/keyword tool insights into integratedInsights field.

Be specific, actionable, and data-driven. No ellipses in JSON.`;

    const auditSchema = {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.NUMBER },
        technicalScore: { type: Type.NUMBER },
        contentScore: { type: Type.NUMBER },
        keywordScore: { type: Type.NUMBER },
        executiveSummary: { type: Type.STRING },
        keywordGaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              intent: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              opportunityScore: { type: Type.NUMBER },
              currentRanking: { type: Type.STRING },
              recommendedAction: { type: Type.STRING },
              targetPage: { type: Type.STRING },
            },
            required: ["keyword", "intent", "difficulty", "opportunityScore", "currentRanking", "recommendedAction", "targetPage"],
          },
        },
        priorityKeywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              volumeTier: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ["keyword", "volumeTier", "rationale"],
          },
        },
        metaTagRewrites: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              currentTitle: { type: Type.STRING },
              suggestedTitle: { type: Type.STRING },
              currentMetaDescription: { type: Type.STRING },
              suggestedMetaDescription: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ["url", "currentTitle", "suggestedTitle", "currentMetaDescription", "suggestedMetaDescription", "rationale"],
          },
        },
        optimizationRoadmap: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.NUMBER },
              title: { type: Type.STRING },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              impact: { type: Type.STRING },
              estimatedLiftPercent: { type: Type.NUMBER },
            },
            required: ["phase", "title", "tasks", "impact", "estimatedLiftPercent"],
          },
        },
        contentPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              format: { type: Type.STRING },
              targetKeyword: { type: Type.STRING },
              priority: { type: Type.STRING },
            },
            required: ["topic", "format", "targetKeyword", "priority"],
          },
        },
        integratedInsights: { type: Type.STRING },
      },
      required: [
        "overallScore",
        "technicalScore",
        "contentScore",
        "keywordScore",
        "executiveSummary",
        "keywordGaps",
        "priorityKeywords",
        "metaTagRewrites",
        "optimizationRoadmap",
        "contentPlan",
      ],
    };

    const parsed = await generateGeminiJson(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      systemInstruction:
        "You are a senior technical SEO consultant. Output strict JSON only. Never use ellipsis placeholders or lone dots as values.",
      responseSchema: auditSchema,
      // Crawl data is sufficient; googleSearch can corrupt structured JSON output.
      useSearch: false,
    });
    if (userId) {
      await recordUsageEvent(userId, "seo_audit", { url });
      const sb = getSupabaseAdmin();
      const email = sb
        ? (await sb.auth.admin.getUserById(userId)).data.user?.email ?? null
        : null;
      emitStudioOpsEvent({
        product: "cadence",
        event: "seo.audit.completed",
        email,
        externalUserId: userId,
        metadata: {
          url,
          overallScore: parsed.overallScore,
          technicalScore: parsed.technicalScore,
        },
      });
    }
    res.json(parsed);
  } catch (error: any) {
    console.error("SEO audit failed:", error);
    res.status(500).json({ error: error.message || "SEO audit failed." });
  }
});

// 7. SEO Agent — rewrite meta tags for a single page
app.post("/api/seo-agent/rewrite-meta", ...protectedPremiumApi, async (req, res) => {
  try {
    const { url, currentTitle, currentMetaDescription, targetKeyword, brandName } = req.body;
    if (!url) return res.status(400).json({ error: "url is required." });

    const ai = getAI();
    const prompt = `Rewrite SEO meta tags for:
URL: ${url}
Brand: ${brandName || "Unknown"}
Target keyword: ${targetKeyword || "infer from page"}
Current title: ${currentTitle || "(none)"}
Current meta description: ${currentMetaDescription || "(none)"}

Return JSON with suggestedTitle (30-60 chars), suggestedMetaDescription (110-170 chars), and rationale.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        suggestedTitle: { type: Type.STRING },
        suggestedMetaDescription: { type: Type.STRING },
        rationale: { type: Type.STRING },
      },
      required: ["suggestedTitle", "suggestedMetaDescription", "rationale"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    res.json(cleanAndParseJson(response.text?.trim() || "{}"));
  } catch (error: any) {
    console.error("Meta rewrite failed:", error);
    res.status(500).json({ error: error.message || "Meta rewrite failed." });
  }
});

// 8. Campaign Studio — generate hero image with Google Imagen
app.post("/api/generate-image", ...protectedPremiumApi, async (req, res) => {
  try {
    const { prompt, assetType, artisticTheme } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt is required." });
    }
    if (!assetType || typeof assetType !== "string") {
      return res.status(400).json({ error: "assetType is required." });
    }

    const ai = getAI();
    const result = await generateStudioImage(ai, {
      prompt,
      assetType,
      artisticTheme: typeof artisticTheme === "string" ? artisticTheme : undefined,
    });

    const userId = (req as AuthedRequest).userId;
    if (userId) {
      await recordUsageEvent(userId, "imagen_generate", {
        assetType,
        model: result.model,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Image generation failed:", error);
    res.status(500).json({
      error: error.message || "Image generation failed. Check your prompt and try again.",
    });
  }
});


// SEO: sitemap & robots (uses APP_URL / VITE_APP_URL)
app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml");
  res.send(buildSitemapXml());
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain");
  res.send(buildRobotsTxt());
});

// Favicon (browsers request /favicon.ico by default)
app.get("/favicon.ico", (_req, res) => {
  const icoInDist = path.join(process.cwd(), "dist", "favicon.ico");
  const icoInPublic = path.join(process.cwd(), "public", "favicon.ico");
  const svgInDist = path.join(process.cwd(), "dist", "favicon.svg");
  const svgInPublic = path.join(process.cwd(), "public", "favicon.svg");
  if (existsSync(icoInDist)) {
    res.type("image/x-icon");
    res.sendFile(icoInDist);
    return;
  }
  if (existsSync(icoInPublic)) {
    res.type("image/x-icon");
    res.sendFile(icoInPublic);
    return;
  }
  const file = existsSync(svgInDist) ? svgInDist : svgInPublic;
  res.type("image/svg+xml");
  res.sendFile(file);
});

// Configure Vite / static server depending on environment
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info("server_started", {
      port: PORT,
      mode: process.env.NODE_ENV || "development",
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${PORT} is already in use (another dev server is still running).\n` +
          `Free it with:  lsof -i :${PORT} -t | xargs kill\n` +
          `Then run:      npm run dev\n`
      );
      process.exit(1);
    }
    console.error("Server failed to start:", err);
    process.exit(1);
  });
}

setupServer().catch((err) => {
  console.error("Failed to initialize server:", err);
  process.exit(1);
});
