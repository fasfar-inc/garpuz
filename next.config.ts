import type { NextConfig } from "next";

const supabaseOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin; } catch { return ""; }
})();

// Next.js injects inline bootstrap scripts, so scripts need 'unsafe-inline' without a nonce setup.
// The policy still blocks third-party scripts, framing, plugins and foreign form targets; the one
// exception is Google's sign-in button (accounts.google.com/gsi), used on "Add shop".
const googleSignIn = "https://accounts.google.com/gsi/";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${googleSignIn}client${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' ${googleSignIn}style`,
  `frame-src ${googleSignIn}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${googleSignIn}${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  poweredByHeader: false,
  // Screens from the earlier merchant dashboard, now folded into My shop.
  async redirects() {
    return [
      { source: "/business/setup", destination: "/business/register", permanent: false },
      { source: "/dashboard/profile", destination: "/dashboard/edit", permanent: false },
      { source: "/dashboard/:page(products|import|settings)", destination: "/dashboard", permanent: false },
    ];
  },
  experimental: {
    // Verification documents can be up to 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
};

export default nextConfig;
