# Growth stack — deep link contract

Canonical cross-product URLs for Phase 1. Update production hosts here when domains go live.

| Product | Production URL | Local dev |
|---------|----------------|-----------|
| CitePilot | https://getcitepilot.com | GrowthEngineAI dev server |
| Kerygma Social | https://kerygmasocial.com | native-landing `:3001` |
| Aegis Loop | https://aegis-loop.com (→ aegisloop.dev) | `:3847` |
| Pulse | https://pulse-5o1m.onrender.com | http://localhost:3020 |
| **Cadence** | `https://growth.biblefunland.com` | http://localhost:3000 |
| Studio | https://www.biblefunlandstudios.com/ | — |

## Deep links

### CitePilot citation audit

```
https://getcitepilot.com/audit?domain={domain}
```

- `{domain}` = hostname only (no `https://`, no path), e.g. `acme.com`
- Implemented in: `ai-cmo/src/lib/growthStack.ts` → `citePilotAuditUrl()`
- Used in: Cadence SEO Agent overview tab

### Kerygma Social sign-up with website

```
https://kerygmasocial.com/sign-up?url={fullUrl}&redirect_url=/onboarding
```

- `{fullUrl}` = encoded `https://example.com`
- Implemented in: `growthStack.ts` / `growth-stack.ts` → `kerygmaSignUpUrl()`
- Used in: Cadence SEO Agent, CitePilot audit results

### Cadence workspace

```
https://growth.biblefunland.com/app
```

### Cadence studio hub (Phase 5)

```
https://growth.biblefunland.com/studio
https://growth.biblefunland.com/app/studio
GET https://growth.biblefunland.com/api/studio/catalog
```

### Cadence bundle checkout (Phase 4)

```
https://growth.biblefunland.com/app/settings?tab=billing&bundle={growth|social|devsec|studio}
```

- Sister repos: `aiCmoStudioBillingUrl()` / `aiCmoStudioHubUrl()` (legacy function names)
- Set `VITE_APP_URL` / `APP_URL` to `https://growth.biblefunland.com`
- Set `NEXT_PUBLIC_AI_CMO_APP_URL=https://growth.biblefunland.com/app` on Kerygma + CitePilot
- Aegis: `<meta name="growth-stack-ai-cmo-url" content="https://growth.biblefunland.com/app">`

### Aegis Loop

```
https://aegis-loop.com/
```

### Pulse analytics

```
https://pulse-5o1m.onrender.com/?site={siteId}
```

- `{siteId}` = pixel `data-site` id derived from domain (e.g. `biblefunlandstudios.com` → `biblefunlandstudios-com`)
- Implemented in: `ai-cmo/src/lib/growthStack.ts` → `pulseDashboardUrl()`, `pulseSiteIdFromBrandUrl()`
- Used in: Cadence Dashboard + SEO Agent overview (`GrowthStackInsights`)

## API proxy (Cadence server)

| Endpoint | Upstream |
|----------|----------|
| `GET /api/integrations/growth-stack/citepilot/citations?domain=` | `{CITEPILOT_API_URL}/api/v1/citations` |
| `GET /api/integrations/growth-stack/aegis/url-check?url=` | `{AEGIS_API_URL}/api/v1/url-check` |
| `GET /api/integrations/growth-stack/pulse/stats?domain=` | `{PULSE_API_URL}/api/stats?siteId=` |

Optional header: `X-CitePilot-Api-Key` (user Fleet key from Settings → Integrations).

## Code locations

| Repo | Config module |
|------|----------------|
| ai-cmo | `src/lib/growthStack.ts` |
| native-landing | `src/lib/growth-stack.ts` |
| GrowthEngineAI | `src/lib/growth-stack.ts` |
| Aegis Loop | `index.html` meta + inline script |

## Env vars to set in production

```bash
# Cadence (.env.local)
APP_URL=https://growth.biblefunland.com/
VITE_APP_URL=https://growth.biblefunland.com
PULSE_API_URL=https://pulse-5o1m.onrender.com
VITE_PULSE_URL=https://pulse-5o1m.onrender.com

# Kerygma + CitePilot (.env.local)
NEXT_PUBLIC_AI_CMO_APP_URL=https://growth.biblefunland.com/app
NEXT_PUBLIC_AI_CMO_STUDIO_HUB_URL=https://growth.biblefunland.com/studio
```
