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

## Deployment (Vercel)

Production runs on Vercel from the `main` branch using the Next.js framework preset: build command `npm run build` (`next build`), no custom output directory. Every push to `main` deploys to production; pull requests get preview deployments.

Set these in Vercel → Project → Settings → Environment Variables, enabled for **Production** (and Preview if you use previews):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's anon (legacy) or publishable (`sb_publishable_…`) key |
| `SUPABASE_SERVICE_ROLE_KEY` | the same project's service_role (legacy) or secret (`sb_secret_…`) key; mark it Sensitive |
| `NEXT_PUBLIC_SITE_URL` | the canonical https origin, e.g. `https://garpuz.vercel.app` or the custom domain |

Next.js inlines `NEXT_PUBLIC_` values at build time, so **redeploy after changing any of them**. Signed in as an administrator, `/api/admin/health` reports which deployment and commit is running and whether these variables are valid (never their values).

Session refresh runs in `proxy.ts` (Next.js 16's replacement for middleware).

### Rate limiting

`lib/rate-limit.ts` allows 60 searches and 20 WhatsApp click events per minute per IP; beyond that the search API returns 429 and searches and clicks stop being recorded in analytics. The limit is kept in memory per server instance, which stops floods from one client. For a hard global limit, add a Vercel Firewall rule (Project → Firewall → Configure → Rate Limit) on `/search` and `/api/` paths.

Public search deliberately returns zero results until approved merchants and real offers are present. Never seed production with fictional offers.

## Shops ("Add shop" → My shop)

The merchant flow is deliberately short and mobile-first:

1. **Add shop** (`/business/register`) asks for Google sign-in and returns to the same page afterwards. A signed-in user without a shop sees the shop form directly; anyone who already has a shop is sent to My shop (`proxy.ts` redirects before the page streams, and the pages repeat the check).
2. The shop form asks for three things only: shop name, location (town) and WhatsApp number, then **Create shop**. New shops start as `pending` until an administrator approves them; the category is set to `Other` behind the scenes.
3. **My shop** (`/dashboard`) shows the shop's name and location, a small **Edit shop** link, and **+ Add your first product** (later **+ Add product**, which stays pinned to the bottom of the screen on phones).
4. **Add product** asks for the product name (with size where relevant), a category (the homepage categories plus a few broader ones), the price in ₺ and an optional photo, then **Save product** returns to My shop with the product highlighted. Each product can be edited, marked in or out of stock, or deleted.

Product matching happens behind the scenes so customers can compare shops' prices for the same product: the typed name is compared with catalog products' full title ("Apple iPhone 15 128GB") or title without the brand, ignoring case and spacing. A name the catalog does not know becomes a new catalog product with no brand, filed under the chosen category. A matched product keeps its catalog category unless that is `Other`, which the shop's choice fills in (as with photos, a shop never overrides what the catalog already has). Shops have no write access to `canonical_products`; new products and photos are added by server code with the service role after the shop is verified. Photos (JPG, PNG or WebP up to 5 MB, checked by file signature) go to the public `product-images` bucket, created on first upload, and only fill in a product that has no photo yet.

Links to the earlier dashboard screens (`/dashboard/products`, `/dashboard/import`, `/dashboard/settings`, `/dashboard/profile`, `/business/setup`) redirect to the new screens.

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
- Shop creation and edits and products are validated server-side with Zod. The service role is used only for adding shop products and photos to the catalog, analytics and admin actions, always after the caller has been verified.
- Merchant dashboard reads are restricted through row-level security. Owners can only write their own profile fields (column-level grants); status, ownership, email and the verification document path are written only by trusted server code, and the registration number locks once a shop has been reviewed.
- Every response carries a Content-Security-Policy, HSTS, `X-Frame-Options: DENY` and related headers (`next.config.ts`).
- Visitors never need an account to search. Shop owners use Google sign-in, then provide only a shop name and category.
- External URLs are validated and opened with `noopener noreferrer`.
