# Guest trial (Supabase anonymous sign-in)

Cadence lets visitors run **one brand analysis** before creating a permanent account. This uses Supabase **anonymous sign-ins**.

## Enable in Supabase (required)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your Cadence project.
2. Go to **Authentication** → **Providers**.
3. Enable **Anonymous sign-ins**.
4. (Recommended) Under **Authentication** → **Settings**, enable automatic identity linking so Google/email sign-up upgrades the guest user instead of creating a duplicate.

No SQL migration is required. Anonymous users appear in `auth.users` with `is_anonymous = true`.

## How it works

| Step | Behavior |
|------|----------|
| Landing **Try free** | `signInAnonymously()` → `/app/onboarding` |
| First analyze | Allowed; recorded as `guest_analyze` in `usage_events` |
| Second analyze / generate / SEO | `403` with `code: GUEST_LIMIT` |
| **Create free account** | Google OAuth or magic link links identity; workspace data stays on the same user row |

## Limits

- **Guests:** 1× `POST /api/analyze` only.
- **Registered free plan:** 1 brand, 3 SEO audits/month (unchanged).

## Troubleshooting

- **"Anonymous sign-ins are disabled"** — enable the provider in Supabase (step above).
- **Guest loses data after sign-up** — enable identity linking in Supabase auth settings; sign in from the in-app guest banner while still on the anonymous session.
