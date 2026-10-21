# GARPUZ

A production-oriented local product search engine for North Cyprus, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase keys.
3. Run the migrations in `supabase/migrations/` in order (001, 002, 003) in the Supabase SQL editor.
4. In Supabase Auth, enable the Google provider, set the site URL, and add `http://localhost:3000/auth/callback` as a redirect URL.
5. Start with `npm run dev`.

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
- `npm run lint` — ESLint with the Next.js and TypeScript rules
- `npm run cf-typegen` — regenerate Cloudflare binding types after changing `wrangler.jsonc`

For local Workers previews, copy `.dev.vars.example` to `.dev.vars` and replace the placeholders. Never commit `.dev.vars` or production secrets.

Public search deliberately returns zero results until approved merchants and real offers are present. Never seed production with fictional offers.

## Database migrations

Apply every migration in order. Each one is additive and safe to re-run:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_admin_dashboard.sql`
3. `supabase/migrations/003_merchant_workspace.sql` — merchant self-service: admin-only listing moderation (`admin_hidden`), shop-added catalog products, locked sign-in email and document path, automatic `updated_at`, and the `merchant_save_offers` function used by "Add product" and catalog import.

## Merchant dashboard

Shop owners sign in with Google at `/business/register`, then give their shop name, category, WhatsApp number and town. (WhatsApp and town are required: public search only shows shops that have both.) In `/dashboard` they can:

- **Products** — add a listing by picking a catalog product or describing a new one, edit price/stock/condition, pause, resume or delete.
- **Import catalog** — upload a CSV (up to 500 rows, 1 MB). The template is at `/dashboard/import/template`. Turkish column names, `;` separators and `1.299,50`-style prices from Turkish Excel are accepted. Rows matching an existing listing (same product, condition and SKU) are updated.
- **Shop profile** — edit contact details and upload a verification document (PDF/JPG/PNG, max 5 MB) to the private `business-verification` bucket.
- **Settings** — language and sign out.

Listings appear in search only when the shop is approved, has WhatsApp and a town, and the listing is active and not hidden by an administrator.

## Languages

The public site and merchant dashboard are available in English and Turkish. The choice is stored in the `garpuz_lang` cookie; first-time visitors get Turkish if their browser prefers it. Strings live in `lib/i18n/dictionaries.ts`. The admin dashboard is English only.

## Admin dashboard

The admin dashboard is available at `/admin`. Access requires a verified Supabase session whose trusted Auth `app_metadata.role` is exactly `admin`. Administrator roles must be assigned with the Supabase Admin API from a secure server or one-off local script using the service-role key; never expose that key in browser code and never store authorization roles in user-editable `user_metadata`.

Every admin Server Action verifies the current user again before using the server-only client. Merchant status changes, product changes, and offer visibility changes are recorded in `admin_audit_logs`.

Hiding an offer sets `admin_hidden`, which only administrators can change, so a shop cannot re-publish a listing an admin has hidden. Catalog products created by shops are labelled "Added by shop" on `/admin/products`.

## Security model

- Public results come only from active offers belonging to approved merchants.
- Business verification files are stored in a private bucket.
- Registration uses server-side Zod validation and the service role only inside the server route.
- Merchant dashboard reads and writes go through the shop owner's own session and are restricted by row-level security. `merchant_save_offers` verifies the caller owns a shop before writing.
- Shops cannot change their approval status, sign-in email, verification document path, or admin moderation flags (enforced by database triggers).
- Uploaded verification documents are checked by file signature, not just the browser-reported type.
- `proxy.ts` refreshes Supabase sessions on each request so sign-ins do not expire mid-session.
- Visitors never need an account to search. Shop owners use Google sign-in, then provide only a shop name and category.
- External URLs are validated and opened with `noopener noreferrer`.
