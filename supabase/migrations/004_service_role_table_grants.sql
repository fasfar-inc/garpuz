-- Grants the server-only service role explicit access to the core tables. Additive and idempotent.
--
-- Migration 001 relied on Supabase's old default of granting every public table to
-- anon, authenticated and service_role. Supabase removed that default for new projects
-- on 30 May 2026 (changelog: "Tables not exposed to Data and GraphQL API automatically"),
-- so on those projects the admin dashboard, verification uploads and WhatsApp click
-- tracking fail with "permission denied for table merchants" (SQLSTATE 42501).
--
-- This does not loosen security: service_role already bypasses row-level security and is
-- only used by verified server code. anon and authenticated privileges are unchanged.
grant select, insert, update, delete on table
  public.merchants,
  public.canonical_products,
  public.merchant_offers
to service_role;
