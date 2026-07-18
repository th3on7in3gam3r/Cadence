# Studio bundle billing (Phase 4)

AI-CMO is the **Stripe checkout hub** for the Bible Funland growth stack. One customer record; bundle subscriptions fan out entitlements to sister products.

## Bundles

| Bundle ID | Products | AI CMO plan | CitePilot | Kerygma | Aegis |
|-----------|----------|-------------|-----------|---------|-------|
| `growth` | AI CMO + CitePilot | Pro | Pilot | — | — |
| `social` | Kerygma | — | — | Pro | — |
| `devsec` | Aegis | — | — | — | Team |
| `studio` | All four | Team | Fleet | Pro | Team |

Legacy single-app checkout still works: `plan=pro` → `ai_cmo_pro`, `plan=team` → `ai_cmo_team`. Pass `interval=annual` on checkout (or `?interval=annual` in Settings → Billing) to use annual price IDs when configured.

## Stripe Dashboard setup

1. Create **Products** in Stripe (or one Product per bundle).
2. Create **recurring Prices** (monthly) and copy price IDs into `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI CMO only (monthly)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...

# AI CMO only (annual — 20% off; Pro $39/mo billed yearly, Team $119/mo billed yearly)
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAM_ANNUAL=price_...

# Studio bundles
STRIPE_PRICE_BUNDLE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_BUNDLE_SOCIAL_MONTHLY=price_...
STRIPE_PRICE_BUNDLE_DEVSEC_MONTHLY=price_...
STRIPE_PRICE_BUNDLE_STUDIO_MONTHLY=price_...
```

3. Webhook endpoint: `POST https://your-cmo-domain.com/api/billing/webhook`

   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

4. Local testing:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Fan-out to sister products

When a bundle activates, AI-CMO POSTs a signed event to each configured partner URL:

```bash
STUDIO_BILLING_FANOUT_SECRET=long_random_shared_secret
KERYGMA_STUDIO_BILLING_URL=https://kerygmasocial.com/api/partner/studio-billing
CITEPILOT_STUDIO_BILLING_URL=https://getcitepilot.com/api/partner/studio-billing
AEGIS_STUDIO_BILLING_URL=https://aegis-loop.com/api/partner/studio-billing
```

Header: `X-Studio-Billing-Signature` = HMAC-SHA256 hex of raw JSON body.

### Payload shape

```json
{
  "id": "uuid",
  "type": "bundle.activated | bundle.updated | bundle.canceled",
  "bundleId": "growth",
  "supabaseUserId": "...",
  "email": "user@example.com",
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_...",
  "products": ["ai_cmo", "citepilot"],
  "entitlements": { "ai_cmo": { "plan": "pro" }, "citepilot": { "plan": "pilot" } },
  "linkedIds": {
    "clerkId": null,
    "citepilotUserId": null,
    "kerygmaUserId": null,
    "aegisGithubLogin": "octocat"
  },
  "occurredAt": "2026-07-07T12:00:00.000Z"
}
```

Partner apps set the same `STUDIO_BILLING_FANOUT_SECRET` and grant/revoke local plans by `email` or linked ID.

## Supabase

Run `supabase/schema-v4-billing-bundles.sql` after v3.

## Customer portal

Users with any subscription use **Manage all subscriptions** in Settings → Billing. Stripe Customer Portal shows every active subscription on the shared `stripe_customer_id`.
