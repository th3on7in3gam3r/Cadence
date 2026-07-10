<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ed160dc4-c4b8-4866-b241-d09a5522c2c9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create your local env file (gitignored):
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - `GEMINI_API_KEY` — [Gemini API key](https://aistudio.google.com/apikey)
   - `CMO_API_TOKEN` and `VITE_CMO_API_TOKEN` — same random secret (e.g. `openssl rand -hex 32`)

   Optionally adjust `APP_URL` (defaults to `http://localhost:3000/` for local dev).

3. Run the app:
   `npm run dev`

4. Open in the browser:
   - **Marketing homepage:** http://localhost:3000/
   - **Product workspace:** http://localhost:3000/app

The server loads `.env` first, then `.env.local` (overrides). Use **`.env.local`** for secrets — never commit real keys to `.env.example`.

### Cloud SaaS mode (accounts, sync, live SEO)

For production-style deployment with user accounts and cloud workspace sync:

1. Create a [Supabase](https://supabase.com) project and run `supabase/schema.sql` in the SQL Editor.
2. Add to `.env.local`:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (client)
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (server)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (Search Console + GA4 OAuth)
3. Enable Google and Email auth providers in Supabase → Authentication.
4. Set `APP_URL` to your public URL (required for OAuth redirects).

When Supabase is configured:
- Users sign in at `/app` (Google or magic link)
- Workspaces sync to Postgres (no localStorage-only data loss)
- `GEMINI_API_KEY` is hosted server-side — users paste a URL and go
- Settings → Integrations wires real GSC/GA4 OAuth and WordPress publishing
- SEO Agent pulls live query/traffic data when integrations are connected

### API security (public deploy)

- `/api/analyze`, `/api/generate-asset`, and `/api/refine` require `Authorization: Bearer <CMO_API_TOKEN>` when `CMO_API_TOKEN` is set (required in production).
- Rate limiting applies per IP (default 40 requests / 15 min).
- In local dev without `CMO_API_TOKEN`, only **localhost** may call protected routes.

### Deep links (shareable URLs)

| URL | View |
|-----|------|
| `/app/brands/{brand-id}` | War Room dashboard |
| `/app/brands/{brand-id}/seo` | SEO Agent |
| `/app/brands/{brand-id}/calendar` | Campaign calendar |
| `/app/assets/blog_post` | Asset workspace |

Brand ID is derived from your site URL (e.g. `acme-com` for `https://acme.com`).

### Tests & CI

```bash
npm run test        # Vitest unit + API tests
npm run test:e2e    # Playwright smoke tests
```

GitHub Actions runs lint + tests on push/PR (`.github/workflows/ci.yml`).

### Legal pages

- `/privacy` · `/terms` · `/security` · `/data-retention`
