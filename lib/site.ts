export const CONTACT_EMAIL = "hello@garpuz.com";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type SocialNetwork = "instagram" | "facebook" | "x";

/**
 * Social profiles shown in the footer. Each appears only when its environment variable holds
 * an https URL (SOCIAL_INSTAGRAM_URL, SOCIAL_FACEBOOK_URL, SOCIAL_X_URL); none are configured by default.
 */
export function socialLinks(): { network: SocialNetwork; href: string }[] {
  const configured: [SocialNetwork, string | undefined][] = [
    ["instagram", process.env.SOCIAL_INSTAGRAM_URL],
    ["facebook", process.env.SOCIAL_FACEBOOK_URL],
    ["x", process.env.SOCIAL_X_URL],
  ];
  return configured.flatMap(([network, href]) => (href?.startsWith("https://") ? [{ network, href }] : []));
}
