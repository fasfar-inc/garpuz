# GARPUZ

A production-oriented local product search engine for North Cyprus, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase keys.
3. Run every file in `supabase/migrations/` in order (`001` to `004`) in the Supabase SQL editor.
4. In Supabase Auth, enable the Google provider, set the site URL, and add `http://localhost:3000/auth/callback` as a redirect URL.
5. Start with `npm run dev`.

### Checks

- `npm run lint` — ESLint (Next.js core-web-vitals + TypeScript rules)
- `npm run typecheck` — generates route types and runs `tsc`
- `npm test` — Vitest unit tests (`lib/**/*.test.ts`)

The same checks plus a production build run in GitHub Actions on every push to `main` and every pull request (`.github/workflows/ci.yml`).

## Cloudflare Workers deployment

GARPUZ uses Cloudflare's OpenNext adapter for its existing Next.js 16 App Router application.

### Cloudflare Workers Builds

Connect this GitHub repository to a Workers project and configure:

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`
- Production branch: `main`

Add these values in both **Build variables and secrets** and the Worker's **Runtime variables and secrets**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (set this to the final HTTPS production origin)
- `SUPABASE_SERVICE_ROLE_KEY` as an encrypted secret

The public variables must be available during the build because Next.js inlines `NEXT_PUBLIC_` values. Runtime values are also required by server-rendered pages and route handlers. Wrangler's `keep_vars` setting preserves variables managed in the Cloudflare dashboard during later deployments.

### Commands

- `npm run build` — standard Next.js production build
- `npm run build:cloudflare` — create the deployable Worker in `.open-next`
- `npm run preview:cloudflare` — build and preview in the Workers runtime
- `npm run deploy` — build and deploy immediately
- `npm run cf-typegen` — regenerate Cloudflare binding types after changing `wrangler.jsonc`

Session refresh runs in `proxy.ts` (Next.js 16's replacement for middleware). OpenNext marks Node.js proxy support on Workers as experimental; it has been verified with `npm run preview:cloudflare`, but re-check sign-in after upgrading `@opennextjs/cloudflare`.

`wrangler.jsonc` declares two [rate limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/): `SEARCH_RATE_LIMITER` (60 searches per minute per IP; the search API returns 429 and the search page stops logging analytics beyond it) and `CONTACT_RATE_LIMITER` (20 WhatsApp click events per minute per IP). Without the bindings, for example under `next start`, requests are allowed.

For local Workers previews, copy `.dev.vars.example` to `.dev.vars` and replace the placeholders. Never commit `.dev.vars` or production secrets.

Public search deliberately returns zero results until approved merchants and real offers are present. Never seed production with fictional offers.

## Merchant dashboard

Shops sign in with Google at `/business/register`, enter a shop name and category, and land on `/dashboard`, where they can:

- complete their **shop profile** (WhatsApp number and city are required: listings without a WhatsApp number never appear in search),
- upload a **verification document** (PDF, JPG or PNG up to 5 MB) to the private `business-verification` bucket,
- add **listings** by searching the canonical catalog, then edit prices and stock, hide or delete them,
- **import** many listings from a CSV file (`public/garpuz-catalog-template.csv` shows the format). Rows are matched to catalog products by brand, name and model; unmatched rows are reported by line.

Merchants cannot create catalog products. Administrators add them at `/admin/products`.

## Admin dashboard

The admin dashboard is available at `/admin`. Access requires a verified Supabase session whose trusted Auth `app_metadata.role` is exactly `admin`.

To make someone an administrator, have them sign in with Google once, then run on a trusted machine with `.env.local` filled in:

```bash
npm run admin:grant -- person@example.com            # grant
npm run admin:grant -- person@example.com --revoke   # revoke
```

### Troubleshooting "Admin data could not be loaded"

Signed in as an administrator, open `/api/admin/health`. It checks each table and function the dashboard needs, reports which kind of key `SUPABASE_SERVICE_ROLE_KEY` holds (never its value), and suggests a fix for each failure. The same details are written to the server logs with the prefix `[admin]`.

The most common cause is a Supabase project created after 30 May 2026: those projects no longer grant table access to `service_role` automatically, so the dashboard's queries fail with `permission denied` (`42501`) until `004_service_role_table_grants.sql` is applied.

The script uses the service-role key through the Supabase Admin API. Never expose that key in browser code and never store authorization roles in user-editable `user_metadata`.

Every admin Server Action verifies the current user again before using the server-only client. Merchant status changes, product changes, and offer visibility changes are recorded in `admin_audit_logs`.

## Languages

The public site and merchant dashboard are available in English and Turkish. The language comes from the `garpuz-locale` cookie set by the EN/TR switcher, falling back to the browser's `Accept-Language`. Strings live in `lib/i18n/dictionaries.ts`; the admin dashboard is English only.

## Security model

- Public results come only from active offers belonging to approved merchants.
- Business verification files are stored in a private bucket.
- Shop setup, profile changes, listings and imports are validated server-side with Zod. The service role is used only for the verification upload, analytics and admin actions, always after the caller has been verified.
- Merchant dashboard reads are restricted through row-level security. Owners can only write their own profile fields (column-level grants); status, ownership, email and the verification document path are written only by trusted server code, and the registration number locks once a shop has been reviewed.
- Every response carries a Content-Security-Policy, HSTS, `X-Frame-Options: DENY` and related headers (`next.config.ts`).
- Visitors never need an account to search. Shop owners use Google sign-in, then provide only a shop name and category.
- External URLs are validated and opened with `noopener noreferrer`.
