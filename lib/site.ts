export const CONTACT_EMAIL = "hello@garpuz.com";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
