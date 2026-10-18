# GARPUZ

A production-oriented local product search engine for North Cyprus, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase keys.
3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
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
- `npm run cf-typegen` — regenerate Cloudflare binding types after changing `wrangler.jsonc`

For local Workers previews, copy `.dev.vars.example` to `.dev.vars` and replace the placeholders. Never commit `.dev.vars` or production secrets.

Public search deliberately returns zero results until approved merchants and real offers are present. Never seed production with fictional offers.

## Admin dashboard

Apply both database migrations in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_admin_dashboard.sql`

The admin dashboard is available at `/admin`. Access requires a verified Supabase session whose trusted Auth `app_metadata.role` is exactly `admin`. Administrator roles must be assigned with the Supabase Admin API from a secure server or one-off local script using the service-role key; never expose that key in browser code and never store authorization roles in user-editable `user_metadata`.

Every admin Server Action verifies the current user again before using the server-only client. Merchant status changes, product changes, and offer visibility changes are recorded in `admin_audit_logs`.

## Security model

- Public results come only from active offers belonging to approved merchants.
- Business verification files are stored in a private bucket.
- Registration uses server-side Zod validation and the service role only inside the server route.
- Merchant dashboard reads are restricted through row-level security.
- Visitors never need an account to search. Shop owners use Google sign-in, then provide only a shop name and category.
- External URLs are validated and opened with `noopener noreferrer`.
