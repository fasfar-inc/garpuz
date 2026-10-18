# GARPUZ

A production-oriented local product search engine for North Cyprus, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase keys.
3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
4. In Supabase Auth, enable the Google provider, set the site URL, and add `http://localhost:3000/auth/callback` as a redirect URL.
5. Start with `npm run dev`.

Public search deliberately returns zero results until approved merchants and real offers are present. Never seed production with fictional offers.

## Security model

- Public results come only from active offers belonging to approved merchants.
- Business verification files are stored in a private bucket.
- Registration uses server-side Zod validation and the service role only inside the server route.
- Merchant dashboard reads are restricted through row-level security.
- Visitors never need an account to search. Shop owners use Google sign-in, then provide only a shop name and category.
- External URLs are validated and opened with `noopener noreferrer`.
