# Kerygma Social ↔ AI-CMO content handoff

Phase 2 spec — how the two products divide work without merging codebases.

## Product split

| AI-CMO | Kerygma Social |
|--------|----------------|
| Brand strategy & War Room | Social post generation & scheduling |
| SEO Agent (technical + keywords) | Channel publishing (Meta, LinkedIn, X, Pinterest) |
| Long-form assets (blog, email, lead magnet) | Monthly batch approval workflow |
| Campaign ZIP export | Queue + calendar autopilot |
| Agency PDF / white-label SEO reports | Agency multi-client brands |

**Join key:** `brandUrl` (same website URL across products).

## Handoff flows (Phase 1–2)

1. **CitePilot audit → Kerygma** — `kerygmaSignUpUrl(domain)` after citation results (live).
2. **AI-CMO SEO Agent → CitePilot** — `citePilotAuditUrl(domain)` + live citation panel.
3. **AI-CMO SEO Agent → Kerygma** — deep links in `GrowthStackInsights`.

## Phase 2+ export handoff (not built yet)

### Campaign bundle → Kerygma (proposed)

1. User exports **Campaign ZIP** from AI-CMO (existing).
2. Future: `POST /api/import/campaign-bundle` on Kerygma accepts ZIP or JSON manifest:
   - `brandUrl`, `posts[]` (text, channel hints), `seoKeywords[]`
3. Kerygma maps posts into queue as drafts for approval.

### API contract sketch

```json
{
  "brandUrl": "https://example.com",
  "source": "ai-cmo",
  "exportedAt": "2026-07-07T00:00:00Z",
  "posts": [
    { "channel": "linkedin", "body": "...", "scheduledAt": null }
  ]
}
```

## Agency white-label (future)

- AI-CMO PDF: SEO + citation summary (CitePilot API) + security headers (Aegis).
- Kerygma: social performance metrics per client brand.
- Single cover page: Bible Funland Studios agency branding.

## Overlap rule

Do **not** rebuild Kerygma’s scheduler inside AI-CMO or AI-CMO’s SEO crawler inside Kerygma. Link out or import bundles only.
